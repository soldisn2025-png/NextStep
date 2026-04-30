import { ALL_ACTIONS } from './actions';
import { KR_ACTIONS } from './actionsKr';

export interface ActionPlanGuidance {
  firstMove: string;
  whileWaiting?: string;
}

const ACTION_PLAN_GUIDANCE: Record<string, ActionPlanGuidance> = {
  'early-intervention': {
    firstMove: 'Call your state or county Early Intervention intake line and ask how to begin a referral this week.',
    whileWaiting: 'Ask whether they keep a cancellation list and what paperwork will speed up the first appointment.',
  },
  'official-diagnosis': {
    firstMove: 'Request a referral list from your pediatrician and book the earliest formal evaluation you can get.',
    whileWaiting: 'Ask the school district whether they offer a no-cost evaluation pathway while you wait for outside appointments.',
  },
  'find-slp': {
    firstMove: 'Ask for an SLP evaluation referral, then call two or three pediatric speech providers to compare waitlists.',
    whileWaiting: 'If waitlists are long, ask each office about cancellations and whether they can review prior evaluations first.',
  },
  'find-ot': {
    firstMove: 'Find an OT who works with pediatric sensory or daily-living needs and ask what their intake process looks like.',
    whileWaiting: 'Write down the situations that feel hardest at home so you have concrete examples ready for the evaluation.',
  },
  'explore-aba': {
    firstMove: 'Make a short list of providers and ask how they set goals, involve parents, and measure progress.',
    whileWaiting: 'Compare home-based, clinic-based, and school-coordinated options instead of choosing by name recognition alone.',
  },
  'request-iep': {
    firstMove: 'Send a written request to the school or district asking for a full special education evaluation.',
    whileWaiting: 'Save copies of emails, reports, and behavior or communication notes so you walk into meetings prepared.',
  },
  'review-insurance': {
    firstMove: 'Call the member-services number on your insurance card and ask about SLP, OT, ABA, and prior authorization rules.',
    whileWaiting: 'Write down reference numbers, coverage details, and in-network rules during the call so you do not repeat work later.',
  },
  'connect-parents': {
    firstMove: 'Join one local or online parent group and spend a few minutes reading recent posts before asking your first question.',
    whileWaiting: 'Look for region-specific recommendations about waitlists, school timelines, and providers rather than generic advice.',
  },
  'parent-wellbeing': {
    firstMove: 'Pick one small support step for yourself this week, even if it is only a therapist intake call or a support-group signup.',
    whileWaiting: 'Reduce the size of the task until it becomes realistic. Progress matters more than intensity here.',
  },
  'adhd-management': {
    firstMove: 'Bring attention and regulation concerns to your next pediatrician or psychiatry visit and ask whether ADHD evaluation fits.',
    whileWaiting: 'Keep a short log of patterns at home and school so you can describe what is actually happening.',
  },
  'transition-planning': {
    firstMove: 'Ask the school team what transition planning is already in place and what should be added this year.',
    whileWaiting: 'List the skills that matter most after high school so meetings stay grounded in real goals.',
  },
  'understand-your-rights': {
    firstMove: 'Read one plain-language IDEA overview before your next school meeting so the terminology is less opaque.',
    whileWaiting: 'Keep a running list of terms or acronyms you want clarified rather than trying to learn everything at once.',
  },
  'find-developmental-ped': {
    firstMove: 'Ask your pediatrician or insurer for in-network developmental pediatrics options and compare wait times immediately.',
    whileWaiting: 'If waits are long, ask whether a general pediatrician, psychologist, or nurse line can help bridge referrals.',
  },
  'sensory-environment': {
    firstMove: 'Choose one specific routine that is breaking down at home and make one sensory adjustment to test this week.',
    whileWaiting: 'Track what helps and what does not so future OT conversations are based on patterns rather than guesswork.',
  },
};

const DEFAULT_GUIDANCE: ActionPlanGuidance = {
  firstMove: 'Turn this recommendation into one concrete step you can start this week.',
  whileWaiting: 'If progress stalls, document what is blocking you so the next call or appointment is more specific.',
};

export function getActionPlanGuidance(actionId: string): ActionPlanGuidance {
  const action = ALL_ACTIONS[actionId] ?? KR_ACTIONS[actionId];
  if (action) {
    return {
      firstMove: action.firstMove,
      whileWaiting: action.whileWaiting,
    };
  }

  return ACTION_PLAN_GUIDANCE[actionId] ?? DEFAULT_GUIDANCE;
}
