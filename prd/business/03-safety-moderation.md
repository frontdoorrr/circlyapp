# 안전성 및 콘텐츠 조절 시스템

## 개요
중고등학생 대상 서비스로서 **안전한 소통 환경 조성**이 최우선입니다. 사이버불링, 따돌림, 부적절한 콘텐츠를 사전에 차단하고 건전한 칭찬 문화를 정착시키는 것이 목표입니다.

## 🛡️ 3단계 안전망 시스템

### 1단계: 사전 예방 (Prevention)
질문 템플릿 기반으로 부적절한 콘텐츠 원천 차단

#### 템플릿 검증 프로세스
```
질문 제안 → 교육 전문가 검토 → 키워드 분석 → 베타 테스트 → 승인/반려
```

#### 금지 키워드 필터링
```javascript
// 부적절한 키워드 카테고리
const blockedKeywords = {
  appearance_negative: ['못생긴', '추한', '뚱뚱한', '키 작은'],
  bullying: ['싫어하는', '따돌림', '무시하는', '괴롭히는'],
  sexual: ['섹시한', '몸매', '가슴', '엉덩이'],
  discriminatory: ['머리 나쁜', '가난한', '더러운', '냄새나는'],
  ranking_negative: ['최악', '꼴찌', '바닥', '형편없는']
};
```

#### 긍정적 질문 강화
- 전체 템플릿의 80% 이상을 긍정적 칭찬으로 구성
- 외모보다 성격/재능 중심 질문 우선 배치
- 계절별/이벤트별 특별 긍정 질문 추가

### 2단계: 실시간 모니터링 (Detection)
AI 기반 이상 패턴 탐지 및 사용자 신고 시스템

#### 이상 투표 패턴 탐지
```python
# 의심스러운 패턴들
suspicious_patterns = {
    'vote_concentration': {
        'threshold': 0.8,  # 한 사람이 80% 이상 득표
        'action': 'review_required'
    },
    'zero_votes': {
        'threshold': 0.05,  # 5% 미만 득표
        'action': 'counseling_alert'  
    },
    'rapid_polling': {
        'threshold': 5,  # 같은 사용자가 1시간 내 5개 투표 생성
        'action': 'rate_limit'
    },
    'targeting_pattern': {
        'description': '특정 사용자를 지속적으로 타겟하는 패턴',
        'action': 'investigation'
    }
}
```

#### 신고 시스템
```
사용자 신고 → 자동 임시 숨김 → AI 1차 분석 → 인간 검토 → 최종 조치
```

**신고 카테고리:**
- 따돌림/괴롭힘
- 부적절한 질문
- 스팸/반복 행위
- 개인정보 노출
- 기타 부적절한 행위

### 3단계: 사후 대응 (Response)
위반 사항에 대한 단계적 제재 및 교육

#### 제재 단계
```
1단계: 주의 경고 (24시간 투표 생성 제한)
2단계: 일시 정지 (7일간 서비스 이용 제한)  
3단계: 계정 정지 (30일간 모든 활동 제한)
4단계: 영구 퇴출 (계정 완전 삭제)
```

#### 교육적 접근
- 제재 시 **왜 문제인지** 구체적 설명 제공
- **올바른 사용법** 가이드 의무 학습
- **긍정적 소통** 방법 제안

## 🎯 Circle 단위 안전 관리

### Circle 건전성 지수
각 Circle의 건전성을 수치화하여 관리

```javascript
const circleHealthScore = {
  participation_rate: 0.3,      // 참여율 (30%)
  positive_feedback: 0.25,      // 긍정적 피드백 (25%)
  report_frequency: 0.2,        // 신고 빈도 (20%)
  voting_distribution: 0.15,    // 투표 분산도 (15%)
  member_retention: 0.1         // 멤버 유지율 (10%)
};

// 70점 이하 시 주의 Circle로 분류
// 50점 이하 시 집중 모니터링
// 30점 이하 시 Circle 해체 검토
```

### Circle 관리자 권한 강화
```
Circle 생성자 권한:
✅ 부적절한 멤버 퇴출
✅ 투표 삭제 (24시간 내)
✅ Circle 설정 변경
✅ 신고 우선 처리 요청

제한사항:
❌ 개별 투표 내역 조회 불가
❌ 멤버 강제 투표 불가
❌ 익명성 해제 불가
```

### 자동 개입 시스템
```python
def auto_intervention(circle_id, health_score):
    if health_score < 30:
        # 긴급 개입
        suspend_circle_temporarily()
        notify_all_members("Circle이 일시 중단되었습니다")
        alert_moderation_team()
        
    elif health_score < 50:
        # 경고 및 가이드
        show_warning_to_creator()
        limit_poll_creation()
        increase_monitoring_frequency()
        
    elif health_score < 70:
        # 주의 알림
        send_health_tips()
        recommend_positive_templates()
```

## 👁️ AI 기반 콘텐츠 모더레이션

### 다층 AI 분석 시스템
```
입력 데이터 → 키워드 필터 → 감정 분석 → 의도 분석 → 위험도 산출
```

#### 감정 분석 모델
```python
sentiment_analysis = {
    'positive': ['친절한', '예쁜', '잘생긴', '똑똑한', '재밌는'],
    'neutral': ['조용한', '차분한', '성실한'],
    'negative': ['못생긴', '싫어하는', '짜증나는'],
    'borderline': ['특이한', '독특한', '개성있는']  # 문맥에 따라 판단
}
```

