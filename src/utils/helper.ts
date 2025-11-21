import * as bcrypt from 'bcrypt';
import { Request } from 'express';

export class Helper {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  static randomRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0];

    return ip || req.ip;
  }

  static getCurrentTimeDescription(): string {
    return new Date().toUTCString();
  }

  static formatDateTime(
    date: Date | string | number,
    format: string = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }

    const pad = (val: number) => String(val).padStart(2, '0');

    const map: Record<string, string> = {
      YYYY: String(d.getFullYear()),
      MM: pad(d.getMonth() + 1),
      DD: pad(d.getDate()),
      HH: pad(d.getHours()),
      mm: pad(d.getMinutes()),
      ss: pad(d.getSeconds()),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched]);
  }
}
