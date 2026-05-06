import { describe, expect, it } from 'vitest';
import { buildReminderIcs } from '@/lib/reminders';
import type { RecommendedAction, ActionPlanProgressEntry } from '@/lib/types';

const baseAction: RecommendedAction = {
  id: 'find-slp',
  title: 'Find a speech therapist',
  description: 'Locate a licensed SLP who specializes in autism.',
  firstMove: 'Ask your pediatrician for a referral.',
  category: 'therapy',
  urgency: 'immediate',
};

const baseEntry: ActionPlanProgressEntry = {
  status: 'in-progress',
  updatedAt: '2026-05-01T10:00:00Z',
  nextFollowUpDate: '2026-06-15',
  reminderLeadDays: 3,
};

describe('buildReminderIcs — valid date', () => {
  it('returns a non-null ICS string for a well-formed date', () => {
    const result = buildReminderIcs(baseAction, baseEntry);
    expect(result).not.toBeNull();
  });

  it('ICS contains required VCALENDAR and VEVENT blocks', () => {
    const result = buildReminderIcs(baseAction, baseEntry)!;
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('BEGIN:VEVENT');
    expect(result).toContain('END:VEVENT');
    expect(result).toContain('END:VCALENDAR');
  });

  it('ICS contains DTSTART and DTEND with correct date', () => {
    const result = buildReminderIcs(baseAction, baseEntry)!;
    expect(result).toContain('DTSTART:20260615T090000');
    expect(result).toContain('DTEND:20260615T093000');
  });

  it('ICS contains the action title in SUMMARY', () => {
    const result = buildReminderIcs(baseAction, baseEntry)!;
    expect(result).toContain('SUMMARY:Follow up: Find a speech therapist');
  });

  it('ICS contains a VALARM section when reminderLeadDays is set', () => {
    const result = buildReminderIcs(baseAction, baseEntry)!;
    expect(result).toContain('BEGIN:VALARM');
    expect(result).toContain('TRIGGER:-P3D');
  });

  it('ICS omits VALARM when reminderLeadDays is null', () => {
    const entry: ActionPlanProgressEntry = { ...baseEntry, reminderLeadDays: null };
    const result = buildReminderIcs(baseAction, entry)!;
    expect(result).not.toContain('BEGIN:VALARM');
  });

  it('returns null when nextFollowUpDate is missing', () => {
    const entry: ActionPlanProgressEntry = { ...baseEntry, nextFollowUpDate: undefined };
    expect(buildReminderIcs(baseAction, entry)).toBeNull();
  });
});

describe('buildReminderIcs — malformed date guard (#3 fix)', () => {
  it('returns null for a completely non-date string', () => {
    const entry: ActionPlanProgressEntry = { ...baseEntry, nextFollowUpDate: 'not-a-date' };
    expect(buildReminderIcs(baseAction, entry)).toBeNull();
  });

  it('returns null for a partial date with missing day', () => {
    const entry: ActionPlanProgressEntry = { ...baseEntry, nextFollowUpDate: '2026-06' };
    expect(buildReminderIcs(baseAction, entry)).toBeNull();
  });

  it('returns null for a zero-year date (would have produced year-1900 ICS before fix)', () => {
    const entry: ActionPlanProgressEntry = { ...baseEntry, nextFollowUpDate: '0000-06-15' };
    expect(buildReminderIcs(baseAction, entry)).toBeNull();
  });

  it('returns null for empty string date', () => {
    const entry: ActionPlanProgressEntry = { ...baseEntry, nextFollowUpDate: '' };
    expect(buildReminderIcs(baseAction, entry)).toBeNull();
  });
});
