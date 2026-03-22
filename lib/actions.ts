import { RecommendedAction } from './types';

export const ALL_ACTIONS: Record<string, RecommendedAction> = {
  'early-intervention': {
    id: 'early-intervention',
    title: 'Apply for Early Intervention services',
    description:
      'Children under 3 qualify for free Early Intervention (Part C of IDEA). Contact your state\'s EI program — services can begin within 45 days of referral and include speech, OT, and developmental therapy at no cost. Search "[your county] + Infant and Toddler Connection" or "[your state] + Early Intervention" to find your local program.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'Find your state EI program (CDC)', url: 'https://www.cdc.gov/act-early/early-intervention/index.html' },
      { label: 'What is Early Intervention? (CDC)', url: 'https://www.cdc.gov/act-early/early-intervention/index.html' },
      { label: 'Example: Fairfax County Infant & Toddler Connection', url: 'https://www.fairfaxcounty.gov/neighborhood-community-services/infant-and-toddler-connection' },
    ],
  },
  'official-diagnosis': {
    id: 'official-diagnosis',
    title: 'Pursue a formal evaluation',
    description:
      'An official diagnosis from a developmental pediatrician or licensed psychologist unlocks school services, insurance coverage, and therapy funding. Ask your pediatrician for a referral or contact your school district — they are required to evaluate at no cost.',
    category: 'school',
    urgency: 'immediate',
    resources: [
      { label: 'Autism diagnosis: what to expect (Autism Speaks)', url: 'https://www.autismspeaks.org/autism-diagnosis' },
      { label: 'AAP autism resources for families', url: 'https://www.aap.org/en/patient-care/autism/' },
    ],
  },
  'find-slp': {
    id: 'find-slp',
    title: 'Get a Speech-Language Pathology (SLP) evaluation',
    description:
      'A speech-language pathologist can assess your child\'s communication, language, and social communication needs. Ask your pediatrician for a referral, or contact your school district — they must evaluate school-aged children for free.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'Autism and communication (ASHA)', url: 'https://www.asha.org/public/speech/disorders/autism/' },
      { label: 'ASHA ProFind — find an SLP near you', url: 'https://www.asha.org/profind/' },
    ],
  },
  'find-ot': {
    id: 'find-ot',
    title: 'Schedule an Occupational Therapy (OT) evaluation',
    description:
      'An OT can assess sensory processing, fine motor skills, and daily living challenges. Many children with ASD or Sensory Processing Disorder benefit significantly from OT. Ask your pediatrician for a referral.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: 'Find an OT (AOTA)', url: 'https://www.aota.org/about/find-ot' },
      { label: 'OT and autism — overview (AOTA)', url: 'https://www.aota.org/practice/children-youth/autism' },
    ],
  },
  'explore-aba': {
    id: 'explore-aba',
    title: 'Learn about ABA therapy',
    description:
      'Applied Behavior Analysis (ABA) is one of the most researched therapies for autism. It targets communication, social skills, and adaptive behavior. Ask your pediatrician for a referral to a Board Certified Behavior Analyst (BCBA).',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: 'What is ABA? (Autism Speaks)', url: 'https://www.autismspeaks.org/applied-behavior-analysis' },
      { label: 'ABA therapy overview (Autism Science Foundation)', url: 'https://autismsciencefoundation.org/what-is-autism/aba-applied-behavior-analysis/' },
    ],
  },
  'request-iep': {
    id: 'request-iep',
    title: 'Request an IEP evaluation from your school district',
    description:
      'Send a written request to your school\'s special education director. By law (IDEA), the district must respond within 60 days and evaluate your child at no cost. An IEP can unlock classroom aides, therapy in school, and specialized instruction.',
    category: 'school',
    urgency: 'immediate',
    resources: [
      { label: 'How to request an IEP (Wrightslaw)', url: 'https://www.wrightslaw.com/info/iep.htm' },
      { label: 'IEP guide for parents (PACER)', url: 'https://www.pacer.org/parent/iep/' },
      { label: 'Your rights — Center for Parent Information', url: 'https://www.parentcenterhub.org/basics/' },
    ],
  },
  'review-insurance': {
    id: 'review-insurance',
    title: 'Review your insurance coverage for therapy',
    description:
      'Most states mandate insurance coverage for ABA and other autism therapies. Call your insurer and ask: (1) Is ABA covered? (2) Do I need prior authorization? (3) What is my out-of-pocket max? Getting this answered early prevents billing surprises.',
    category: 'insurance',
    urgency: 'soon',
    resources: [
      { label: 'State autism insurance mandates (Autism Speaks)', url: 'https://www.autismspeaks.org/autism-insurance-resource-center' },
      { label: 'Free/low-cost coverage via CHIP/Medicaid', url: 'https://www.insurekidsnow.gov/' },
    ],
  },
  'connect-parents': {
    id: 'connect-parents',
    title: 'Connect with other autism parents',
    description:
      'Parent support groups — local or online — are one of the most valuable resources after a diagnosis. Many parents find that other parents know the system better than any professional. Search "[your county or city] + autism parent group" to find your local community.',
    category: 'community',
    urgency: 'when-ready',
    resources: [
      { label: 'Find your local Autism Society chapter', url: 'https://autismsociety.org/get-involved/chapters/' },
      { label: 'POAC-NOVA (example regional group — Northern Virginia)', url: 'https://poac-nova.org/' },
      { label: 'Autism Parent Support (Facebook group)', url: 'https://www.facebook.com/groups/autismparentssupport/' },
    ],
  },
  'parent-wellbeing': {
    id: 'parent-wellbeing',
    title: 'Take care of your own mental health',
    description:
      'A diagnosis is emotionally exhausting for parents. You cannot advocate for your child if you are burned out. Look into parent coaching through your regional autism center, or ask your doctor about referrals. Many autism organizations offer free caregiver support.',
    category: 'parent',
    urgency: 'soon',
    resources: [
      { label: 'NAMI Family Support Line', url: 'https://www.nami.org/Support-Education/Support-Groups' },
      { label: 'Caregiver support resources (Autism Speaks)', url: 'https://www.autismspeaks.org/tool-kit/100-day-kit-young-children' },
      { label: 'Top autism parenting books (Amazon)', url: 'https://www.amazon.com/s?k=autism+parenting+books' },
    ],
  },
  'adhd-management': {
    id: 'adhd-management',
    title: 'Explore ADHD evaluation and management',
    description:
      'If ADHD co-occurs with autism, both need to be addressed. A developmental pediatrician or psychiatrist can evaluate whether behavioral therapy, medication, or a combination is appropriate. School accommodations (504 plan or IEP) are also available.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: 'CHADD — ADHD resource center', url: 'https://chadd.org/' },
      { label: 'ADHD + autism: what parents need to know', url: 'https://www.additudemag.com/adhd-and-autism/' },
    ],
  },
  'transition-planning': {
    id: 'transition-planning',
    title: 'Start transition planning for adulthood',
    description:
      'For teens 14 and older, an IEP must include a Transition Plan covering post-secondary education, employment, and independent living. Contact your state\'s vocational rehabilitation office and your regional autism center to understand what\'s available.',
    category: 'school',
    urgency: 'soon',
    resources: [
      { label: 'Transition guide for families (PACER)', url: 'https://www.pacer.org/transition/' },
      { label: 'Find your state VR office', url: 'https://rsa.ed.gov/about/states' },
      { label: 'Autism Speaks transition tool kit', url: 'https://www.autismspeaks.org/tool-kit/transition-tool-kit' },
    ],
  },
  'understand-your-rights': {
    id: 'understand-your-rights',
    title: 'Learn your rights under IDEA and ADA',
    description:
      'The Individuals with Disabilities Education Act (IDEA) gives your child the right to a Free Appropriate Public Education (FAPE). The ADA protects against discrimination. Wrightslaw.com is a trusted free resource. Knowing your rights is your most powerful tool.',
    category: 'school',
    urgency: 'when-ready',
    resources: [
      { label: 'Wrightslaw — special ed law & advocacy', url: 'https://www.wrightslaw.com/' },
      { label: 'IDEA basics for parents', url: 'https://www.parentcenterhub.org/basics/' },
    ],
  },
  'find-developmental-ped': {
    id: 'find-developmental-ped',
    title: 'Establish care with a developmental pediatrician',
    description:
      'If your diagnosis came from a school team or psychologist, consider also establishing care with a developmental pediatrician. They can coordinate your child\'s overall treatment plan, make referrals, and address medical co-occurring conditions.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: 'AAP autism resources for families', url: 'https://www.aap.org/en/patient-care/autism/' },
      { label: 'Autism diagnosis: next steps (Autism Speaks)', url: 'https://www.autismspeaks.org/autism-diagnosis' },
    ],
  },
  'sensory-environment': {
    id: 'sensory-environment',
    title: 'Make sensory-friendly adjustments at home',
    description:
      'While waiting for OT, you can start making low-cost sensory adjustments: noise-canceling headphones, dimmer lighting, weighted blankets, and predictable routines. An OT can give you a personalized "sensory diet" once evaluated.',
    category: 'parent',
    urgency: 'when-ready',
    resources: [
      { label: 'Understanding sensory processing (STAR Institute)', url: 'https://sensoryhealth.org/basic/understanding-sensory-processing-disorder' },
      { label: 'Fidget & sensory toys on Amazon', url: 'https://www.amazon.com/s?k=autism+sensory+fidget+toys' },
      { label: 'Noise-canceling headphones for kids (Amazon)', url: 'https://www.amazon.com/s?k=noise+canceling+headphones+kids+autism' },
      { label: 'Weighted blankets for children (Amazon)', url: 'https://www.amazon.com/s?k=weighted+blanket+kids+autism' },
    ],
  },
};
