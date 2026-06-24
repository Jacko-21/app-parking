export type PublicParkingDto = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  timezone: string;
  offers: PublicParkingOfferDto[];
  activeSpaceCount: number;
  pmrSpaceCount: number;
};

export type PublicParkingOfferDto = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  priceRules: PublicParkingPriceRuleDto[];
};

export type PublicParkingPriceRuleDto = {
  id: string;
  label: string;
  unit: string;
  amountInCents: number;
  currency: string;
};
