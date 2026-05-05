import { describe, expect, it } from 'vitest';
import { intakeSteps } from '@/lib/intakeSteps';
import { intakeStepsKr } from '@/lib/intakeStepsKr';
import { getRecommendations } from '@/lib/rulesEngine';
import type { IntakeAnswers } from '@/lib/types';

const childAgeStep = intakeSteps.find((step) => step.fieldName === 'childAge');

if (!childAgeStep?.options) {
  throw new Error('Child age intake options are missing.');
}

const [UNDER_2, , AGE_4_TO_5, AGE_6_TO_8, , AGE_13_OR_OLDER] = childAgeStep.options;

function buildAnswers(overrides: Partial<IntakeAnswers> = {}): IntakeAnswers {
  return {
    childAge: AGE_4_TO_5,
    diagnosedBy: 'Developmental pediatrician',
    diagnoses: [],
    currentSupport: [
      'Special education services (IEP/IFSP)',
      'Speech therapy (SLP)',
      'Occupational therapy (OT)',
      'ABA therapy',
    ],
    topConcerns: [],
    freeText: '',
    ...overrides,
  };
}

function getRecommendationIds(overrides: Partial<IntakeAnswers> = {}): string[] {
  return getRecommendations(buildAnswers(overrides)).map((action) => action.id);
}

describe('getRecommendations', () => {
  describe('basic triggers', () => {
    it('adds explore-aba-under6 for ASD under 6', () => {
      const recommendations = getRecommendations(
        buildAnswers({
          childAge: AGE_4_TO_5,
          diagnoses: ['Autism Spectrum Disorder (ASD)'],
          currentSupport: ['Special education services (IEP/IFSP)', 'Occupational therapy (OT)'],
        })
      );

      const abaRecommendation = recommendations.find(
        (action) => action.id === 'explore-aba-under6'
      );

      expect(abaRecommendation).toBeDefined();
      expect(abaRecommendation?.urgency).toBe('immediate');
    });

    it('adds explore-aba-6-12 for ASD ages 6-8', () => {
      const ids = getRecommendationIds({
        childAge: AGE_6_TO_8,
        diagnoses: ['Autism Spectrum Disorder (ASD)'],
        currentSupport: ['Special education services (IEP/IFSP)', 'Occupational therapy (OT)'],
      });

      expect(ids).toContain('explore-aba-6-12');
    });

    it('adds explore-aba-teen for ASD ages 13 or older', () => {
      const ids = getRecommendationIds({
        childAge: AGE_13_OR_OLDER,
        diagnoses: ['Autism Spectrum Disorder (ASD)'],
        currentSupport: ['Special education services (IEP/IFSP)', 'Occupational therapy (OT)'],
      });

      expect(ids).toContain('explore-aba-teen');
    });

    it('adds find-slp for speech delay when SLP support is missing', () => {
      const ids = getRecommendationIds({
        diagnoses: ['Speech/Language Delay'],
        currentSupport: ['Special education services (IEP/IFSP)', 'Occupational therapy (OT)'],
      });

      expect(ids).toContain('find-slp');
    });

    it('adds find-ot for sensory needs when OT support is missing', () => {
      const ids = getRecommendationIds({
        diagnoses: ['Sensory Processing Disorder'],
        currentSupport: ['Special education services (IEP/IFSP)', 'Speech therapy (SLP)'],
      });

      expect(ids).toContain('find-ot');
    });

    it('adds adhd-management for ADHD', () => {
      const ids = getRecommendationIds({
        diagnoses: ['ADHD'],
      });

      expect(ids).toContain('adhd-management');
    });

    it('adds intellectual-disability for Intellectual Disability', () => {
      const ids = getRecommendationIds({
        diagnoses: ['Intellectual Disability'],
      });

      expect(ids).toContain('intellectual-disability');
    });

    it('adds official-diagnosis when not officially diagnosed', () => {
      const ids = getRecommendationIds({
        diagnosedBy: 'Not officially diagnosed yet',
      });

      expect(ids).toContain('official-diagnosis');
    });

    it('adds early-intervention for children under 3 without EI services', () => {
      const ids = getRecommendationIds({
        childAge: UNDER_2,
        currentSupport: ['Speech therapy (SLP)'],
      });

      expect(ids).toContain('early-intervention');
    });

    it('adds transition-planning for teens', () => {
      const ids = getRecommendationIds({
        childAge: AGE_13_OR_OLDER,
      });

      expect(ids).toContain('transition-planning');
    });
  });

  describe('top concerns influence', () => {
    it(`pins find-slp first for "My child's communication"`, () => {
      const ids = getRecommendationIds({
        currentSupport: ['Special education services (IEP/IFSP)'],
        topConcerns: ["My child's communication"],
      });

      expect(ids[0]).toBe('find-slp');
    });

    it(`pins ABA first and adds adhd-management for "My child's behavior at home"`, () => {
      const ids = getRecommendationIds({
        diagnoses: ['Autism Spectrum Disorder (ASD)'],
        currentSupport: ['Special education services (IEP/IFSP)', 'Occupational therapy (OT)'],
        topConcerns: ["My child's behavior at home"],
      });

      expect(ids[0]).toBe('explore-aba-under6');
      expect(ids).toContain('adhd-management');
    });

    it('pins request-iep first for school and education planning', () => {
      const ids = getRecommendationIds({
        childAge: AGE_6_TO_8,
        currentSupport: ['Speech therapy (SLP)', 'Occupational therapy (OT)'],
        topConcerns: ['School and education planning'],
      });

      expect(ids[0]).toBe('request-iep');
    });

    it('adds connect-parents when connecting with other parents is selected', () => {
      const ids = getRecommendationIds({
        topConcerns: ['Connecting with other parents'],
      });

      expect(ids).toContain('connect-parents');
    });

    it('does not add connect-parents when connecting with other parents is not selected', () => {
      const ids = getRecommendationIds();

      expect(ids).not.toContain('connect-parents');
    });

    it('adds parent-wellbeing when my own stress and wellbeing is selected', () => {
      const ids = getRecommendationIds({
        topConcerns: ['My own stress and wellbeing'],
      });

      expect(ids).toContain('parent-wellbeing');
    });

    it('does not add parent-wellbeing when my own stress and wellbeing is not selected', () => {
      const ids = getRecommendationIds();

      expect(ids).not.toContain('parent-wellbeing');
    });
  });

  describe('edge cases', () => {
    it('does not add an ABA recommendation when the child already has ABA therapy', () => {
      const ids = getRecommendationIds({
        diagnoses: ['Autism Spectrum Disorder (ASD)'],
        currentSupport: [
          'Special education services (IEP/IFSP)',
          'Occupational therapy (OT)',
          'ABA therapy',
        ],
      });

      expect(ids.some((id) => id.startsWith('explore-aba'))).toBe(false);
    });

    it('does not add request-iep for school-age children who already have an IEP', () => {
      const ids = getRecommendationIds({
        childAge: AGE_6_TO_8,
        currentSupport: [
          'Special education services (IEP/IFSP)',
          'Speech therapy (SLP)',
          'Occupational therapy (OT)',
        ],
        topConcerns: ['School and education planning'],
      });

      expect(ids).not.toContain('request-iep');
    });

    it(`uses strict urgency sorting and ignores pinning for "I don't know where to start"`, () => {
      const ids = getRecommendationIds({
        diagnosedBy: 'Not officially diagnosed yet',
        currentSupport: ['Special education services (IEP/IFSP)'],
        topConcerns: ["I don't know where to start", "My child's communication"],
      });

      expect(ids[0]).toBe('official-diagnosis');
      expect(ids[1]).toBe('find-slp');
    });
  });
});

