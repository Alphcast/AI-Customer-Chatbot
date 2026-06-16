import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    this.logger.error(`${request.method} ${request.url} - ${status}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? message : message.message || message,
      error: typeof message === 'string' ? message : message.error || 'Error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
