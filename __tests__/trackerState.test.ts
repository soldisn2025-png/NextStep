import { describe, expect, it } from 'vitest';
import { createActionPlanEntry, getTrackerShouldStartExpanded } from '@/lib/actionPlanState';

const emptyEntry = createActionPlanEntry(undefined, {});
const entryWithNotes = createActionPlanEntry({ notes: 'Called Monday' }, {});
const entryWithDates = createActionPlanEntry(
  { lastContactDate: '2026-04-01', nextFollowUpDate: '2026-05-01' },
  {}
);

describe('getTrackerShouldStartExpanded', () => {
  describe('always closed by default (no urgency signals)', () => {
    it('returns false for a fresh entry with no data', () => {
      expect(getTrackerShouldStartExpanded('not-started', 'neutral', emptyEntry)).toBe(false);
    });

    it('returns false when entry has notes but no urgency', () => {
      expect(getTrackerShouldStartExpanded('not-started', 'neutral', entryWithNotes)).toBe(false);
    });

    it('returns false when entry has dates but no urgency', () => {
      expect(getTrackerShouldStartExpanded('not-started', 'neutral', entryWithDates)).toBe(false);
    });

    it('returns false for done status with neutral tone', () => {
      expect(getTrackerShouldStartExpanded('done', 'neutral', emptyEntry)).toBe(false);
    });

    it('returns false for done status with success tone', () => {
      expect(getTrackerShouldStartExpanded('done', 'success', emptyEntry)).toBe(false);
    });
  });

  describe('auto-expands on urgency signals', () => {
    it('returns true when status is in-progress', () => {
      expect(getTrackerShouldStartExpanded('in-progress', 'neutral', emptyEntry)).toBe(true);
    });

    it('returns true when follow-up tone is warning', () => {
      expect(getTrackerShouldStartExpanded('not-started', 'warning', entryWithDates)).toBe(true);
    });

    it('returns true when follow-up tone is danger', () => {
      expect(getTrackerShouldStartExpanded('not-started', 'danger', entryWithDates)).toBe(true);
    });

    it('returns true for in-progress even with danger tone', () => {
      expect(getTrackerShouldStartExpanded('in-progress', 'danger', entryWithDates)).toBe(true);
    });
  });
});
