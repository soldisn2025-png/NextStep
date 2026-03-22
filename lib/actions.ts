import { RecommendedAction } from './types';

export const ALL_ACTIONS: Record<string, RecommendedAction> = {
  'early-intervention': {
    id: 'early-intervention',
    title: 'Apply for Early Intervention services',
    description:
      'Children under 3 qualify for free Early Intervention (Part C of IDEA). Contact your state\'s EI program — services can begin within 45 days of referral and include speech, OT, and developmental therapy at no cost.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'Find your state EI program', url: 'https://www.cdc.gov/ncbddd/actearly/parents/states.html' },
      { label: 'What is Early Intervention?', url: 'https://www.cdc.gov/ncbddd/actearly/parents/early-intervention.html' },
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
      { label: 'Find a developmental pediatrician (AAP)', url: 'https://www.healthychildren.org/English/family-life/health-management/Pages/What-Is-a-Developmental-Behavioral-Pediatrician.aspx' },
      { label: 'Autism diagnosis: what to expect', url: 'https://www.autismspeaks.org/autism-diagnosis' },
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
      { label: 'Find an SLP (ASHA)', url: 'https://www.asha.org/public/speech/disorders/autism/' },
      { label: 'ASHA ProFind directory', url: 'https://www.asha.org/profind/' },
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
      { label: 'OT and autism — overview', url: 'https://www.aota.org/practice/children-youth/autism' },
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
      { label: 'Find a BCBA near you', url: 'https://www.bacb.com/services/o.php?page=101145' },
      { label: 'What is ABA? (Autism Speaks)', url: 'https://www.autismspeaks.org/applied-behavior-analysis' },
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
      { label: 'Sample IEP request letter (Wrightslaw)', url: 'https://www.wrightslaw.com/info/test.ltr2sd.htm' },
      { label: 'IEP guide for parents (PACER)', url: 'https://www.pacer.org/parent/php/PHP-c8.pdf' },
      { label: 'Your rights under IDEA', url: 'https://sites.ed.gov/idea/parents-and-educators/' },
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
      { label: 'State autism insurance mandates map', url: 'https://www.autismspeaks.org/autism-insurance-resource-center' },
      { label: 'Insure Kids Now (CHIP/Medicaid)', url: 'https://www.insurekidsnow.gov/' },
    ],
  },
  'connect-parents': {
    id: 'connect-parents',
    title: 'Connect with other autism parents',
    description:
      'Parent support groups — local or online — are one of the most valuable resources after a diagnosis. The Autism Society of America and local chapters offer free groups. Many parents find that other parents know the system better than any professional.',
    category: 'community',
    urgency: 'when-ready',
    resources: [
      { label: 'Find a local Autism Society chapter', url: 'https://autismsociety.org/find-support/local-chapters/' },
      { label: 'Autism Parent Support (Facebook groups)', url: 'https://www.facebook.com/groups/autismparentssupport/' },
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
      { label: 'Caregiver resources (Autism Speaks)', url: 'https://www.autismspeaks.org/tool-kit/100-day-kit-young-children' },
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
      { label: 'IDEA parent rights (US Dept of Ed)', url: 'https://sites.ed.gov/idea/parents-and-educators/' },
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
      { label: 'What developmental peds do (AAP)', url: 'https://www.healthychildren.org/English/family-life/health-management/Pages/What-Is-a-Developmental-Behavioral-Pediatrician.aspx' },
      { label: 'ABPDN — find a specialist', url: 'https://www.abpdn.org/public-patients/find-a-diplomate/' },
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
      { label: 'Sensory processing and autism (STAR)', url: 'https://www.spdstar.org/basic/understanding-sensory-processing-disorder' },
      { label: 'Sensory diet ideas for home', url: 'https://www.understood.org/articles/sensory-diet' },
    ],
  },
};
