import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { AuthService, type LoginResult } from "./auth.service";
import { type LoginDto } from "./dto/login.dto";
import { Public } from "./decorators/public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto): Promise<LoginResult> {
    return this.authService.login(body);
  }
}
