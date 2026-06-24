import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ReservationStatus, SpaceType } from "@prisma/client";
import {
  getCapacityAvailability,
  quoteStaticPrice,
  type ExistingReservation,
  type TenantContext,
} from "@bingoz/domain";

import { PrismaService } from "../database/prisma.service";
import {
  type PublicParkingDto,
  type PublicParkingOfferDto,
  type PublicParkingPriceRuleDto,
} from "./dto/public-parking.dto";
import { type QuoteReservationDto, quoteReservationSchema } from "./dto/quote-reservation.dto";

const BLOCKING_RESERVATION_STATUSES = [
  ReservationStatus.pending_payment,
  ReservationStatus.confirmed,
  ReservationStatus.completed,
];

export type ParkingSummary = {
  id: string;
  slug: string;
  name: string;
  city: string;
  isPublished: boolean;
  occupancyRate: number;
  activeReservations: number;
  activeSpaces: number;
};

export type PublicReservationQuote = {
  parkingId: string;
  offerId: string;
  amountInCents: number;
  currency: "EUR";
  billableUnits: number;
  available: boolean;
  remainingSpaces: number;
};

@Injectable()
export class ParkingService {
  constructor(private readonly prisma: PrismaService) {}

  async listParkings(context: TenantContext): Promise<ParkingSummary[]> {
    const parkings = await this.prisma.parking.findMany({
      where: {
        tenantId: context.tenantId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        isPublished: true,
      },
    });

    return Promise.all(
      parkings.map(async (parking) => {
        const [activeSpaces, activeReservations] = await Promise.all([
          this.prisma.space.count({
            where: {
              tenantId: context.tenantId,
              parkingId: parking.id,
              isActive: true,
            },
          }),
          this.prisma.reservation.count({
            where: {
              tenantId: context.tenantId,
              parkingId: parking.id,
              status: {
                in: BLOCKING_RESERVATION_STATUSES,
              },
              endsAt: {
                gt: new Date(),
              },
            },
          }),
        ]);

        return {
          ...parking,
          activeSpaces,
          activeReservations,
          occupancyRate: activeSpaces === 0 ? 0 : activeReservations / activeSpaces,
        };
      }),
    );
  }

  async getPublicParking(slug: string): Promise<PublicParkingDto> {
    const parking = await this.prisma.parking.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        postalCode: true,
        countryCode: true,
        timezone: true,
        isPublished: true,
        spaces: {
          where: {
            isActive: true,
          },
          select: {
            type: true,
          },
        },
        offers: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            priceRules: {
              orderBy: {
                createdAt: "asc",
              },
              select: {
                id: true,
                label: true,
                unit: true,
                amountInCents: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    if (!parking || !parking.isPublished) {
      throw new NotFoundException("Parking public introuvable.");
    }

    return {
      id: parking.id,
      slug: parking.slug,
      name: parking.name,
      address: parking.address,
      city: parking.city,
      postalCode: parking.postalCode,
      countryCode: parking.countryCode,
      timezone: parking.timezone,
      activeSpaceCount: parking.spaces.length,
      pmrSpaceCount: parking.spaces.filter((space) => space.type === SpaceType.pmr).length,
      offers: parking.offers.map((offer): PublicParkingOfferDto => {
        return {
          id: offer.id,
          name: offer.name,
          type: offer.type,
          description: offer.description,
          priceRules: offer.priceRules.map((rule): PublicParkingPriceRuleDto => {
            return {
              id: rule.id,
              label: rule.label,
              unit: rule.unit,
              amountInCents: rule.amountInCents,
              currency: rule.currency,
            };
          }),
        };
      }),
    };
  }

  async quotePublicReservation(slug: string, input: QuoteReservationDto): Promise<PublicReservationQuote> {
    const dto = this.parseQuoteReservation(input);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException("La fin de réservation doit être après le début.");
    }

    const parking = await this.prisma.parking.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        tenantId: true,
        isPublished: true,
      },
    });

    if (!parking || !parking.isPublished) {
      throw new NotFoundException("Parking public introuvable.");
    }

    const offer = await this.prisma.offer.findFirst({
      where: {
        tenantId: parking.tenantId,
        parkingId: parking.id,
        id: dto.offerId,
        isActive: true,
      },
      select: {
        id: true,
        priceRules: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            id: true,
            label: true,
            unit: true,
            amountInCents: true,
          },
        },
      },
    });

    const priceRule = offer?.priceRules[0];

    if (!offer || !priceRule) {
      throw new NotFoundException("Offre active introuvable pour ce parking.");
    }

    const [activeSpaceCount, overlappingReservations] = await Promise.all([
      this.prisma.space.count({
        where: {
          tenantId: parking.tenantId,
          parkingId: parking.id,
          isActive: true,
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          tenantId: parking.tenantId,
          parkingId: parking.id,
          status: {
            in: BLOCKING_RESERVATION_STATUSES,
          },
          startsAt: {
            lt: endsAt,
          },
          endsAt: {
            gt: startsAt,
          },
        },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    const availability = getCapacityAvailability(
      { startsAt, endsAt },
      overlappingReservations.map((reservation): ExistingReservation => {
        return {
          id: reservation.id,
          status: reservation.status,
          startsAt: reservation.startsAt,
          endsAt: reservation.endsAt,
        };
      }),
      activeSpaceCount,
    );
    const quote = quoteStaticPrice({
      startsAt,
      endsAt,
      rule: {
        id: priceRule.id,
        label: priceRule.label,
        unit: priceRule.unit,
        amountInCents: priceRule.amountInCents,
      },
    });

    return {
      parkingId: parking.id,
      offerId: offer.id,
      amountInCents: quote.amountInCents,
      currency: quote.currency,
      billableUnits: quote.billableUnits,
      available: availability.available,
      remainingSpaces: availability.remaining,
    };
  }

  private parseQuoteReservation(input: QuoteReservationDto): QuoteReservationDto {
    const parsed = quoteReservationSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return parsed.data;
  }
}