#### 의도 분석
- **칭찬 의도**: 긍정적 특성 강조
- **중립 의도**: 객관적 특성 언급  
- **비하 의도**: 부정적 특성 강조
- **괴롭힘 의도**: 따돌림/상처 주기 목적

### 실시간 위험도 평가
```javascript
function calculateRiskScore(pollData) {
  let riskScore = 0;
  
  // 질문 내용 분석
  riskScore += analyzeQuestionContent(pollData.question);
  
  // 투표 패턴 분석
  riskScore += analyzeVotingPattern(pollData.votes);
  
  // Circle 히스토리 분석
  riskScore += analyzeCircleHistory(pollData.circleId);
  
  // 사용자 행동 분석
  riskScore += analyzeUserBehavior(pollData.creatorId);
  
  return Math.min(riskScore, 100);  // 최대 100점
}

// 위험도별 조치
if (riskScore >= 80) immediate_block();
else if (riskScore >= 60) manual_review();
else if (riskScore >= 40) increased_monitoring();
```

## 📊 교육 및 예방 프로그램

### 디지털 시민의식 교육
앱 내 교육 콘텐츠 제공

#### 1주차: 익명성의 책임
```
"익명이라고 해서 아무 말이나 해도 될까요?
 화면 뒤에도 사람이 있다는 걸 잊지 마세요."

🎯 학습 목표:
- 익명 환경에서의 올바른 소통법
- 상대방 입장에서 생각하기
- 말의 힘과 영향력 이해
```

#### 2주차: 긍정적 소통의 힘
```
"칭찬과 격려가 만드는 변화를 경험해보세요.
 작은 관심이 큰 힘이 될 수 있어요."

🎯 학습 목표:
- 건설적 피드백 방법
- 칭찬의 구체적 표현법
- 다양성 존중하기
```

#### 3주차: 사이버불링 예방
```
"재미있다고 시작한 일이 
 누군가에게는 상처가 될 수 있어요."

🎯 학습 목표:
- 사이버불링의 정의와 유형
- 목격 시 대처 방법
- 도움 요청 방법
```

### 가이드라인 게임화
교육을 재미있게 만드는 게임 요소 도입

```javascript
const educationAchievements = {
  'compliment_master': {
    name: '칭찬왕',
    description: '10번의 긍정적 투표 참여',
    reward: '특별 닉네임 뱃지'
  },
  'peace_keeper': {
    name: '평화지킴이', 
    description: '건전한 Circle 운영 30일',
    reward: '리더십 아이콘'
  },
  'helper': {
    name: '도우미',
    description: '신규 사용자 도움 5회',
    reward: '멘토 칭호'
  }
};
```

## 🚨 위기 상황 대응 매뉴얼

### 심각한 사이버불링 탐지 시
```
1. 즉시 조치 (5분 내)
   - 해당 투표/Circle 임시 차단
   - 관련 사용자들에게 긴급 알림
   - 모더레이션 팀 긴급 소집

2. 조사 및 분석 (1시간 내)
   - 상황 파악 및 증거 수집
   - 피해자/가해자 식별
   - 영향 범위 분석

3. 대응 및 지원 (24시간 내)
   - 가해자 계정 정지
   - 피해자 보호 조치
   - 관련 Circle 모니터링 강화
   - 학교/부모 연락 (필요시)

4. 후속 조치 (1주 내)
   - 재발 방지 방안 수립
   - 시스템 개선 사항 반영
   - 유사 상황 예방 교육 강화
```

### 학교폭력 연계 의심 시
```
⚠️ 즉시 대응 필요 상황:
- 특정 학생 집중 타겟팅
- 오프라인 괴롭힘 암시 내용
- 자해/우울감 관련 표현
- 협박성 메시지

🏥 지원 연계:
- 청소년 상담센터 연결
- 학교폭력 신고센터 안내
- 전문 상담사 매칭
- 24시간 핫라인 제공
```

## 📈 안전성 지표 모니터링

### 일일 모니터링 지표
```javascript
const dailySafetyMetrics = {
  report_count: 0,              // 신고 건수
  blocked_content: 0,           // 차단된 콘텐츠 수
  risk_score_average: 0,        // 평균 위험도
  intervention_cases: 0,        // 개입 사례 수
  positive_feedback_ratio: 0,   // 긍정 피드백 비율
  user_education_completion: 0  // 교육 완료율
};
```

### 주간 안전성 리포트
- Circle별 건전성 순위
- 위험 패턴 트렌드 분석
- 교육 프로그램 효과 측정
- 개선 권고사항

### 월간 안전성 감사
- 전체 시스템 안전성 평가
- 모더레이션 정책 효과성 검토
- 외부 전문가 자문
- 정책 업데이트 계획

## 🤝 외부 협력 체계

### 교육 기관 협력
- **학교 상담교사**: 문제 상황 조기 발견
- **교육청**: 정책 가이드라인 준수
- **학부모회**: 가정 내 교육 연계

### 전문 기관 연계
- **청소년 상담센터**: 전문 상담 서비스
- **사이버경찰청**: 심각한 사이버범죄 신고
- **아동청소년 보호기관**: 위기 상황 대응

이 안전성 시스템을 통해 Circly가 **건전하고 안전한 소통 공간**이 될 수 있도록 보장합니다! 🛡️✨