# Responsive Design Testing Guide

> 다양한 화면 크기에서 Circly 앱의 UI가 올바르게 표시되는지 확인하는 가이드

## 테스트 대상 디바이스

### 우선순위 P0 (필수)

| Device | Width x Height | Scale | Notes |
|--------|----------------|-------|-------|
| **iPhone SE (3rd)** | 375 x 667 | 2x | 가장 작은 화면, 하위 호환성 확인 |
| **iPhone 14 Pro** | 393 x 852 | 3x | 기준 디바이스, 가장 일반적 |
| **iPhone 14 Pro Max** | 430 x 932 | 3x | 큰 화면, 여유 공간 활용 확인 |

### 우선순위 P1 (권장)

| Device | Width x Height | Scale | Notes |
|--------|----------------|-------|-------|
| **iPad Air** | 820 x 1180 | 2x | 태블릿 레이아웃 확인 |
| **iPhone 13 Mini** | 375 x 812 | 3x | 작은 화면 + 노치 |

### 우선순위 P2 (선택)

| Device | Width x Height | Scale | Notes |
|--------|----------------|-------|-------|
| **iPad Pro 12.9"** | 1024 x 1366 | 2x | 최대 화면 크기 |
| **Landscape Mode** | - | - | 가로 모드 지원 (선택적) |

---

## 테스트 실행 방법

### 1. iOS Simulator 사용

```bash
# 프로젝트 루트에서
cd frontend
npx expo start

# 다른 터미널에서 각 디바이스 실행
npx expo start --ios

# Simulator 메뉴에서 디바이스 변경:
# Hardware > Device > iOS [version] > [device name]
```

**주요 디바이스 선택:**
1. iPhone SE (3rd generation)
2. iPhone 14 Pro
3. iPhone 14 Pro Max
4. iPad Air (5th generation)

### 2. Expo Go 앱 사용

실제 디바이스에서 테스트:

1. App Store에서 **Expo Go** 설치
2. `npx expo start` 실행 후 QR 코드 스캔
3. 여러 디바이스에서 동시 테스트 가능

### 3. 코드에서 디바이스 정보 확인

```tsx
import { getDeviceInfo } from '@/utils/responsive';

// 디버그 모드에서 화면에 표시
console.log(getDeviceInfo());
/*
{
  width: 393,
  height: 852,
  size: 'medium',
  isSmall: false,
  isTablet: false,
  isLandscape: false,
  pixelRatio: 3,
  platform: 'ios',
  platformVersion: '17.0'
}
*/
```

---

## 테스트 체크리스트

### ✅ 레이아웃 (Layout)

#### 작은 화면 (iPhone SE - 375pt)

- [ ] **VoteCard 2x2 그리드**
  - [ ] 4개 선택지가 균등하게 배치됨
  - [ ] 각 셀 최소 터치 영역 44x44pt 확보
  - [ ] 텍스트가 잘리지 않음 (ellipsis 적용)
  - [ ] 여백이 충분함 (최소 12pt)

- [ ] **ResultBar**
  - [ ] 프로필 이미지 + 이름 + 퍼센티지가 한 줄에 표시
  - [ ] 진행바가 화면 너비에 맞춰 늘어남
  - [ ] 순위 배지가 겹치지 않음

- [ ] **Button**
  - [ ] Full width 버튼이 좌우 여백 16pt 유지
  - [ ] 버튼 높이 최소 44pt
  - [ ] 텍스트가 버튼 안에서 잘리지 않음

- [ ] **Input**
  - [ ] Label + Input + Helper text 모두 표시
  - [ ] Focus 시 키보드가 입력 필드를 가리지 않음
  - [ ] Error 메시지가 두 줄 이상 되어도 레이아웃 유지

- [ ] **Card**
  - [ ] 패딩이 충분함 (최소 16pt)
  - [ ] 그림자가 잘림 없이 표시됨
  - [ ] 카드 간 간격이 적절함 (16pt)

#### 중간 화면 (iPhone 14 Pro - 393pt)

- [ ] 모든 컴포넌트가 기준 디자인대로 표시됨
- [ ] 여백이 디자인 토큰 값과 일치 (16, 24, 32pt)
- [ ] 타이포그래피 크기가 적절함

#### 큰 화면 (iPhone 14 Pro Max - 430pt)

- [ ] **VoteCard**
  - [ ] 셀 크기가 과도하게 커지지 않음
  - [ ] 중앙 정렬 또는 최대 너비 제한 적용

- [ ] **Button**
  - [ ] Full width 버튼이 너무 넓지 않음 (최대 400pt 고려)
  - [ ] 패딩이 균형있게 늘어남

- [ ] **ResultBar**
  - [ ] 진행바가 자연스럽게 늘어남
  - [ ] 텍스트와 바의 비율이 적절함

#### 태블릿 (iPad Air - 820pt)

- [ ] **레이아웃 변화**
  - [ ] VoteCard가 3x2 또는 2x2 그리드로 표시 (선택)
  - [ ] 콘텐츠 최대 너비 제한 (600-700pt)
  - [ ] 좌우 여백이 충분함 (32-48pt)

