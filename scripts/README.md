# 테스트 스크립트 📝

사용자 테스트를 위한 투표 데이터 생성 및 관리 스크립트입니다.

## 사전 요구사항 ✅

1. Docker 환경이 실행 중이어야 합니다:
   ```bash
   docker-compose up -d
   ```

2. Circle이 최소 1개 이상 생성되어 있어야 합니다.
   - 앱에서 Circle 생성하거나
   - API로 직접 생성: 
     ```bash
     curl -X POST "http://localhost:8000/v1/circles" \
       -H "Authorization: Bearer YOUR_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"name": "테스트 Circle", "description": "테스트용"}'
     ```

## 사용법 🚀

### 테스트 투표 5개 생성
```bash
bash scripts/create_test_polls.sh
```

**생성되는 투표들:**
- 우리 Circle에서 가장 웃긴 사람은? 😂
- 가장 스타일이 좋은 사람은? 👗  
- 가장 친근한 사람은? 😊
- 가장 똑똑한 사람은? 🤓
- 가장 운동을 잘하는 사람은? ⚽

**특징:**
- 마감일: 실행일로부터 7일 후
- 익명 투표로 설정
- 사용자당 1표만 가능
- Circle의 멤버들이 선택지로 자동 추가

### 테스트 투표 정리 (확인용)
```bash
bash scripts/cleanup_test_polls.sh
```

## 실행 예시 💻

```bash
# 프로젝트 루트에서 실행
cd /Users/jeongmun/Documents/GitHub/circlyapp

# 투표 생성
bash scripts/create_test_polls.sh

# 결과 확인
# 앱에서 HomeScreen을 새로고침하여 생성된 투표들 확인

# 정리 (필요시)
bash scripts/cleanup_test_polls.sh
```

## 트러블슈팅 🔧

### "Circle을 찾을 수 없습니다" 오류
- Circle이 생성되어 있는지 확인
- 사용자가 해당 Circle의 멤버인지 확인

### "로그인 실패" 오류  
- 백엔드 서비스가 실행 중인지 확인 (`docker-compose ps`)
- API URL이 올바른지 확인 (기본: `http://localhost:8000`)

### 투표 생성 실패
- Circle에 멤버가 충분한지 확인 (최소 2명)
- 백엔드 로그 확인: `docker-compose logs backend`

## 수동 삭제 방법 🗑️

현재 백엔드 설정상 일반 사용자는 투표를 삭제할 수 없으므로, 필요시 데이터베이스에서 직접 삭제:

```sql
-- 데이터베이스 접속
docker-compose exec db psql -U circly_user -d circly_db

-- 테스트 투표 삭제
DELETE FROM poll_options WHERE poll_id IN (
  SELECT id FROM polls 
  WHERE question_text LIKE '%가장 웃긴%' 
     OR question_text LIKE '%스타일이 좋은%' 
     OR question_text LIKE '%가장 친근한%'
     OR question_text LIKE '%가장 똑똑한%'
     OR question_text LIKE '%운동을 잘%'
);

DELETE FROM polls 
WHERE question_text LIKE '%가장 웃긴%' 
   OR question_text LIKE '%스타일이 좋은%' 
   OR question_text LIKE '%가장 친근한%'
   OR question_text LIKE '%가장 똑똑한%'
   OR question_text LIKE '%운동을 잘%';
```