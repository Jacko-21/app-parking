import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

type ErrorBody = {
  statusCode: number;
  message: unknown;
  error: string;
};

/**
 * Filtre global : formate les erreurs de manière homogène et évite de fuiter
 * les détails internes (stack, message Prisma) sur les erreurs 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      response.status(status).json(this.buildBody(status, responseBody));
      return;
    }

    this.logger.error("Erreur non gérée", exception instanceof Error ? exception.stack : String(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur.",
      error: "Internal Server Error",
    });
  }

  private buildBody(status: number, responseBody: string | object): ErrorBody {
    if (typeof responseBody === "string") {
      return { statusCode: status, message: responseBody, error: HttpStatus[status] ?? "Error" };
    }

    const body = responseBody as Record<string, unknown>;
    return {
      statusCode: status,
      message: body["message"] ?? responseBody,
      error: typeof body["error"] === "string" ? body["error"] : (HttpStatus[status] ?? "Error"),
    };
  }
}
