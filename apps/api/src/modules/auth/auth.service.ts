import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";
import { AuthTokenService } from "./auth-token.service";
import { type LoginDto, loginSchema } from "./dto/login.dto";
import { PasswordService } from "./password.service";

export type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(input: LoginDto): Promise<LoginResult> {
    const dto = this.parseLogin(input);

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
      select: { id: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !user.passwordHash || !this.passwordService.verify(dto.password, user.passwordHash)) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const token = this.authTokenService.sign({
      userId: user.id,
      tenantId: tenant.id,
      roles: [user.role],
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    };
  }

  private parseLogin(input: LoginDto): LoginDto {
    const parsed = loginSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    return parsed.data;
  }
}
