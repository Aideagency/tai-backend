import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  // Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import axiosRetry from 'axios-retry';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
// import { ExternalCallLogEntity } from 'src/database/entities/external-call-logs.entity';
// import { ExternalCallLogRepository } from 'src/repository/external-call-logs/external-call-logs.repository';
import * as http from 'http';
import * as https from 'https';
// import { SentryLogger } from 'src/infrastructure/logger/logger.service';
// import { CSCSCallLogRepository } from 'src/repository/cscs-call-log/cscs-call-log.repository';
// import { response } from 'express';
import { TracerLogger } from '../logger/logger.service';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
interface RequestOptions {
  url: string;
  method: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

const TIMEOUT_MS = 600000; // 10 minutes
const RETRY_COUNT = 3; // Number of retry attempts
const RETRY_DELAY = 500; // 1/2 second between retries

// HTTP and HTTPS agents
export const httpAgent = new http.Agent({ keepAlive: false });
export const httpsAgent = new https.Agent({ keepAlive: false });

@Injectable()
export class CommonHttpService {
  private readonly axiosInstance;
  private readonly cscsDomain = 'cscs.ng';

  constructor(
    @Inject('Logger')
    private readonly logger: TracerLogger,
    private readonly httpService: HttpService,
    // private readonly externalCallLogsRepository: ExternalCallLogRepository,
    // private readonly cscsCallLogRepository: CSCSCallLogRepository,
  ) {
    this.logger.setContext(CommonHttpService.name);

    this.axiosInstance = this.httpService.axiosRef;

    // Set default timeout
    this.axiosInstance.defaults.timeout = TIMEOUT_MS;

    // Configure retry mechanism
    axiosRetry(this.axiosInstance, {
      retries: RETRY_COUNT,
      retryDelay: (retryCount) => RETRY_DELAY * retryCount, // Exponential backoff
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.code === 'ECONNABORTED',
    });
  }

  /**
   * Safely extracts essential information from error response without circular references
   */
  private extractSafeErrorResponse(error: any): any {
    if (!error?.response) {
      return { message: 'No response data available' };
    }

    try {
      // Extract only the essential, serializable parts of the response
      const safeResponse = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: this.extractSafeHeaders(error.response.headers),
      };

      return safeResponse;
    } catch (extractError) {
      this.logger.error(
        `Error extracting safe response: ${extractError.message}`,
      );
      return {
        status: error.response?.status || 'unknown',
        statusText: error.response?.statusText || 'unknown',
        message: 'Error extracting response data',
      };
    }
  }

