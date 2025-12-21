# Responsive Testing Checklist

> `/app/(dev)/responsive-test.tsx` 화면을 사용한 실제 테스트 체크리스트

## 테스트 실행

```bash
cd frontend
npx expo start

# iOS Simulator에서 다음 디바이스로 테스트:
# 1. iPhone SE (3rd generation) - 375x667
# 2. iPhone 14 Pro - 393x852
# 3. iPhone 14 Pro Max - 430x932
```

앱 실행 후 **Responsive Test** 화면으로 이동

---

## 📱 iPhone SE (375pt) - 작은 화면

### Device Info
- [ ] 화면 크기: 375 x 667
- [ ] Size: small
- [ ] "⚠️ Small Device" 표시됨

### Typography
- [ ] 모든 텍스트가 읽기 편함
- [ ] 텍스트가 잘리지 않음
- [ ] 줄 간격이 적절함

### Buttons
- [ ] Small/Medium/Large 버튼 크기 차이 명확
- [ ] 모든 버튼 최소 44pt 높이 확보
- [ ] Full Width 버튼이 좌우 여백 16pt 유지
- [ ] 버튼 텍스트가 잘리지 않음
- [ ] Press 애니메이션 부드러움

### Input Fields
- [ ] Label + Input + Helper text 모두 표시
- [ ] 에러 메시지가 두 줄로 표시되어도 레이아웃 유지
- [ ] Focus 시 테두리 애니메이션 작동
- [ ] 최대 글자 수 표시 (30/30)

### Vote Card
- [ ] **CRITICAL**: 2x2 그리드가 화면에 맞게 표시
- [ ] 각 셀이 너무 작지 않음 (최소 150pt 너비)
- [ ] 프로필 이미지(80pt)가 적절한 크기
- [ ] 이름이 두 줄로 표시되어도 레이아웃 유지
- [ ] 선택 시 체크마크 배지 표시
- [ ] 셀 간 간격 충분 (12pt)
- [ ] 터치 영역이 충분함

### Result Bars
- [ ] 순위 배지 + 이름 + 퍼센티지 한 줄에 표시
- [ ] 진행바가 화면 너비에 맞춰 늘어남
- [ ] 1위 그라디언트 배경 표시
- [ ] 애니메이션이 순차적으로 실행 (100ms 간격)

### Progress Indicators
- [ ] Standard Progress Bar 정상 표시
- [ ] Compact Progress Bar 정상 표시
- [ ] Dot Progress 정상 표시 (점 크기 적절)

### Empty State
- [ ] 아이콘 + 메시지 + 버튼 모두 표시
- [ ] 버튼이 터치하기 쉬움
- [ ] 텍스트 정렬이 자연스러움

### Loading States
- [ ] Spinner 크기 차이 명확 (sm/md/lg/xl)
- [ ] Skeleton 로딩 애니메이션 부드러움
- [ ] Skeleton 요소들이 화면에 맞게 배치

### Safe Area
- [ ] **CRITICAL**: 상단 콘텐츠가 노치에 가려지지 않음
- [ ] **CRITICAL**: 하단 콘텐츠가 Home Indicator에 가려지지 않음
- [ ] 스크롤 시 모든 콘텐츠 접근 가능
- [ ] Safe Area 시각화 카드가 정상 표시

---

## 📱 iPhone 14 Pro (393pt) - 기준 화면

### Device Info
- [ ] 화면 크기: 393 x 852
- [ ] Size: medium
- [ ] Dynamic Island 고려됨

### 전체 레이아웃
- [ ] 모든 컴포넌트가 디자인 의도대로 표시
- [ ] 여백이 디자인 토큰과 일치 (16, 24, 32pt)
- [ ] 섹션 간 간격 충분 (40pt)

### Typography
- [ ] 모든 variant 크기 적절
- [ ] 4xl (36pt) 헤더가 임팩트 있음
- [ ] base (16pt) 본문 읽기 편함
- [ ] xs (12pt) 캡션도 읽을 수 있음

### Vote Card
- [ ] 2x2 그리드 레이아웃 완벽
- [ ] 각 셀 크기 균등
- [ ] 애니메이션이 60fps로 부드러움
- [ ] 스태거 애니메이션 순차 실행

### Result Bars
- [ ] 진행바 애니메이션 spring physics 적용
- [ ] 그라디언트 색상 부드러움
- [ ] 텍스트와 바의 비율 균형있음

### Buttons & Inputs
- [ ] 모든 인터랙션이 반응적
- [ ] Haptic feedback 작동 (진동)
- [ ] 애니메이션 딜레이 없음

---

## 📱 iPhone 14 Pro Max (430pt) - 큰 화면

### Device Info
- [ ] 화면 크기: 430 x 932
- [ ] Size: large
- [ ] 추가 공간 활용됨

### 전체 레이아웃
- [ ] 콘텐츠가 과도하게 크지 않음
- [ ] 최대 너비 제한 적용 (선택)
- [ ] 좌우 여백이 충분함

