import { IntakeAnswers, RecommendedAction } from './types';
import { KR_ACTIONS } from './actionsKr';

const URGENCY_ORDER = { immediate: 0, soon: 1, 'when-ready': 2 };

function pick(id: string): RecommendedAction {
  return KR_ACTIONS[id];
}

export function getRecommendationsKr(answers: IntakeAnswers): RecommendedAction[] {
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

  const isUnder9 = ['만 2세 미만', '만 2-3세', '만 4-5세', '초등 저학년'].includes(childAge);
  const isPreschool = ['만 2세 미만', '만 2-3세', '만 4-5세'].includes(childAge);
  const isSchoolAge = ['만 4-5세', '초등 저학년', '초등 고학년', '중학생 이상'].includes(childAge);
  const notDiagnosed = diagnosedBy === '아직 공식 진단은 없어요';
  const clinicOnly = diagnosedBy === '심리검사센터 또는 발달클리닉에서 평가받았어요';
  const schoolSuggested = diagnosedBy === '어린이집/유치원/학교에서 평가를 권유받았어요';
  const noSupport = currentSupport.includes('아직 아무 지원도 없어요') || currentSupport.length === 0;
  const hasASD = diagnoses.includes('자폐스펙트럼장애');
  const hasSpeech = diagnoses.includes('언어발달지연');
  const hasSensory = diagnoses.includes('감각처리 어려움');
  const hasDevelopmentalDelay = diagnoses.includes('지적장애 또는 전반적 발달지연');
  const noSpecialEd = !currentSupport.includes('특수교육 또는 개별화교육계획');
  const noVoucher = !currentSupport.includes('발달재활서비스 바우처');
  const noSLP = !currentSupport.includes('언어치료');
  const noCenter = !currentSupport.includes('발달센터');
  const noBehaviorTherapy = !currentSupport.includes('행동발달치료 또는 ABA');

  const concernsStart = topConcerns.includes('무엇부터 해야 할지 모르겠어요');
  const concernsDoctor = topConcerns.includes('병원 예약이 너무 어려워요');
  const concernsTherapy = topConcerns.includes('치료사를 찾고 싶어요');
  const concernsCommunication = topConcerns.includes('말과 의사소통이 걱정돼요');
  const concernsBehavior = topConcerns.includes('집에서의 행동이 힘들어요');
  const concernsSchool = topConcerns.includes('어린이집/유치원/학교가 걱정돼요');
  const concernsBenefits = topConcerns.includes('복지 서비스와 바우처가 궁금해요');
  const concernsParentStress = topConcerns.includes('부모인 제가 너무 지쳤어요');

  if (notDiagnosed || clinicOnly || concernsDoctor) {
    pin('find-developmental-ped-kr');
    add('prepare-first-appointment-kr');
  }

  const earlySpecialEdNeeded = isPreschool && noSpecialEd && (hasASD || hasDevelopmentalDelay);
  if (schoolSuggested || (isSchoolAge && noSpecialEd) || concernsSchool || earlySpecialEdNeeded) {
    if (concernsSchool || schoolSuggested || earlySpecialEdNeeded) pin('request-special-ed-kr');
    else add('request-special-ed-kr');
    add('understand-iep-kr');
  }

  // 발달센터: primary therapy recommendation for multi-domain needs
  if ((hasASD || hasDevelopmentalDelay || hasSensory || (noSupport && concernsTherapy)) && noCenter) {
    if (concernsTherapy || noSupport) pin('find-developmental-center-kr');
    else add('find-developmental-center-kr');
  }

  // SLP: recommend standalone when language is the sole concern; secondary when part of multi-domain
  if ((hasSpeech || concernsCommunication) && noSLP) {
    const isLanguageOnly = !hasASD && !hasDevelopmentalDelay && !hasSensory;
    if (isLanguageOnly) {
      if (concernsCommunication || concernsTherapy) pin('find-slp-kr');
      else add('find-slp-kr');
    } else {
      add('find-slp-kr');
    }
  }

  // Behavior: only surface when behavior is the explicit primary concern
  if ((hasASD || concernsBehavior) && noBehaviorTherapy && concernsBehavior) {
    add('behavior-therapy-kr');
  }

  if ((noSupport || concernsBenefits || isUnder9 || hasDevelopmentalDelay || hasASD) && noVoucher) {
    if (concernsBenefits || noSupport) pin('darei-services');
    else add('darei-services');
  }

  if (hasASD || hasDevelopmentalDelay || concernsBenefits || noSupport) {
    add('regional-disability-center');
  }

  if (hasASD || hasDevelopmentalDelay || concernsBenefits) {
    add('disability-registration');
  }

  if (concernsParentStress || noSupport) {
    add('parent-counseling-support-kr');
    add('parent-wellbeing-kr');
  }

  if (topConcerns.length > 0 && !concernsParentStress) {
    add('parent-community-kr');
  }

  const sorted = results
    .filter(Boolean)
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);

  if (concernsStart || pinToTop.size === 0) {
    return sorted;
  }

  const pinned = sorted.filter((action) => pinToTop.has(action.id));
  const rest = sorted.filter((action) => !pinToTop.has(action.id));
  return [...pinned, ...rest];
}
