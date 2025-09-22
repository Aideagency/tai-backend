// src/common/logging/tracer-logger.ts
import { Injectable, LoggerService, Optional } from '@nestjs/common';
import * as colors from 'colors';
import * as tracer from 'tracer';
import * as ip from 'ip';

type TracerOptions = {
  dateformat?: string;
  context?: string; // optional default context to include in messages
};

@Injectable()
export class TracerLogger implements LoggerService {
  private readonly ipAddress = ip?.address?.() ?? '0.0.0.0';
  private context?: string;
  // Type assertion to any to avoid type incompatibility errors with tracer.colorConsole
  private readonly logger: any;

  constructor(@Optional() opts?: TracerOptions) {
    const dateformat = opts?.dateformat ?? 'isoUtcDateTime';

    this.logger = tracer.colorConsole({
      filters: {
        log: colors.black,
        trace: colors.magenta,
        debug: colors.blue,
        info: colors.blue,
        warn: colors.yellow,
        error: [colors.red, colors.bold],
      },
      format: [
        `{{timestamp}}@${this.ipAddress} <{{title}}> PID:[${process.pid}] {{message}}`,
        {
          error:
            `{{timestamp}}@${this.ipAddress} <{{title}}> PID:[${process.pid}] {{message}}` +
            ` Call Stack:\n{{stack}}`,
        },
      ],
      dateformat,
      preprocess: (data: any) => {
        data.title = String(data.title || '').toUpperCase();
      },
    });

    this.context = opts?.context;
  }

  /**
   * Optionally set a default context that will be appended to each message.
   */
  setContext(context: string) {
    this.context = context;
  }

  // ---- LoggerService API ----
  log(message: any, ...optionalParams: any[]) {
    this.logger.info(this.compose(message, optionalParams));
  }

  error(message: any, trace?: string | Record<string, any>, context?: string) {
    // Nest's error signature allows (message, stack?, context?)
    const final = this.compose(message, context ? [context] : []);
    if (trace) {
      // tracer will print stack when present in error object,
      // so we add a synthetic Error if trace is just a string stack.
      const err = new Error(final);
      (err as any).stack = trace;
      this.logger.error(err);
    } else if (message instanceof Error) {
      this.logger.error(message);
    } else {
      this.logger.error(final);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(this.compose(message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(this.compose(message, optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    // Map Nest "verbose" to tracer "trace" for a nice magenta color
    this.logger.trace(this.compose(message, optionalParams));
  }

  // ---- Convenience aliases (optional) ----
  info(message: any, ...optionalParams: any[]) {
    this.log(message, ...optionalParams);
  }

  // ---- Helpers ----
  private compose(message: any, optionalParams: any[] = []): string {
    const base =
      message instanceof Error
        ? message.stack || message.message
        : typeof message === 'object'
          ? JSON.stringify(message)
          : String(message);

    const extras =
      optionalParams && optionalParams.length
        ? ' ' +
          optionalParams
            .map((x) =>
              x instanceof Error
                ? x.stack || x.message
                : typeof x === 'object'
                  ? JSON.stringify(x)
                  : String(x),
            )
            .join(' ')
        : '';

    const ctx = this.context ? colors.gray(` [${this.context}]`) : '';

    return `${base}${extras}${ctx}`;
  }
}
