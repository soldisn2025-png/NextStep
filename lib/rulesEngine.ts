import { IntakeAnswers, RecommendedAction } from './types';
import { ALL_ACTIONS } from './actions';

const URGENCY_ORDER = { immediate: 0, soon: 1, 'when-ready': 2 };

function pick(id: string): RecommendedAction {
  return ALL_ACTIONS[id];
}

export function getRecommendations(answers: IntakeAnswers): RecommendedAction[] {
  const seen = new Set<string>();
  const results: RecommendedAction[] = [];
  const pinToTop = new Set<string>();

  function add(id: string) {
    if (!seen.has(id)) {
      seen.add(id);
      results.push(pick(id));
    }
  }

  function pin(id: string) {
    add(id);
    pinToTop.add(id);
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

  const concernsStartFromScratch = topConcerns.includes("I don't know where to start");
  const concernsCommunication = topConcerns.includes("My child's communication");
  const concernsBehavior = topConcerns.includes("My child's behavior at home");
  const concernsSchool = topConcerns.includes('School and education planning');

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
    if (concernsSchool) pin('request-iep');
    else add('request-iep');
  }

  // ── Speech therapy ────────────────────────────────────────────────────────
  if ((hasSpeech || concernsCommunication) && noSLP) {
    if (concernsCommunication) pin('find-slp');
    else add('find-slp');
  }

  // ── ABA therapy ───────────────────────────────────────────────────────────
  if (hasASD && !currentSupport.includes('ABA therapy')) {
    const abaId = isUnder6 ? 'explore-aba-under6' : is6to12 ? 'explore-aba-6-12' : 'explore-aba-teen';
    if (concernsBehavior) pin(abaId);
    else add(abaId);
  }

  // ── Behavior at home: surface ADHD management even without formal diagnosis ─
  if (concernsBehavior) {
    add('adhd-management');
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

  // Sort: immediate → soon → when-ready
  const sorted = results.sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
  );

  if (concernsStartFromScratch || pinToTop.size === 0) return sorted;

  const pinned = sorted.filter(r => pinToTop.has(r.id));
  const rest = sorted.filter(r => !pinToTop.has(r.id));
  return [...pinned, ...rest];
}
