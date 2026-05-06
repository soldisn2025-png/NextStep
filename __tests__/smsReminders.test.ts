import { describe, expect, it } from 'vitest';
import {
  buildSmsReminderMessage,
  normalizeUsPhoneNumber,
  formatUsPhoneNumber,
  getDaysUntilInTimeZone,
  shouldSendReminderThisHour,
} from '@/lib/smsReminders';

describe('buildSmsReminderMessage', () => {
  it('uses planUrl directly without appending any path', () => {
    const result = buildSmsReminderMessage(
      'Find a speech therapist',
      '2026-06-15',
      'https://nextstep-autism-pilot.vercel.app/intake'
    );
    expect(result).toContain('https://nextstep-autism-pilot.vercel.app/intake');
    expect(result).not.toContain('/intake/intake');
  });

  it('does not hardcode /intake — caller controls the full URL', () => {
    const result = buildSmsReminderMessage(
      'Apply for insurance',
      '2026-07-01',
      'https://example.com/plan'
    );
    expect(result).toContain('https://example.com/plan');
    expect(result).not.toMatch(/\/intake$/);
  });

  it('includes the action title in the message', () => {
    const result = buildSmsReminderMessage(
      'Contact the school district',
      '2026-08-10',
      'https://nextstep-autism-pilot.vercel.app/intake'
    );
    expect(result).toContain('"Contact the school district"');
  });

  it('includes a formatted date in the message', () => {
    const result = buildSmsReminderMessage(
      'Review IEP',
      '2026-05-20',
      'https://nextstep-autism-pilot.vercel.app/intake'
    );
    expect(result).toContain('May 20, 2026');
  });
});

describe('normalizeUsPhoneNumber', () => {
  it('normalizes a 10-digit number', () => {
    expect(normalizeUsPhoneNumber('4085551234')).toBe('+14085551234');
  });

  it('normalizes with formatting characters', () => {
    expect(normalizeUsPhoneNumber('(408) 555-1234')).toBe('+14085551234');
  });

  it('normalizes an 11-digit number starting with 1', () => {
    expect(normalizeUsPhoneNumber('14085551234')).toBe('+14085551234');
  });

  it('accepts already-normalized E.164 number', () => {
    expect(normalizeUsPhoneNumber('+14085551234')).toBe('+14085551234');
  });

  it('returns null for invalid numbers', () => {
    expect(normalizeUsPhoneNumber('12345')).toBeNull();
    expect(normalizeUsPhoneNumber('not-a-number')).toBeNull();
  });
});

describe('formatUsPhoneNumber', () => {
  it('formats a valid normalized number', () => {
    expect(formatUsPhoneNumber('+14085551234')).toBe('(408) 555-1234');
  });

  it('returns the original value for invalid input', () => {
    expect(formatUsPhoneNumber('invalid')).toBe('invalid');
  });
});

describe('getDaysUntilInTimeZone', () => {
  it('returns 0 when follow-up date is today', () => {
    const today = new Date('2026-05-06T14:00:00Z');
    const result = getDaysUntilInTimeZone('2026-05-06', 'America/New_York', today);
    expect(result).toBe(0);
  });

  it('returns positive number for future dates', () => {
    const today = new Date('2026-05-06T14:00:00Z');
    const result = getDaysUntilInTimeZone('2026-05-10', 'America/New_York', today);
    expect(result).toBe(4);
  });

  it('returns negative number for past dates', () => {
    const today = new Date('2026-05-06T14:00:00Z');
    const result = getDaysUntilInTimeZone('2026-05-01', 'America/New_York', today);
    expect(result).toBe(-5);
  });

  it('returns null for a malformed date string', () => {
    const today = new Date('2026-05-06T14:00:00Z');
    const result = getDaysUntilInTimeZone('not-a-date', 'America/New_York', today);
    expect(result).toBeNull();
  });
});

describe('shouldSendReminderThisHour', () => {
  it('returns true at 9 AM in the given timezone', () => {
    // 9 AM EDT (May = UTC-4) = 13:00 UTC
    const at9amEdt = new Date('2026-05-06T13:00:00Z');
    expect(shouldSendReminderThisHour('America/New_York', at9amEdt)).toBe(true);
  });

  it('returns false at other hours', () => {
    // 8 AM EDT (May = UTC-4) = 12:00 UTC
    const at8amEdt = new Date('2026-05-06T12:00:00Z');
    expect(shouldSendReminderThisHour('America/New_York', at8amEdt)).toBe(false);
  });

  it('returns false for an invalid timezone', () => {
    expect(shouldSendReminderThisHour('Not/ATimezone')).toBe(false);
  });
});
