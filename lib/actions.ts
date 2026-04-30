import { RecommendedAction } from './types';

export const ALL_ACTIONS: Record<string, RecommendedAction> = {
  'early-intervention': {
    id: 'early-intervention',
    title: 'Apply for Early Intervention services',
    description:
      'Children under 3 qualify for free Early Intervention (Part C of IDEA). Contact your state\'s EI program and ask how to start a referral. Services can begin within 45 days of referral and often include speech, OT, and developmental therapy at no cost.',
    firstMove: 'Call your state or county Early Intervention intake line and ask how to begin a referral this week.',
    whileWaiting: 'Ask whether they keep a cancellation list and what paperwork will speed up the first appointment.',
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
      'An official diagnosis from a developmental pediatrician or licensed psychologist can unlock school services, insurance coverage, and therapy funding. Ask your pediatrician for a referral or contact your school district for a no-cost evaluation pathway.',
    firstMove: 'Request a referral list from your pediatrician and book the earliest formal evaluation you can get.',
    whileWaiting: 'Ask the school district whether they offer a no-cost evaluation pathway while you wait for outside appointments.',
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
      'A speech-language pathologist can assess your child\'s communication, language, and social communication needs. Ask your pediatrician for a referral, or contact your school district if your child is school-aged.',
    firstMove: 'Ask for an SLP evaluation referral, then call two or three pediatric speech providers to compare waitlists.',
    whileWaiting: 'If waitlists are long, ask each office about cancellations and whether they can review prior evaluations first.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'Autism and communication (ASHA)', url: 'https://www.asha.org/public/speech/disorders/autism/' },
      { label: 'ASHA ProFind - find an SLP near you', url: 'https://www.asha.org/profind/' },
    ],
  },
  'find-ot': {
    id: 'find-ot',
    title: 'Schedule an Occupational Therapy (OT) evaluation',
    description:
      'An OT can assess sensory processing, fine motor skills, and daily living challenges. Many children with ASD or sensory processing differences benefit significantly from OT. Ask your pediatrician for a referral.',
    firstMove: 'Find an OT who works with pediatric sensory or daily-living needs and ask what their intake process looks like.',
    whileWaiting: 'Write down the situations that feel hardest at home so you have concrete examples ready for the evaluation.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: 'What is occupational therapy? (AOTA)', url: 'https://www.aota.org/about/what-is-ot' },
      { label: 'Find your state OT association (AOTA)', url: 'https://www.aota.org/community/get-involved/state-associations' },
    ],
  },
  'explore-aba-under6': {
    id: 'explore-aba-under6',
    title: 'Start ABA therapy — act now',
    description:
      'This is the golden window. Early intensive ABA (25-40 hrs/week) has the strongest evidence base for this age. Insurance coverage is highest and most centers prioritize under-6. Do not wait — get on waitlists now even before funding is confirmed.',
    firstMove: 'Make a short list of providers and ask how they set goals, involve parents, and measure progress.',
    whileWaiting: 'Compare home-based, clinic-based, and school-coordinated options instead of choosing by name recognition alone.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'What is ABA? (Autism Speaks)', url: 'https://www.autismspeaks.org/applied-behavior-analysis' },
      { label: 'ABA therapy overview (Autism Science Foundation)', url: 'https://autismsciencefoundation.org/what-is-autism/aba-applied-behavior-analysis/' },
    ],
  },
  'explore-aba-6-12': {
    id: 'explore-aba-6-12',
    title: 'Get ABA therapy started',
    description:
      'ABA is still the core intervention. However, centers vary on age acceptance. Confirm insurance coverage first, then get on multiple waitlists simultaneously. School-based ABA through IEP is also an option worth requesting.',
    firstMove: 'Make a short list of providers and ask how they set goals, involve parents, and measure progress.',
    whileWaiting: 'Compare home-based, clinic-based, and school-coordinated options instead of choosing by name recognition alone.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'What is ABA? (Autism Speaks)', url: 'https://www.autismspeaks.org/applied-behavior-analysis' },
      { label: 'ABA therapy overview (Autism Science Foundation)', url: 'https://autismsciencefoundation.org/what-is-autism/aba-applied-behavior-analysis/' },
    ],
  },
  'explore-aba-teen': {
    id: 'explore-aba-teen',
    title: 'Explore ABA-informed programs for adolescents',
    description:
      'Center-based ABA becomes harder to access at this age. Focus on ABA-informed transition planning and life skills programs. Look for BCBAs who specialize in adolescents — they exist but are fewer.',
    firstMove: 'Make a short list of providers and ask how they set goals, involve parents, and measure progress.',
    whileWaiting: 'Compare home-based, clinic-based, and school-coordinated options instead of choosing by name recognition alone.',
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
      'Send a written request to your school\'s special education office. By law, the district must respond and evaluate your child at no cost. An IEP can unlock classroom supports, therapy at school, and specialized instruction.',
    firstMove: 'Send a written request to the school or district asking for a full special education evaluation.',
    whileWaiting: 'Save copies of emails, reports, and behavior or communication notes so you walk into meetings prepared.',
    category: 'school',
    urgency: 'immediate',
    resources: [
      { label: 'How to request an IEP (Wrightslaw)', url: 'https://www.wrightslaw.com/info/iep.htm' },
      { label: 'IEP guide for parents (PACER)', url: 'https://www.pacer.org/parent/iep/' },
      { label: 'School evaluation basics (CPIR)', url: 'https://www.parentcenterhub.org/evaluation/' },
    ],
  },
  'review-insurance': {
    id: 'review-insurance',
    title: 'Review your insurance coverage for therapy',
    description:
      'Call your insurer and ask what autism-related services are covered, whether prior authorization is needed, and what your out-of-pocket responsibility could be. Getting this answered early prevents billing surprises.',
    firstMove: 'Call the member-services number on your insurance card and ask about SLP, OT, ABA, and prior authorization rules.',
    whileWaiting: 'Write down reference numbers, coverage details, and in-network rules during the call so you do not repeat work later.',
    category: 'insurance',
    urgency: 'soon',
    resources: [
      { label: 'State autism insurance mandates (Autism Speaks)', url: 'https://www.autismspeaks.org/autism-insurance-resource-center' },
      { label: 'Free or low-cost coverage via CHIP or Medicaid', url: 'https://www.insurekidsnow.gov/' },
    ],
  },
  'connect-parents': {
    id: 'connect-parents',
    title: 'Connect with other autism parents',
    description:
      'Parent support groups, both local and online, are often some of the most practical resources after a diagnosis. Other parents can help you learn local timelines, therapists, school systems, and what to do next.',
    firstMove: 'Join one local or online parent group and spend a few minutes reading recent posts before asking your first question.',
    whileWaiting: 'Look for region-specific recommendations about waitlists, school timelines, and providers rather than generic advice.',
    category: 'community',
    urgency: 'when-ready',
    resources: [
      { label: 'Find your local Autism Society chapter', url: 'https://autismsociety.org/get-involved/chapters/' },
      { label: 'POAC-NOVA (example regional group - Northern Virginia)', url: 'https://poac-nova.org/' },
      { label: 'Autism Parent Support (Facebook group)', url: 'https://www.facebook.com/groups/autismparentssupport/' },
    ],
  },
  'parent-wellbeing': {
    id: 'parent-wellbeing',
    title: 'Take care of your own mental health',
    description:
      'A diagnosis can be emotionally exhausting for parents. You cannot advocate well for your child if you are burned out. Look into peer support, parent coaching, respite options, or a therapist who understands caregiver stress.',
    firstMove: 'Pick one small support step for yourself this week, even if it is only a therapist intake call or a support-group signup.',
    whileWaiting: 'Reduce the size of the task until it becomes realistic. Progress matters more than intensity here.',
    category: 'parent',
    urgency: 'soon',
    resources: [
      { label: 'NAMI family support groups', url: 'https://www.nami.org/Support-Education/Support-Groups' },
      { label: 'Caregiver support resources (Autism Speaks)', url: 'https://www.autismspeaks.org/tool-kit/100-day-kit-young-children' },
    ],
    supportItems: [
      { label: 'Top autism parenting books (Amazon)', url: 'https://www.amazon.com/s?k=autism+parenting+books' },
    ],
  },
  'adhd-management': {
    id: 'adhd-management',
    title: 'Explore ADHD evaluation and management',
    description:
      'ADHD co-occurs in 40-70% of autistic children. ABA therapy addresses behavioral symptoms first. For older children or when behavioral therapy alone isn\'t enough, consult a developmental pediatrician or child psychiatrist about medication options — stimulants and non-stimulants are both used, but response varies. Do not start medication without specialist guidance.',
    firstMove: 'Bring attention and regulation concerns to your next pediatrician or psychiatry visit and ask whether ADHD evaluation fits.',
    whileWaiting: 'Keep a short log of patterns at home and school so you can describe what is actually happening.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: 'CHADD - ADHD resource center', url: 'https://chadd.org/' },
      { label: 'ADHD and autism: what parents need to know', url: 'https://www.additudemag.com/adhd-and-autism/' },
    ],
  },
  'transition-planning': {
    id: 'transition-planning',
    title: 'Start transition planning for adulthood',
    description:
      'For teens, transition planning should cover post-secondary education, employment, and independent living. Ask your school team what transition services are already available and what should be added to the plan.',
    firstMove: 'Ask the school team what transition planning is already in place and what should be added this year.',
    whileWaiting: 'List the skills that matter most after high school so meetings stay grounded in real goals.',
    category: 'school',
    urgency: 'soon',
    resources: [
      { label: 'Transition guide for families (PACER)', url: 'https://www.pacer.org/transition/' },
      { label: 'Find your state vocational rehabilitation office', url: 'https://rsa.ed.gov/about/states' },
      { label: 'Autism Speaks transition tool kit', url: 'https://www.autismspeaks.org/tool-kit/transition-tool-kit' },
    ],
  },
  'understand-your-rights': {
    id: 'understand-your-rights',
    title: 'Learn your rights under IDEA and ADA',
    description:
      'IDEA gives your child the right to a Free Appropriate Public Education. The ADA helps protect against discrimination. A basic understanding of these rights makes school meetings much less overwhelming.',
    firstMove: 'Read one plain-language IDEA overview before your next school meeting so the terminology is less opaque.',
    whileWaiting: 'Keep a running list of terms or acronyms you want clarified rather than trying to learn everything at once.',
    category: 'school',
    urgency: 'when-ready',
    resources: [
      { label: 'Wrightslaw - special education law and advocacy', url: 'https://www.wrightslaw.com/' },
      { label: 'Top 10 basics of special education (CPIR)', url: 'https://www.parentcenterhub.org/partb-module1/' },
    ],
  },
  'find-developmental-ped': {
    id: 'find-developmental-ped',
    title: 'Establish care with a developmental pediatrician',
    description:
      'If your diagnosis came from a school team or psychologist, consider also establishing care with a developmental pediatrician. They can help coordinate referrals, discuss co-occurring conditions, and give you a broader treatment plan.',
    firstMove: 'Ask your pediatrician or insurer for in-network developmental pediatrics options and compare wait times immediately.',
    whileWaiting: 'If waits are long, ask whether a general pediatrician, psychologist, or nurse line can help bridge referrals.',
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
      'While waiting for OT, you can start with low-cost sensory adjustments such as quieter spaces, dimmer lighting, visual routines, and a few calming tools. An OT can later help tailor a more personalized plan.',
    firstMove: 'Choose one specific routine that is breaking down at home and make one sensory adjustment to test this week.',
    whileWaiting: 'Track what helps and what does not so future OT conversations are based on patterns rather than guesswork.',
    category: 'parent',
    urgency: 'when-ready',
    resources: [
      { label: 'Understanding sensory processing (STAR Institute)', url: 'https://sensoryhealth.org/basic/understanding-sensory-processing-disorder' },
    ],
    supportItems: [
      { label: 'Fidget and sensory toys (Amazon)', url: 'https://www.amazon.com/s?k=autism+sensory+fidget+toys' },
      { label: 'Noise-canceling headphones for kids (Amazon)', url: 'https://www.amazon.com/s?k=noise+canceling+headphones+kids+autism' },
      { label: 'Weighted blankets for children (Amazon)', url: 'https://www.amazon.com/s?k=weighted+blanket+kids+autism' },
    ],
  },
  'intellectual-disability': {
    id: 'intellectual-disability',
    title: 'Contact your county Regional Center for Intellectual Disability services',
    description:
      'Intellectual Disability support is primarily coordinated through your county\'s Regional Center or Developmental Disabilities services — not through private therapy. Contact your county Regional Center immediately to open a case. They will assess your child and coordinate services including respite care, day programs, and skill-building support.',
    firstMove: 'Contact your county Regional Center or developmental disabilities office and ask how to open a case.',
    whileWaiting: 'Gather evaluation reports, school records, and any notes about daily support needs before the intake call.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: 'Find your state DD services office (NASDDDS)', url: 'https://www.nasddds.org/member-agencies/' },
      { label: 'Regional Center services overview (The Arc)', url: 'https://thearc.org/our-initiatives/resource-advocacy/' },
    ],
  },
};
