import { RecommendedAction } from './types';

export const KR_ACTIONS: Record<string, RecommendedAction> = {
  'request-special-ed-kr': {
    id: 'request-special-ed-kr',
    title: '교육청에 특수교육대상자 선정 신청하기',
    description:
      '특수교육 지원은 학교가 허락해 주는 제도가 아니라 법에 근거한 신청 절차입니다. 어린이집·유치원에 다니는 미취학 아동도 신청할 수 있으며, 이 경우 순회치료지원(치료사가 기관에 직접 방문) 서비스를 받을 수 있습니다. 초등학교 입학 전에 선정을 받아 두면 입학 후 지원 배치가 훨씬 수월합니다.',
    firstMove: '거주 지역 교육청 특수교육지원센터에 전화해 특수교육대상자 선정 신청 절차와 필요 서류를 물어보세요. 미취학 아동이라면 "유치원·어린이집 재원 중 신청 가능 여부"를 명시해서 문의하세요.',
    whileWaiting: '어린이집, 유치원, 학교의 관찰 메모와 기존 검사 결과를 한 폴더에 모아 두세요. 선정 신청 후 교육청 특수교육지원센터에서 진단·평가를 진행하며, 결과에 따라 배치가 결정됩니다.',
    category: 'school',
    urgency: 'immediate',
    resources: [
      { label: '국립특수교육원', url: 'https://www.nise.go.kr/' },
      { label: '교육부 특수교육', url: 'https://www.moe.go.kr/' },
      { label: '에듀에이블 특수교육 포털', url: 'https://www.eduable.net/' },
    ],
  },
  'understand-iep-kr': {
    id: 'understand-iep-kr',
    title: '개별화교육계획 이해하고 요청하기',
    description:
      '개별화교육계획은 자녀에게 필요한 교육 목표와 지원을 문서로 정리하는 과정입니다. 특수학급, 통합학급, 특수학교 중 무엇이 맞는지는 자녀 상황과 지역 여건에 따라 달라질 수 있습니다.',
    firstMove: '학교 또는 교육청에 개별화교육지원팀 회의가 어떻게 열리는지 물어보고, 부모 의견을 문서로 준비하세요.',
    whileWaiting: '자녀가 학교에서 어려워하는 시간, 과목, 상황을 짧게 기록해 두면 회의에서 훨씬 구체적으로 말할 수 있습니다.',
    category: 'school',
    urgency: 'soon',
    resources: [
      { label: '국립특수교육원 학부모 자료', url: 'https://www.nise.go.kr/' },
      { label: '교육부 특수교육', url: 'https://www.moe.go.kr/' },
    ],
  },
  'find-developmental-ped-kr': {
    id: 'find-developmental-ped-kr',
    title: '발달소아과 또는 소아정신과 진료 예약하기',
    description:
      '유명 병원 대기는 평균 수개월~1년 이상입니다. 대기를 줄이는 핵심은 병원 선택지를 넓히는 것입니다. 소아정신과보다 재활의학과가 대기가 짧은 경우가 많고, 만 9세 미만이라면 공식 진단 없이도 소아청소년과 의뢰서만으로 발달재활서비스 바우처를 신청할 수 있습니다. 대형병원 취소 자리 알림 서비스(앱·카카오톡 채널)도 적극 활용하세요.',
    firstMove: '전화할 병원 목록을 5곳 이상 만드세요. 상급종합병원 재활의학과·소아정신건강의학과, 지역 대학병원, 민간 발달클리닉까지 넓게 잡고, 초진 대기 기간과 취소 자리 알림 가능 여부를 같은 날 확인하세요.',
    whileWaiting: '만 9세 미만이라면 동네 소아청소년과에서 "발달재활서비스 의뢰서"를 받아 바우처 신청을 먼저 진행할 수 있습니다. 진단을 기다리는 동안 치료를 시작하는 것이 가능합니다.',
    category: 'doctor',
    urgency: 'immediate',
    resources: [
      { label: '대한소아청소년정신의학회', url: 'https://www.kacap.or.kr/' },
      { label: '대한재활의학회', url: 'https://www.karm.or.kr/' },
      { label: '건강보험심사평가원 병원 찾기', url: 'https://www.hira.or.kr/' },
      { label: '국민건강보험 병의원 찾기', url: 'https://www.nhis.or.kr/' },
    ],
  },
  'prepare-first-appointment-kr': {
    id: 'prepare-first-appointment-kr',
    title: '첫 진료 전에 준비할 것들',
    description:
      '짧은 진료 시간에 모든 것을 설명하기는 어렵습니다. 관찰 메모, 영상, 기존 검사지를 준비하면 의사가 자녀의 일상 모습을 더 빨리 이해할 수 있습니다.',
    firstMove: '교사 관찰 메모, 가정에서 찍은 짧은 영상, 기존 검사 결과지, 성장 기록을 한 폴더에 모으세요.',
    whileWaiting: '말, 수면, 식사, 감각, 등원/등교 상황에서 가장 힘든 장면을 날짜와 함께 짧게 적어두세요.',
    category: 'doctor',
    urgency: 'soon',
    resources: [
      { label: '질병관리청 국가건강정보포털', url: 'https://health.kdca.go.kr/' },
    ],
  },
  'darei-services': {
    id: 'darei-services',
    title: '발달재활서비스(바우처) 신청하기',
    description:
      '발달재활서비스는 발달센터 치료 비용을 정부가 지원하는 바우처 제도입니다. 이 바우처는 보건복지부에 등록된 발달센터에서만 사용할 수 있습니다. 소득에 따라 월 17만~25만원이 지원되며, 2025년부터 만 9세 미만은 장애등록 없이도 신청할 수 있습니다. 바우처를 받은 후에는 국민행복카드를 발급해야 실제로 사용할 수 있습니다.',
    firstMove: '복지로 모의계산기로 소득 기준(기준중위소득 180% 이하) 해당 여부를 먼저 확인한 뒤, 주민센터 또는 복지로에서 신청하세요.',
    whileWaiting: '국민행복카드를 아직 발급받지 않았다면 신청과 동시에 진행하세요. 지역 내 등록 제공기관(발달센터) 목록은 사회서비스 전자바우처 사이트에서 확인할 수 있습니다.',
    category: 'government',
    urgency: 'immediate',
    resources: [
      { label: '복지로 모의계산기 (소득 기준 확인)', url: 'https://www.bokjiro.go.kr/ssis-tbu/twatsa/wlfareAnonymSimulat/retrieveWlfareAnonymSimulat.do' },
      { label: '사회서비스 전자바우처', url: 'https://www.socialservice.or.kr/' },
      { label: '복지로 바우처 신청', url: 'https://www.bokjiro.go.kr/' },
      { label: '보건복지부 발달재활서비스', url: 'https://www.mohw.go.kr/' },
    ],
  },
  'find-developmental-center-kr': {
    id: 'find-developmental-center-kr',
    title: '발달센터 찾기',
    description:
      '한국의 발달치료는 언어치료, 작업치료, 감각통합치료, 인지치료, 행동발달치료를 한 곳에서 제공하는 발달센터를 중심으로 이루어집니다. 미국처럼 각 치료사를 따로 찾을 필요 없이 발달센터 한 곳에서 여러 치료를 받을 수 있습니다. 발달재활서비스 바우처를 사용하려면 보건복지부에 등록된 제공기관이어야 합니다.',
    firstMove: '사회서비스 전자바우처 사이트에서 집 근처 발달재활서비스 제공기관을 검색하고, 3곳 이상에 초기 평가 대기 기간과 치료 가능 항목을 문의하세요.',
    whileWaiting: '센터마다 강점이 다릅니다. 언어치료 전문 여부, 감각통합 장비 보유 여부, 부모 상담 포함 여부를 물어보면 비교에 도움이 됩니다.',
    category: 'therapy',
    urgency: 'immediate',
    resources: [
      { label: '발달재활서비스 제공기관 찾기', url: 'https://www.socialservice.or.kr:444/user/svcsrch/supply/supplyList.do' },
      { label: '복지로 제공기관 검색', url: 'https://www.bokjiro.go.kr/' },
    ],
  },
  'find-slp-kr': {
    id: 'find-slp-kr',
    title: '언어치료 전문 센터 알아보기',
    description:
      '말이 주된 어려움이라면 언어치료에 특화된 센터나 언어재활사를 따로 찾는 것이 도움이 될 수 있습니다. 발달센터에 언어치료가 포함되어 있더라도, 언어 전문 센터에서 주 2-3회 집중적으로 받는 것과는 차이가 있습니다. 진단명이 확정되기 전에도 언어평가부터 시작할 수 있습니다.',
    firstMove: '집이나 어린이집/학교 근처 언어치료 전문 센터 3곳 이상에 초기 평가 가능일과 대기 기간을 문의하세요.',
    whileWaiting: '서울 외 지역은 선택지가 적을 수 있습니다. 이동 거리와 온라인 언어치료 가능 여부도 함께 확인하세요.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: '한국언어재활사협회', url: 'https://www.ksha1990.or.kr/' },
    ],
  },
  'behavior-therapy-kr': {
    id: 'behavior-therapy-kr',
    title: '행동발달치료 전문기관 알아보기',
    description:
      '반복 행동, 자해, 공격행동처럼 일상을 방해하는 행동이 주된 어려움이라면 행동발달치료에 특화된 기관을 찾아볼 수 있습니다. 한국의 ABA 전문기관은 많지 않으므로 발달센터 내 행동발달치료사 유무도 함께 확인하세요.',
    firstMove: '상담 때 목표를 어떻게 정하는지, 부모 교육이 포함되는지, 치료 기록을 공유하는지 물어보세요.',
    whileWaiting: '가정에서 가장 힘든 행동 하나를 정해 언제, 어디서, 무엇 뒤에 생기는지 짧게 기록해 두세요.',
    category: 'therapy',
    urgency: 'soon',
    resources: [
      { label: '한국자폐인사랑협회', url: 'https://www.autismkorea.kr/' },
      { label: '한국응용행동분석전문가협회', url: 'https://kacba.com/' },
    ],
  },
  'regional-disability-center': {
    id: 'regional-disability-center',
    title: '지역 발달장애인지원센터 연락하기',
    description:
      '발달장애인지원센터는 상담, 서비스 연결, 부모 지원 정보를 제공하는 공공 지원 창구입니다. 무료로 이용 가능한 정보가 많지만 부모들이 모르는 경우가 많습니다. 전국 17개 광역시도에 각 1개씩 지역 센터가 있으며, 중앙센터 사이트에서 거주 지역 센터를 바로 찾을 수 있습니다.',
    firstMove: '중앙장애아동·발달장애인지원센터 사이트에서 거주 지역 센터를 찾아 전화하세요. 받을 수 있는 상담과 서비스 안내를 요청하면 됩니다.',
    whileWaiting: '현재 진단 여부, 치료 여부, 학교 상황을 간단히 정리해 두면 상담이 더 구체적입니다.',
    category: 'government',
    urgency: 'soon',
    resources: [
      { label: '지역 센터 찾기 (전국 목록)', url: 'https://www.broso.or.kr/seoul/service/M0000401/list.do' },
      { label: '중앙장애아동·발달장애인지원센터', url: 'https://www.broso.or.kr/' },
      { label: '한국장애인개발원', url: 'https://www.koddi.or.kr/' },
    ],
  },
  'disability-registration': {
    id: 'disability-registration',
    title: '장애 등록은 언제 필요한지 확인하기',
    description:
      '장애 등록은 낙인이 아니라 일부 복지 서비스와 지원을 이용하기 위한 행정 절차가 될 수 있습니다. 다만 시기와 필요성은 자녀 상황에 따라 달라집니다.',
    firstMove: '주민센터에 장애 등록 절차와 필요한 진단서, 국민연금공단 심사 과정을 문의하세요.',
    whileWaiting: '등록을 서두를지 여부는 이용하려는 서비스와 가족의 준비 정도를 함께 보고 결정해도 됩니다.',
    category: 'government',
    urgency: 'when-ready',
    resources: [
      { label: '복지로 장애인 등록 안내', url: 'https://www.bokjiro.go.kr/' },
      { label: '국민연금공단 장애심사', url: 'https://www.nps.or.kr/' },
    ],
  },
  'parent-counseling-support-kr': {
    id: 'parent-counseling-support-kr',
    title: '발달장애인 부모상담지원 알아보기',
    description:
      '진단 이후 충격과 혼란을 느끼는 것은 자연스러운 반응입니다. 부모상담지원은 보호자의 심리 상담을 돕는 공공 지원 제도입니다.',
    firstMove: '지역 발달장애인지원센터나 주민센터에 부모상담지원 신청 가능 여부를 문의하세요.',
    whileWaiting: '혼자서 하고 있다면 더더욱 지원을 요청할 이유가 충분합니다. 모든 설명을 가족에게 먼저 해야 할 필요는 없습니다.',
    category: 'parent',
    urgency: 'soon',
    resources: [
      { label: '중앙장애아동·발달장애인지원센터', url: 'https://www.broso.or.kr/' },
      { label: '정신건강복지센터', url: 'https://www.mentalhealth.go.kr/' },
    ],
  },
  'parent-community-kr': {
    id: 'parent-community-kr',
    title: '다른 부모들과 연대하기',
    description:
      '공식 기관은 제도를 알려주고, 부모 커뮤니티는 실제 대기, 치료실, 학교 경험을 알려줄 수 있습니다. 다만 온라인 경험담은 참고 자료로만 보세요.',
    firstMove: '전국장애인부모연대, 한국자폐인사랑협회, 지역 부모 모임 중 하나를 조용히 둘러보는 것부터 시작하세요.',
    whileWaiting: '자녀 이름, 학교, 병원 정보처럼 개인 정보는 공개하지 않는 편이 안전합니다.',
    category: 'community',
    urgency: 'when-ready',
    resources: [
      { label: '전국장애인부모연대', url: 'https://www.bumo.or.kr/' },
      { label: '한국자폐인사랑협회', url: 'https://www.autismkorea.kr/' },
      { label: '네이버 카페 검색', url: 'https://section.cafe.naver.com/' },
    ],
  },
  'parent-wellbeing-kr': {
    id: 'parent-wellbeing-kr',
    title: '내 자신을 돌보는 것도 중요합니다',
    description:
      '부모가 지치면 정보도, 치료도, 학교 대응도 오래 이어가기 어렵습니다. 지금은 완벽한 부모가 되는 것이 아니라 버틸 수 있는 구조를 만드는 시간이기도 합니다.',
    firstMove: '이번 주에 부모상담, 지역 센터 상담, 믿을 수 있는 사람에게 도움 요청 중 하나만 선택하세요.',
    whileWaiting: '치료와 정보보다 먼저, 지금 당신이 괜찮은지가 중요할 때가 있습니다. 급하면 1393 또는 1577-0199 같은 상담 전화를 이용하세요.',
    category: 'parent',
    urgency: 'soon',
    resources: [
      { label: '자살예방상담전화 1393', url: 'https://www.1393.go.kr/' },
      { label: '정신건강상담전화 1577-0199', url: 'https://www.mentalhealth.go.kr/' },
      { label: '발달장애인 부모상담지원', url: 'https://www.broso.or.kr/' },
    ],
    supportItems: [
      { label: 'Yes24 자폐 부모 도서', url: 'https://www.yes24.com/Product/Search?query=%EC%9E%90%ED%8F%90%20%EB%B6%80%EB%AA%A8' },
      { label: 'Kyobo 자폐 부모 도서', url: 'https://search.kyobobook.co.kr/search?keyword=%EC%9E%90%ED%8F%90%20%EB%B6%80%EB%AA%A8' },
      { label: 'Amazon autism parenting books', url: 'https://www.amazon.com/s?k=autism+parenting+books' },
    ],
  },
};
