import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/decorators/public.decorator";

@Public()
@Controller("health")
export class HealthController {
  @Get()
  getHealth(): { status: "ok"; service: string } {
    return {
      status: "ok",
      service: "bingoz-api",
    };
  }
}
