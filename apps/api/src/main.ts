import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-DNS-Prefetch-Control", "off");
    response.setHeader("Cross-Origin-Resource-Policy", "same-site");
    next();
  });

  app.enableCors({
    origin: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = Number(process.env["API_PORT"] ?? 3001);
  await app.listen(port);
}

void bootstrap();