- [ ] **Typography**
  - [ ] 본문 텍스트가 너무 크지 않음
  - [ ] 읽기 편한 줄 길이 유지 (50-75자)

- [ ] **터치 영역**
  - [ ] 모든 인터랙티브 요소가 44x44pt 이상
  - [ ] 버튼 간 간격이 충분함 (8pt 이상)

### ✅ Safe Area 처리

- [ ] **노치/Dynamic Island 영역**
  - [ ] 상단 콘텐츠가 노치에 가려지지 않음
  - [ ] SafeAreaView 적용 확인
  - [ ] 상태바 영역 확보

- [ ] **Home Indicator 영역**
  - [ ] 하단 버튼이 Home Indicator와 겹치지 않음
  - [ ] 하단 여백 충분 (최소 20pt + safe area)

- [ ] **Tab Bar 영역**
  - [ ] Tab Bar가 콘텐츠를 가리지 않음
  - [ ] Tab Bar 위 콘텐츠 여백 확보

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ Good
<SafeAreaView style={styles.container}>
  <ScrollView>
    {/* Content */}
  </ScrollView>
</SafeAreaView>

// ❌ Bad - 노치에 가려질 수 있음
<View style={styles.container}>
  <ScrollView>
    {/* Content */}
  </ScrollView>
</View>
```

### ✅ 스크롤 동작

- [ ] **ScrollView**
  - [ ] 콘텐츠가 화면 밖으로 넘어가면 스크롤 가능
  - [ ] 스크롤이 부드러움 (60fps)
  - [ ] Bounce 효과가 자연스러움

- [ ] **KeyboardAvoidingView**
  - [ ] 키보드 표시 시 입력 필드가 보임
  - [ ] 키보드 숨김 시 레이아웃 복구
  - [ ] iOS/Android 플랫폼 별 동작 확인

```tsx
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.container}
>
  <Input placeholder="Type here..." />
</KeyboardAvoidingView>
```

### ✅ 가로 모드 (선택적)

- [ ] **Orientation 변경**
  - [ ] 가로 모드로 전환 시 레이아웃 유지
  - [ ] 세로 모드로 복구 시 정상 표시
  - [ ] 애니메이션 상태 보존

- [ ] **가로 모드 레이아웃**
  - [ ] VoteCard가 가로로 배치되거나 스크롤 가능
  - [ ] 버튼이 화면 하단에 고정
  - [ ] Safe Area (좌우 노치) 고려

**가로 모드 비활성화 (권장):**
```json
// app.json
{
  "expo": {
    "orientation": "portrait"
  }
}
```

### ✅ 폰트 스케일링

iOS 설정에서 큰 텍스트 사용 시:

- [ ] **접근성 설정**
  - [ ] 설정 > 손쉬운 사용 > 디스플레이 및 텍스트 크기 > 더 큰 텍스트
  - [ ] 텍스트 크기를 최대로 설정

- [ ] **텍스트 표시**
  - [ ] 텍스트가 잘리지 않고 줄바꿈됨
  - [ ] 레이아웃이 깨지지 않음
  - [ ] 버튼 높이가 자동 조정됨

```tsx
// 폰트 스케일 제한 (선택)
<Text allowFontScaling={false}>Fixed size text</Text>

// 폰트 스케일 허용 (기본값, 접근성 고려)
<Text>Scalable text</Text>
```

### ✅ 성능

- [ ] **렌더링 성능**
  - [ ] 화면 전환 시 60fps 유지
  - [ ] 애니메이션이 끊기지 않음
  - [ ] 스크롤이 부드러움

- [ ] **메모리 사용**
  - [ ] 큰 화면에서 메모리 급증 없음
  - [ ] 이미지 로딩이 효율적

```bash
# React Native Performance Monitor 활성화
# iOS Simulator: Cmd+D > Show Perf Monitor
# Android Emulator: Cmd+M > Show Perf Monitor
```

---

## 반응형 유틸리티 사용법

### 1. 디바이스 크기별 값 사용

```tsx
import { getResponsiveValue, getDeviceSize } from '@/utils/responsive';

// 디바이스 크기별 다른 값
const fontSize = getResponsiveValue({
  small: 14,
  medium: 16,
  large: 16,
  tablet: 18,
  default: 16,
});

// 디바이스 크기 확인
const deviceSize = getDeviceSize(); // 'small' | 'medium' | 'large' | 'tablet'
```

### 2. 반응형 간격

```tsx
import { getResponsiveSpacing } from '@/utils/responsive';

const padding = getResponsiveSpacing(24);
// iPhone SE: 20pt (24 * 0.85)
// iPhone 14 Pro: 24pt
// iPad: 28pt (24 * 1.2)
```

### 3. 그리드 컬럼 수

```tsx
import { getGridColumns } from '@/utils/responsive';

const columns = getGridColumns();
// iPhone: 2 (2x2 grid)
// iPad: 3 (3x2 grid)
```

### 4. 작은 디바이스 감지

```tsx
import { isSmallDevice, isTablet } from '@/utils/responsive';

if (isSmallDevice()) {
  // 작은 화면용 레이아웃
  return <CompactLayout />;
}

