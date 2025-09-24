import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// ---- IsYYYYMMDDDate ----
@ValidatorConstraint({ name: 'IsYYYYMMDDDate', async: false })
export class IsYYYYMMDDDateConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (typeof value !== 'string') return false;

    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;

    const y = +m[1],
      mm = +m[2],
      d = +m[3];
    const dt = new Date(Date.UTC(y, mm - 1, d));

    // must round-trip to same Y-M-D (catches 2024-02-30 etc.)
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === mm - 1 &&
      dt.getUTCDate() === d
    );
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Birth date must be a valid calendar date in YYYY-MM-DD format';
  }
}

export function IsYYYYMMDDDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'IsYYYYMMDDDate',
      target: object.constructor,
      propertyName,
      options,
      validator: IsYYYYMMDDDateConstraint,
    });
}

// ---- NoFutureDate ----
@ValidatorConstraint({ name: 'NoFutureDate', async: false })
export class NoFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (typeof value !== 'string') return false;

    // Parse as local-less date by appending Z to avoid TZ shifts
    const dt = new Date(value + 'T00:00:00Z');
    if (isNaN(dt.getTime())) return false;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return dt <= today;
  }

  defaultMessage() {
    return 'Birth date cannot be in the future';
  }
}

export function NoFutureDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'NoFutureDate',
      target: object.constructor,
      propertyName,
      options,
      validator: NoFutureDateConstraint,
    });
}
