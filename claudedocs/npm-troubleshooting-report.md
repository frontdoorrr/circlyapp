# NPM 패키지 문제 해결 보고서

**날짜**: 2025-12-21
**담당**: Claude Code Troubleshooting Agent
**심각도**: 🔴 CRITICAL (빌드 완전 차단)

---

## 📋 문제 요약

**증상**: iOS 번들링이 `babel-preset-expo` 모듈을 찾지 못해 반복적으로 실패

**영향 범위**:
- 전체 프론트엔드 빌드 프로세스 차단
- 개발 서버 구동 불가
- iOS/Android 앱 실행 불가

---

## 🔍 근본 원인 분석

### 1차 에러: `react-native-worklets/plugin` 누락
```
ERROR: Cannot find module 'react-native-worklets/plugin'
```

**원인**: React Native Reanimated 4.x의 peer dependency 누락
- Reanimated v4부터 `react-native-worklets-core`가 분리됨
- `package.json`에 명시되지 않아 자동 설치 안 됨

**해결**: `npm install react-native-worklets-core`로 임시 해결 성공

### 2차 에러 (재발): `babel-preset-expo` 누락
```
ERROR: Cannot find module 'babel-preset-expo'
```

**핵심 근본 원인**: **Nested Package Resolution 문제**

#### 문제 메커니즘:
1. **물리적 위치**: `babel-preset-expo`가 `node_modules/expo/node_modules/` 안에 설치됨
2. **Babel 탐색 경로**: Babel이 최상위 `node_modules/`에서만 preset 검색
3. **호이스팅 실패**: npm이 peer dependency 충돌로 인해 호이스팅하지 못함

#### Peer Dependency 충돌 상세:
```
react@19.1.0 (현재 설치)
  vs
react@19.2.3 (react-dom이 요구)
```

- `react-dom@19.2.3`이 정확히 `react@^19.2.3`을 요구
- `package.json`에는 `react@19.1.0`이 고정됨
- npm v7+의 엄격한 peer dependency 검증으로 충돌 감지
- 충돌 회피를 위해 중첩 설치(nested installation) 선택
- 결과: Babel이 preset을 찾지 못함

---

## ✅ 적용된 해결책

### Solution: Legacy Peer Dependency Mode 활성화

**방법**: `.npmrc` 파일 생성
```ini
legacy-peer-deps=true
```

**효과**:
- npm이 peer dependency 충돌을 경고로 처리 (에러로 취급하지 않음)
- 패키지를 최상위 `node_modules/`로 호이스팅
- Babel이 `babel-preset-expo`를 정상적으로 발견

**검증 결과**:
```bash
✅ node_modules/babel-preset-expo/ 존재 확인
✅ expo start --clear 정상 실행
✅ Metro Bundler 구동 성공
```

---

## 🛡️ 장기 권장사항

### 1. React 버전 정렬 (권장도: 🟡 중)
**현재 상태**:
```json
"react": "19.1.0"
"react-dom": "19.2.3"  // 자동 설치됨
```

**권장 조치**:
```json
"react": "19.2.3",
"react-dom": "19.2.3"
```

**이유**:
- Expo Router가 react-dom을 peerOptional로 요구
- 버전 정렬로 peer dependency 충돌 원천 제거
- `.npmrc` 없이도 정상 작동 가능

### 2. Expo SDK 54 안정성 확인 (권장도: 🟢 낮음)
- Expo SDK 54는 2025년 초 릴리스로 매우 최신
- React 19.2.x 완벽 지원 여부 검증 필요
- 필요시 Expo SDK 53으로 다운그레이드 고려

### 3. 의존성 정기 감사 (권장도: 🟡 중)
```bash
npm audit
npm outdated
```

**주기**: 월 1회 권장

---

## 📊 문제 발생 패턴

### 재발 조건:
1. `node_modules` 삭제 후 재설치
2. 다른 개발자의 신규 클론
3. CI/CD 파이프라인 빌드