if (isTablet()) {
  // 태블릿용 레이아웃
  return <WideLayout />;
}
```

---

## 테스트 시나리오

### 시나리오 1: 투표 참여 플로우

1. **홈 화면** - 진행 중인 투표 목록
   - [ ] 카드 레이아웃이 화면에 맞게 표시
   - [ ] 스크롤이 부드러움
   - [ ] Safe Area 확보

2. **투표 화면** - VoteCard 2x2 그리드
   - [ ] 4개 선택지가 균등하게 배치
   - [ ] 선택 애니메이션이 부드러움
   - [ ] 버튼이 하단에 고정

3. **결과 화면** - ResultBar 목록
   - [ ] 진행바 애니메이션이 순차적으로 실행
   - [ ] 모든 결과가 스크롤 가능
   - [ ] 공유 버튼 접근 가능

### 시나리오 2: Circle 생성 플로우

1. **Circle 이름 입력**
   - [ ] Input이 키보드에 가려지지 않음
   - [ ] 에러 메시지 표시 공간 확보
   - [ ] 버튼이 키보드 위에 표시

2. **초대 코드 화면**
   - [ ] 큰 텍스트가 화면에 맞게 표시
   - [ ] 복사 버튼이 터치하기 쉬움
   - [ ] Safe Area 고려

### 시나리오 3: 프로필 화면

1. **프로필 정보**
   - [ ] 아바타 + 이름이 중앙 정렬
   - [ ] 통계 정보가 가독성 있게 표시
   - [ ] 로그아웃 버튼이 하단에 고정

2. **설정 목록**
   - [ ] 모든 설정 항목이 44pt 이상
   - [ ] 스위치가 터치하기 쉬움
   - [ ] 구분선이 명확함

---

## 자동화 테스트 (선택)

### Detox E2E 테스트

```typescript
// e2e/responsive.test.ts
describe('Responsive Layout', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      deviceType: 'iPhone SE (3rd generation)',
    });
  });

  it('should display VoteCard correctly on small screen', async () => {
    await element(by.id('vote-card')).tap();
    await expect(element(by.id('option-0'))).toBeVisible();
    await expect(element(by.id('option-3'))).toBeVisible();
  });

  it('should handle keyboard on small screen', async () => {
    await element(by.id('circle-name-input')).tap();
    await element(by.id('circle-name-input')).typeText('My Circle');
    await expect(element(by.id('submit-button'))).toBeVisible();
  });
});
```

### 스냅샷 테스트

```typescript
// __tests__/components/VoteCard.snapshot.test.tsx
import { render } from '@testing-library/react-native';
import { VoteCard } from '@/components/patterns/VoteCard';

describe('VoteCard Snapshots', () => {
  it('matches snapshot on small screen', () => {
    jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
      get: () => ({ width: 375, height: 667 }),
    }));

    const { toJSON } = render(<VoteCard {...props} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
```

---

## 문제 해결

### 문제 1: 작은 화면에서 버튼이 잘림

**원인:** 고정 너비 사용
```tsx
// ❌ Bad
<Button style={{ width: 400 }}>Submit</Button>
```

**해결:**
```tsx
// ✅ Good - 반응형 너비
<Button style={{ width: '100%', maxWidth: 400 }}>Submit</Button>
```

### 문제 2: 태블릿에서 콘텐츠가 너무 넓음

**원인:** 최대 너비 제한 없음

**해결:**
```tsx
import { getContentPadding } from '@/utils/responsive';

<View style={{
  paddingHorizontal: getContentPadding(),
  maxWidth: 600,
  alignSelf: 'center',
}}>
  {/* Content */}
</View>
```

### 문제 3: Safe Area가 적용되지 않음

**원인:** SafeAreaView 누락

**해결:**
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// app/_layout.tsx에서
<SafeAreaProvider>
  <Stack />
</SafeAreaProvider>
```

---

## 체크리스트 요약

### MVP 출시 전 필수 (P0)

- [ ] iPhone SE에서 모든 화면 정상 표시
- [ ] iPhone 14 Pro에서 디자인 의도대로 표시
- [ ] iPhone 14 Pro Max에서 레이아웃 유지
- [ ] Safe Area 처리 완료
- [ ] 키보드 표시 시 입력 필드 보임
- [ ] 모든 버튼이 44x44pt 이상

### 향후 개선 (P1)

- [ ] iPad 레이아웃 최적화
- [ ] 가로 모드 지원 (선택)
- [ ] 큰 텍스트 접근성 개선
- [ ] E2E 테스트 자동화

---

## 참고 자료

- **Apple HIG**: [Human Interface Guidelines - Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- **React Native Docs**: [Dimensions API](https://reactnative.dev/docs/dimensions)
- **Expo Docs**: [Safe Area Context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/)
- **Design Tokens**: `frontend/src/theme/tokens.ts`

---

**테스트 완료 시 todo.md 업데이트:**
```markdown
- [x] **테스트**: 전체 Responsive 테스트 `iPhone SE, iPhone 14 Pro, iPhone 14 Pro Max`
- [x] **커밋**: `test(frontend): verify responsive design across devices`
```