describe('getRecommendations for ko-KR', () => {
  const krAgeStep = intakeStepsKr.find((step) => step.fieldName === 'childAge');

  if (!krAgeStep?.options) {
    throw new Error('Korean child age intake options are missing.');
  }

  function buildKrAnswers(overrides: Partial<IntakeAnswers> = {}): IntakeAnswers {
    return {
      childAge: '만 4-5세',
      diagnosedBy: '아직 공식 진단은 없어요',
      diagnoses: ['자폐스펙트럼장애'],
      currentSupport: ['아직 아무 지원도 없어요'],
      topConcerns: [],
      freeText: '',
      ...overrides,
    };
  }

  function getKrRecommendationIds(overrides: Partial<IntakeAnswers> = {}): string[] {
    return getRecommendations(buildKrAnswers(overrides), 'ko-KR').map((action) => action.id);
  }

  it('adds Korean doctor access recommendations when diagnosis is not official', () => {
    const ids = getKrRecommendationIds({
      diagnosedBy: '아직 공식 진단은 없어요',
    });

    expect(ids).toContain('find-developmental-ped-kr');
    expect(ids).toContain('shorter-queue-strategy-kr');
    expect(ids).toContain('prepare-first-appointment-kr');
  });

  it('adds Korean special education recommendations for school concerns', () => {
    const ids = getKrRecommendationIds({
      childAge: '초등 저학년',
      diagnosedBy: '소아발달클리닉 또는 소아정신과에서 진단받았어요',
      currentSupport: ['언어치료'],
      topConcerns: ['어린이집/유치원/학교가 걱정돼요'],
    });

    expect(ids[0]).toBe('request-special-ed-kr');
    expect(ids).toContain('understand-iep-kr');
  });

  it('adds Korean voucher and parent wellbeing recommendations for no support', () => {
    const ids = getKrRecommendationIds({
      currentSupport: ['아직 아무 지원도 없어요'],
      topConcerns: ['부모인 제가 너무 지쳤어요'],
    });

    expect(ids).toContain('darei-services');
    expect(ids).toContain('parent-counseling-support-kr');
    expect(ids).toContain('parent-wellbeing-kr');
  });
});
