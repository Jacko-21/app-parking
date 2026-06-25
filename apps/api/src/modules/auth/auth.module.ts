import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { TenantContextModule } from "../tenant/tenant-context.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./auth-token.service";
import { AuthGuard } from "./auth.guard";
import { PasswordService } from "./password.service";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [TenantContextModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    AuthTokenService,
    // L'ordre compte : AuthGuard résout le contexte avant que RolesGuard ne le lise.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthTokenService, PasswordService],
})
export class AuthModule {}
