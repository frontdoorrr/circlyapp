# Circly 프로젝트 README

## 🎉 Circly - 익명 칭찬 투표 플랫폼

Z세대를 위한 익명 칭찬 투표 앱의 프론트엔드 구현체입니다. 파스텔 톤 디자인과 부드러운 애니메이션으로 친근하고 트렌디한 사용자 경험을 제공합니다.

## 📁 프로젝트 구조

```
circly-app/
├── index.html              # 메인 HTML 파일
├── styles.css              # 기본 CSS (미완성)
├── styles-complete.css     # 완전한 CSS 스타일시트
├── script.js              # JavaScript 기능 구현
├── design-guide.md        # 디자인 시스템 기본 가이드
└── design-guide-complete.md # 상세 디자인 가이드
```

## 🚀 주요 기능

### ✨ 핵심 기능
- **3탭 네비게이션**: Home, Create, Profile
- **투표 생성/참여**: 템플릿 기반 질문 선택
- **실시간 결과**: 애니메이션이 포함된 차트
- **Circle 초대**: 링크/코드 공유 시스템
- **결과 카드**: SNS 공유용 이미지 생성

### 🎨 디자인 특징
- **Z세대 감성**: 파스텔 컬러 팔레트
- **모바일 최적화**: 480px 최대 너비
- **부드러운 애니메이션**: 300ms 전환 효과
- **인터랙티브**: 호버/터치 피드백
- **글래스모피즘**: 블러 효과와 투명도

## 🎨 컬러 시스템

```css
/* Primary Colors */
--purple-500: #a855f7    /* 주요 브랜드 */
--pink-500: #ec4899      /* 액센트 */
--blue-400: #60a5fa      /* 보조 */

/* Gradients */
--gradient-primary: linear-gradient(135deg, #a855f7, #ec4899)
--gradient-bg: linear-gradient(135deg, #faf5ff, #fce7f3, #eff6ff)
```

## 📱 반응형 브레이크포인트

```css
/* Mobile First */
@media (max-width: 375px)  /* 소형 모바일 */
@media (max-width: 480px)  /* 일반 모바일 */
@media (min-width: 481px)  /* 태블릿+ */
```

## 🛠️ 설치 및 실행

### 1. 파일 다운로드
프로젝트 폴더의 모든 파일을 로컬에 저장

### 2. 웹 서버 실행
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server 확장 프로그램 사용
```

### 3. 브라우저에서 확인
`http://localhost:8000` 접속

## 🎭 컴포넌트 가이드

### 버튼 스타일
```css
.btn-primary    /* 메인 액션 (그라데이션) */
.btn-secondary  /* 보조 액션 (흰색) */
.btn-vote       /* 투표 버튼 */
.btn-result     /* 결과 보기 */
```

### 카드 컴포넌트
```css
.poll-card      /* 투표 카드 */
.invite-card    /* 초대 카드 */
.result-card    /* 결과 카드 */
.circle-item    /* Circle 아이템 */
```

### 모달 시스템
```css
.modal          /* 모달 컨테이너 */
.modal-content  /* 모달 내용 */
.modal-header   /* 모달 헤더 */
.modal-handle   /* 드래그 핸들 */
```

## 🎬 애니메이션 가이드

### CSS 애니메이션
```css
@keyframes fadeInUp      /* 페이지 전환 */
@keyframes pulse         /* 로딩 상태 */
@keyframes float         /* 배경 효과 */
@keyframes slideInScale  /* 피드백 */
```

### JavaScript 애니메이션
```javascript
// 탭 전환 애니메이션
switchTab('home')

// 모달 표시/숨김
showModal('pollModal')
closeModal('pollModal')

// 차트 애니메이션
animateChart(pollData)
```

## 🔧 커스터마이징

### 컬러 변경
`styles-complete.css`의 `:root` 섹션에서 CSS 변수 수정:

```css
:root {
    --purple-500: #your-color;
    --pink-500: #your-color;
    --blue-400: #your-color;
}
```

### 텍스트 수정
`script.js`의 mock 데이터 수정:

```javascript
const mockPolls = [
    {
        question: "당신의 질문",
        options: [...]
    }
]
```

### 새로운 컴포넌트 추가
1. HTML 구조 추가
2. CSS 스타일 정의
3. JavaScript 이벤트 연결

## 📚 추가 구현 가능한 기능

### Backend 연동
```javascript
// API 호출 예시
async function createPoll(pollData) {
    const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
    });
    return response.json();
}
```

### PWA 기능
```javascript
// 서비스 워커 등록
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

// 앱 설치 프롬프트
window.addEventListener('beforeinstallprompt', (e) => {
    // 설치 프롬프트 표시
});
```

### 실시간 업데이트
```javascript
// WebSocket 연결
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updatePollResults(data);
};
```

## 🎯 성능 최적화

### CSS 최적화
- 사용하지 않는 스타일 제거
- Critical CSS 인라인화
- 애니메이션 GPU 가속 활용

### JavaScript 최적화
- Debounce/Throttle 적용
- 이벤트 델리게이션 사용
- 메모리 누수 방지

### 이미지 최적화
- WebP 포맷 사용
- Lazy Loading 구현
- 적절한 해상도 제공

## 🐛 알려진 이슈

1. **iOS Safari**: `backdrop-filter` 부분 지원
2. **구형 브라우저**: CSS Grid 미지원
3. **터치 디바이스**: 호버 효과 문제

## 📄 라이선스

이 프로젝트는 교육 및 참고 목적으로 제공됩니다.

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

## 📞 지원

문제나 질문이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ for Z-Generation**

이 README와 함께 제공된 모든 파일들로 Circly와 유사한 디자인의 웹 애플리케이션을 구축할 수 있습니다. 파스텔 톤의 아름다운 디자인과 부드러운 애니메이션이 특징인 모던한 UI를 경험해보세요! ✨