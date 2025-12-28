# Worklets 에러 해결 가이드

## 🚨 에러 증상

```
[WorkletsError: Mismatch between JavaScript part and native part of Worklets (0.7.1 vs 0.5.1)]
```

## 🔍 원인

- `react-native-worklets`의 JavaScript 버전과 네이티브 버전이 일치하지 않음
- 네이티브 빌드가 최신 JavaScript 의존성과 동기화되지 않음

## ✅ 해결 완료

### 1. Node Modules 재설치
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. 네이티브 코드 클린 빌드
```bash
npx expo prebuild --clean
```

이 명령어는:
- 기존 `ios/`, `android/` 폴더 삭제
- 네이티브 코드 재생성
- CocoaPods 재설치 (iOS)

## 🚀 앱 실행

이제 앱을 정상적으로 실행할 수 있습니다:

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android

# 개발 서버만
npx expo start
```

## 🔧 향후 예방 방법

1. **의존성 변경 후**: 항상 `npx expo prebuild --clean` 실행
2. **네이티브 모듈 추가 후**: prebuild 필수
3. **Expo SDK 업그레이드 후**: 전체 클린 빌드 권장

## 📝 참고

- Expo SDK: ~54.0.30
- React Native: 0.81.5
- React Native Reanimated: ~4.1.1
- React Native Worklets: ^0.7.1
