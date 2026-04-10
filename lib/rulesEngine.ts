import { IntakeAnswers, RecommendedAction } from './types';
import { ALL_ACTIONS } from './actions';

const URGENCY_ORDER = { immediate: 0, soon: 1, 'when-ready': 2 };

function pick(id: string): RecommendedAction {
  return ALL_ACTIONS[id];
}

export function getRecommendations(answers: IntakeAnswers): RecommendedAction[] {
  const seen = new Set<string>();
  const results: RecommendedAction[] = [];

  function add(id: string) {
    if (!seen.has(id)) {
      seen.add(id);
      results.push(pick(id));
    }
  }

  const { childAge, diagnosedBy, diagnoses, currentSupport, topConcerns } = answers;

  const isUnder3 = childAge === 'Under 2' || childAge === '2–3 years';
  const isUnder6 = isUnder3 || childAge === '4–5 years';
  const is6to12 = childAge === '6–8 years' || childAge === '9–12 years';
  const isSchoolAge = ['4–5 years', '6–8 years', '9–12 years', '13 or older'].includes(childAge);
  const isTeen = childAge === '13 or older';
  const notDiagnosed = diagnosedBy === 'Not officially diagnosed yet';
  const noSupport = currentSupport.includes('No, nothing yet') || currentSupport.length === 0;
  const hasASD = diagnoses.includes('Autism Spectrum Disorder (ASD)');
  const hasADHD = diagnoses.includes('ADHD');
  const hasSpeech = diagnoses.includes('Speech/Language Delay');
  const hasSensory = diagnoses.includes('Sensory Processing Disorder');
  const hasID = diagnoses.includes('Intellectual Disability');
  const noIEP = !currentSupport.includes('Special education services (IEP/IFSP)');
  const noSLP = !currentSupport.includes('Speech therapy (SLP)');
  const noOT = !currentSupport.includes('Occupational therapy (OT)');

  // ── IMMEDIATE: official diagnosis ────────────────────────────────────────
  if (notDiagnosed) {
    add('official-diagnosis');
  }

  // ── IMMEDIATE: Early Intervention (under 3 only) ─────────────────────────
  if (isUnder3 && !currentSupport.includes('Early intervention services')) {
    add('early-intervention');
  }

  // ── IMMEDIATE: IEP for school-age kids not already in special ed ─────────
  if (isSchoolAge && noIEP) {
    add('request-iep');
  }

  // ── Speech therapy ────────────────────────────────────────────────────────
  if ((hasSpeech || topConcerns.includes("My child's communication")) && noSLP) {
    add('find-slp');
  }

  // ── ABA therapy ───────────────────────────────────────────────────────────
  if (hasASD && !currentSupport.includes('ABA therapy')) {
    if (isUnder6) add('explore-aba-under6');
    else if (is6to12) add('explore-aba-6-12');
    else add('explore-aba-teen');
  }

  // ── Occupational therapy ──────────────────────────────────────────────────
  if ((hasSensory || hasASD) && noOT) {
    add('find-ot');
  }

  // ── Sensory home tips (if sensory + no OT yet) ───────────────────────────
  if (hasSensory && noOT) {
    add('sensory-environment');
  }

  // ── ADHD co-occurring ─────────────────────────────────────────────────────
  if (hasADHD) {
    add('adhd-management');
  }

  // ── Intellectual Disability ───────────────────────────────────────────────
  if (hasID) {
    add('intellectual-disability');
  }

  // ── Transition planning for teens ─────────────────────────────────────────
  if (isTeen) {
    add('transition-planning');
  }

  // ── Insurance ─────────────────────────────────────────────────────────────
  if (
    topConcerns.includes('Understanding insurance coverage') ||
    noSupport  // if they have nothing, they'll need to figure out insurance
  ) {
    add('review-insurance');
  }

  // ── General: establish developmental ped if diagnosed by non-MD ──────────
  if (
    diagnosedBy === 'School evaluation team' ||
    diagnosedBy === 'Psychologist'
  ) {
    add('find-developmental-ped');
  }

  // ── Know your rights ──────────────────────────────────────────────────────
  if (
    topConcerns.includes('School and education planning') ||
    isSchoolAge
  ) {
    add('understand-your-rights');
  }

  // ── Community ─────────────────────────────────────────────────────────────
  if (topConcerns.includes('Connecting with other parents')) {
    add('connect-parents');
  }

  // ── Parent wellbeing ──────────────────────────────────────────────────────
  if (topConcerns.includes('My own stress and wellbeing') || noSupport) {
    add('parent-wellbeing');
  }

  // ── Fallback: always include parent wellbeing and connect-parents ─────────
  add('connect-parents');
  add('parent-wellbeing');

  // Sort: immediate → soon → when-ready
  return results.sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
  );
}