### 예방 조치:
- ✅ `.npmrc` 파일을 Git에 커밋 (완료)
- ✅ `package.json`의 React 버전 정렬 (권장)
- ✅ README에 설치 가이드 추가 (필요시)

---

## 🔧 Troubleshooting Playbook

### 증상: Babel preset 에러 발생 시

**1단계 진단**:
```bash
ls node_modules/babel-preset-expo/
# 존재하지 않으면 → 호이스팅 실패
```

**2단계 검증**:
```bash
npm ls babel-preset-expo
# 경로가 expo/node_modules 안이면 → 중첩 설치 확인
```

**3단계 해결**:
```bash
# .npmrc 파일 확인
cat .npmrc

# 없으면 생성
echo "legacy-peer-deps=true" > .npmrc

# 재설치
rm -rf node_modules package-lock.json
npm install
```

**4단계 검증**:
```bash
npx expo start --clear
# Metro Bundler 정상 구동 확인
```

---

## 📝 학습 포인트

### npm v7+ Peer Dependency 동작 이해

**Before npm v7**:
- peer dependency 경고만 출력
- 자동으로 최상위에 설치

**After npm v7**:
- peer dependency 엄격히 검증
- 충돌 시 중첩 설치로 격리
- `--legacy-peer-deps`로 이전 방식 사용 가능

### Babel Module Resolution 이해

**탐색 순서**:
1. `node_modules/babel-preset-expo`
2. `../node_modules/babel-preset-expo`
3. `../../node_modules/babel-preset-expo`

**중첩 설치 시 문제**:
- `babel.config.js`가 프로젝트 루트에 위치
- 탐색 시작점이 `frontend/`
- `frontend/node_modules/expo/node_modules/`는 탐색 경로에 없음

---

## ✅ 해결 상태

| 체크리스트 | 상태 |
|-----------|------|
| `.npmrc` 파일 생성 | ✅ |
| 의존성 재설치 | ✅ |
| `babel-preset-expo` 호이스팅 확인 | ✅ |
| `react-native-worklets` 설치 | ✅ |
| `react-native-worklets-core` 설치 | ✅ |
| `package.json` 업데이트 | ✅ |
| 문서화 완료 | ✅ |

**최종 상태**: 🟢 **해결 완료**

**재발 방지**: `.npmrc` + `package.json` 의존성 명시

---

## 🔄 추가 해결 사항 (2025-12-21 업데이트)

### 문제 재발: `react-native-worklets/plugin` 누락

**원인**:
- `react-native-reanimated@4.1.x`가 두 개의 worklets 패키지를 필요로 함:
  1. `react-native-worklets-core` (런타임)
  2. `react-native-worklets` (Babel plugin 포함)
- `.npmrc` 생성 후 `node_modules` 재설치 시 `react-native-worklets`가 자동 설치 안 됨

**해결책**:
```bash
npm install react-native-worklets
```

**최종 패키지 구성**:
```json
{
  "dependencies": {
    "react-native-reanimated": "~4.1.1",
    "react-native-worklets": "^0.7.1",
    "react-native-worklets-core": "^1.6.2"
  }
}
```

**검증**:
```bash
npm ls react-native-worklets
# ✅ 최상위 + reanimated 의존성 모두 확인
```

---

## 🚀 다음 단계

1. **즉시 조치 (완료)**:
   - [x] `.npmrc` 파일 Git 커밋
   - [x] 팀원들에게 공지

2. **단기 조치 (1주 이내)**:
   - [ ] `react` 버전을 19.2.3으로 업그레이드
   - [ ] `package.json` 업데이트 및 테스트

3. **장기 조치 (1개월 이내)**:
   - [ ] Expo SDK 업그레이드 경로 검토
   - [ ] 의존성 관리 정책 수립

---

**작성자**: Claude Code Troubleshooting Agent
**검토**: 필요시 시니어 개발자 리뷰 권장