### Vote Card
- [ ] 셀 크기가 자연스럽게 늘어남
- [ ] 프로필 이미지가 너무 크지 않음
- [ ] 중앙 정렬 또는 적절한 패딩 적용

### Result Bars
- [ ] 진행바가 과도하게 길지 않음
- [ ] 텍스트와 바의 비율 유지

### Buttons
- [ ] Full Width 버튼이 너무 넓지 않음
- [ ] 패딩이 균형있게 늘어남
- [ ] 버튼 높이 일관성 유지

### Typography
- [ ] 텍스트가 과도하게 크지 않음
- [ ] 줄 길이가 읽기 편함 (50-75자)

---

## 🛡️ Safe Area 상세 검증

### 상단 (Status Bar / Notch / Dynamic Island)
- [ ] **iPhone 14 Pro**: Dynamic Island 아래 여백 확보
- [ ] **iPhone SE**: Status Bar 아래 여백 확보
- [ ] Device Info 섹션이 가려지지 않음
- [ ] SafeAreaView edges={['top']} 작동 확인

### 하단 (Home Indicator)
- [ ] Bottom Spacer가 Home Indicator 위에 표시
- [ ] 마지막 콘텐츠까지 스크롤 가능
- [ ] SafeAreaView edges={['bottom']} 작동 확인
- [ ] 하단 여백 충분 (Safe Area + 24pt)

### 스크롤 동작
- [ ] 전체 콘텐츠가 스크롤 가능
- [ ] Bounce 효과 자연스러움
- [ ] 스크롤 인디케이터 표시
- [ ] 스크롤 성능 60fps 유지

---

## ⌨️ 키보드 처리 (선택)

**테스트 방법:**
1. Input 필드 탭
2. 키보드 표시됨
3. 입력 필드가 키보드에 가려지는지 확인

### 검증 항목
- [ ] Input 필드가 키보드 위로 올라감
- [ ] 키보드 숨김 시 원래 위치로 복구
- [ ] ScrollView가 자동으로 스크롤됨
- [ ] Done 버튼으로 키보드 닫기 가능

**참고:** KeyboardAvoidingView는 각 화면에서 개별 구현 필요

---

## 🔄 가로 모드 (선택적)

**테스트 방법:**
1. Simulator > Device > Rotate Left (Cmd+←)
2. 레이아웃 변화 확인
3. Rotate Right로 복구 (Cmd+→)

### 검증 항목
- [ ] 가로 모드에서 레이아웃 유지 또는 적절히 조정
- [ ] 세로 모드로 복구 시 정상 표시
- [ ] 애니메이션 상태 보존

**권장 설정:** `app.json`에서 `"orientation": "portrait"`로 가로 모드 비활성화

---

## 🎯 성능 검증

### React Native Performance Monitor 활성화
```
iOS Simulator: Cmd+D > Show Perf Monitor
```

### 검증 항목
- [ ] **JS FPS**: 60fps 유지 (목표: 55fps 이상)
- [ ] **UI FPS**: 60fps 유지 (목표: 58fps 이상)
- [ ] 애니메이션 중 FPS 드롭 없음
- [ ] 스크롤 중 FPS 안정적
- [ ] 메모리 사용량 안정적 (급증 없음)

---

## ✅ 최종 체크리스트

### P0 - MVP 출시 전 필수
- [ ] iPhone SE에서 모든 섹션 정상 표시
- [ ] iPhone 14 Pro에서 디자인 의도대로 표시
- [ ] iPhone 14 Pro Max에서 레이아웃 유지
- [ ] Safe Area 처리 완료 (상단/하단)
- [ ] 모든 버튼 최소 44pt 터치 영역 확보
- [ ] 텍스트 잘림 없음
- [ ] 애니메이션 60fps 유지

### P1 - 향후 개선
- [ ] iPad에서 테스트 (선택)
- [ ] 가로 모드 지원 검토 (선택)
- [ ] 큰 텍스트 접근성 테스트 (선택)
- [ ] E2E 자동화 테스트 (선택)

---

## 🐛 발견된 문제 기록

| 디바이스 | 문제 | 우선순위 | 해결 방법 |
|---------|------|---------|----------|
| | | | |
| | | | |
| | | | |

---

## ✅ 테스트 완료 후

```bash
# todo.md 업데이트
- [x] 다양한 화면 크기 테스트 (iPhone SE, iPhone 14 Pro, iPhone 14 Pro Max)
- [x] Safe Area 처리 확인
- [x] 가로 모드 지원 (선택적) - 비활성화로 결정

# 커밋
git add frontend/src/utils/responsive.ts
git add frontend/docs/RESPONSIVE_TESTING.md
git add frontend/docs/RESPONSIVE_TEST_CHECKLIST.md
git add frontend/app/(dev)/responsive-test.tsx
git commit -m "test(frontend): add responsive design utilities and test screen"
```

**다음 단계:** Phase 11.9 Dark Mode Implementation