  /**
   * Safely extracts headers without circular references
   */
  private extractSafeHeaders(headers: any): Record<string, string> {
    try {
      if (!headers) return {};

      // If it's already a plain object, return it
      if (headers.constructor === Object) {
        return headers;
      }

      // If it's an AxiosHeaders object or similar, convert to plain object
      const safeHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string' || typeof value === 'number') {
          safeHeaders[key] = String(value);
        }
      }
      return safeHeaders;
    } catch (error) {
      this.logger.error(`Error extracting headers: ${error.message}`);
      return {};
    }
  }

  /**
   * Safely stringify data with circular reference handling
   */
  private safeStringify(data: any): string | null {
    if (data === null || data === undefined) {
      return null;
    }

    try {
      return JSON.stringify(data, (key, value) => {
        // Handle circular references by replacing with a reference marker
        if (typeof value === 'object' && value !== null) {
          if (this.seen?.has(value)) {
            return '[Circular Reference]';
          }
          this.seen?.add(value);
        }
        return value;
      });
    } catch (error) {
      this.logger.error(`Error stringifying data: ${error.message}`);
      return '[Error: Cannot stringify data]';
    } finally {
      // Reset the seen set for next use
      this.seen = new WeakSet();
    }
  }

  private seen = new WeakSet();



  private async makeRequest<T = any>({
    url,
    method,
    data,
    headers = {},
    params = {},
  }: RequestOptions): Promise<T> {
    const startTime = Date.now();

    // Remove null and undefined params
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );

    const config: AxiosRequestConfig = {
      url,
      method,
      headers,
      params: sanitizedParams,
      data,
      httpAgent,
      httpsAgent,
    };

    try {
      const response: AxiosResponse<T> =
        await this.axiosInstance.request(config);

      return response.data;
    } catch (error) {
      const errorResponse = error?.response?.data || 'Error making request';

      // Log error details for debugging (but don't include in response)
      this.logger.error('HTTP request failed', {
        method,
        url,
        status: error?.response?.status,
        errorMessage: error.message,
        errorData: errorResponse,
        responseTime: Date.now() - startTime,
      });

      if (error.code === 'ECONNABORTED') {
        throw new BadRequestException(
          `Request timed out after ${TIMEOUT_MS / 1000} seconds`,
        );
      }

      // Get HTTP status code from response if available
      const statusCode = error?.response?.status || 500;

      // Extract error message from various common patterns
      let errorMessage = 'An unexpected error occurred';

      if (typeof errorResponse === 'string') {
        // Simple string message
        errorMessage = errorResponse;
      } else if (typeof errorResponse === 'object') {
        // Case 1: Our specific third-party format with details field
        if (errorResponse.details) {
          errorMessage = errorResponse.details;
        }
        // Case 2: Common message field pattern
        else if (errorResponse.message) {
          errorMessage = errorResponse.message;
        }
        // Case 3: error_message pattern
        else if (errorResponse.error_message) {
          errorMessage = errorResponse.error_message;
        }
        // Case 4: errorMessage pattern
        else if (errorResponse.errorMessage) {
          errorMessage = errorResponse.errorMessage;
        }
        // Case 5: description pattern
        else if (errorResponse.description) {
          errorMessage = errorResponse.description;
        }
        // Case 6: error object with message
        else if (
          errorResponse.error &&
          typeof errorResponse.error === 'object' &&
          errorResponse.error.message
        ) {
          errorMessage = errorResponse.error.message;
        }
        // Case 7: error as string
        else if (
          errorResponse.error &&
          typeof errorResponse.error === 'string'
        ) {
          errorMessage = errorResponse.error;
        }
        // Case 8: errors array
        else if (
          Array.isArray(errorResponse.errors) &&
          errorResponse.errors.length > 0
        ) {
          // Join multiple errors or take the first one
          if (typeof errorResponse.errors[0] === 'string') {
            errorMessage = errorResponse.errors.join('; ');
          } else if (
            typeof errorResponse.errors[0] === 'object' &&
            errorResponse.errors[0].message
          ) {
            errorMessage = errorResponse.errors
              .map((e) => e.message)
              .join('; ');
          }
        }
      }

      switch (statusCode) {
        case 400:
          throw new BadRequestException(errorMessage);
        case 401:
          throw new UnauthorizedException(errorMessage);
        case 403:
          throw new ForbiddenException(errorMessage);
        case 404:
          throw new NotFoundException(errorMessage);
        case 429:
          throw new HttpException(errorMessage || 'Too Many Requests', 429);
        default:
          if (statusCode >= 400 && statusCode < 500) {
            throw new HttpException(errorMessage, statusCode);
          } else {
            throw new InternalServerErrorException(errorMessage);
          }
      }
    }
  }

  async get<T = any>(url: string, headers = {}, params = {}): Promise<T> {
    return this.makeRequest({ url, method: 'GET', headers, params });
  }

  async post<T = any>(url: string, data: any, headers = {}): Promise<T> {
    return this.makeRequest({ url, method: 'POST', data, headers });
  }

  async put<T = any>(url: string, data: any, headers = {}): Promise<T> {
    return this.makeRequest({ url, method: 'PUT', data, headers });
  }

  async delete<T = any>(url: string, headers = {}): Promise<T> {
    return this.makeRequest({ url, method: 'DELETE', headers });
  }

  async patch<T = any>(url: string, data: any, headers = {}): Promise<T> {
    return this.makeRequest({ url, method: 'PATCH', data, headers });
  }
}
