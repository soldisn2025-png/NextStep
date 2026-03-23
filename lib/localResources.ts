import { LocalResource, LocationMatch } from './types';

const ZIP_REGION_RULES = [
  {
    prefixes: ['220', '221'],
    regionIds: ['fairfax-county-va', 'northern-virginia'],
    primaryRegionLabel: 'Fairfax County, VA',
  },
  {
    prefixes: ['201', '222', '223'],
    regionIds: ['northern-virginia'],
    primaryRegionLabel: 'Northern Virginia',
  },
];

const KIND_ORDER: Record<LocalResource['kind'], number> = {
  'official-program': 0,
  'parent-group': 1,
  provider: 2,
};

export const LOCAL_PILOT_SUMMARY =
  'Curated local resources are currently available for Fairfax County and Northern Virginia.';

export const LOCAL_RESOURCES: LocalResource[] = [
  {
    id: 'fairfax-itc',
    label: 'Infant & Toddler Connection of Fairfax-Falls Church',
    url: 'https://www.fairfaxcounty.gov/neighborhood-community-services/infant-and-toddler-connection',
    description: 'Official early intervention entry point for children under 3 in Fairfax and Falls Church.',
    kind: 'official-program',
    regionIds: ['fairfax-county-va'],
    actionIds: ['early-intervention'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'fcps-child-find',
    label: 'FCPS Child Find and Special Education Registration',
    url: 'https://www.fcps.edu/about-fcps/registration/special-education-registration-child-find',
    description: 'Official school evaluation pathway for Fairfax County children who may need special education services.',
    kind: 'official-program',
    regionIds: ['fairfax-county-va'],
    actionIds: ['official-diagnosis', 'request-iep', 'understand-your-rights'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'fcps-special-ed-handbook',
    label: 'FCPS Special Education Handbook for Parents',
    url: 'https://www.fcps.edu/academics/curriculum/special-education/procedural-support/special-education-handbook-parents',
    description: 'Parent-facing guide to Fairfax County timelines, rights, services, and school processes.',
    kind: 'official-program',
    regionIds: ['fairfax-county-va'],
    actionIds: ['request-iep', 'understand-your-rights', 'transition-planning'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'fcps-community-guide',
    label: 'FCPS Community Guide for Special Needs Families',
    url: 'https://www.fcps.edu/services/families-and-caregivers/family-resource-center/community-guide-special-needs-families',
    description: 'County-specific directory of community resources, supports, and service organizations for families.',
    kind: 'official-program',
    regionIds: ['fairfax-county-va'],
    actionIds: ['find-slp', 'find-ot', 'explore-aba', 'review-insurance', 'find-developmental-ped', 'parent-wellbeing'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'fcps-transition',
    label: 'FCPS Transition Services',
    url: 'https://www.fcps.edu/academics/academic-overview/special-education-instruction/career-and-transition-services/transition',
    description: 'Official transition-planning page for students approaching adulthood in Fairfax County schools.',
    kind: 'official-program',
    regionIds: ['fairfax-county-va'],
    actionIds: ['transition-planning'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'poac-nova',
    label: 'POAC-NOVA parent community',
    url: 'https://poac-nova.org/',
    description: 'Regional autism parent organization offering workshops, events, and peer connection in Northern Virginia.',
    kind: 'parent-group',
    regionIds: ['northern-virginia'],
    actionIds: ['connect-parents', 'parent-wellbeing'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'fairfax-septa',
    label: 'Fairfax County SEPTA',
    url: 'https://fairfaxcountysepta.org/',
    description: 'Special Education PTA focused on peer support, advocacy, trainings, and community events.',
    kind: 'parent-group',
    regionIds: ['fairfax-county-va'],
    actionIds: ['connect-parents', 'understand-your-rights', 'parent-wellbeing', 'transition-planning'],
    verifiedAt: '2026-03-23',
  },
  {
    id: 'therapeutic-recreation',
    label: 'Fairfax County Therapeutic Recreation',
    url: 'https://www.fairfaxcounty.gov/neighborhood-community-services/therapeutic-recreation',
    description: 'Adaptive classes, camps, clubs, and recreation supports for children and adults with disabilities.',
    kind: 'parent-group',
    regionIds: ['fairfax-county-va'],
    actionIds: ['connect-parents', 'parent-wellbeing', 'sensory-environment'],
    verifiedAt: '2026-03-23',
  },
];

function normalizeZip(zip: string) {
  return zip.replace(/\D/g, '').slice(0, 5);
}

export function getLocationMatch(zip: string): LocationMatch | null {
  const normalized = normalizeZip(zip);

  if (normalized.length !== 5) {
    return null;
  }

  const matchedRule = ZIP_REGION_RULES.find((rule) =>
    rule.prefixes.some((prefix) => normalized.startsWith(prefix))
  );

  if (!matchedRule) {
    return {
      zip: normalized,
      regionIds: [],
      primaryRegionLabel: null,
    };
  }

  return {
    zip: normalized,
    regionIds: matchedRule.regionIds,
    primaryRegionLabel: matchedRule.primaryRegionLabel,
  };
}

export function getLocalResourcesForAction(actionId: string, zip: string): LocalResource[] {
  const match = getLocationMatch(zip);

  if (!match || match.regionIds.length === 0) {
    return [];
  }

  return LOCAL_RESOURCES.filter((resource) => {
    const matchesAction = resource.actionIds.includes(actionId);
    const matchesRegion = resource.regionIds.some((regionId) => match.regionIds.includes(regionId));
    return matchesAction && matchesRegion;
  }).sort((a, b) => {
    if (KIND_ORDER[a.kind] !== KIND_ORDER[b.kind]) {
      return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    }

    const aCountySpecific = a.regionIds.includes('fairfax-county-va') ? 0 : 1;
    const bCountySpecific = b.regionIds.includes('fairfax-county-va') ? 0 : 1;
    return aCountySpecific - bCountySpecific;
  });
}
