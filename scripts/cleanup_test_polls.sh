#!/bin/bash
# 테스트 투표 정리 스크립트
# Docker 환경에서 실행: bash scripts/cleanup_test_polls.sh

API_BASE_URL="http://localhost:8000/v1"

echo "🧹 테스트 투표 정리 스크립트 시작..."

# 1. 로그인
echo "🔐 사용자 로그인 중..."

LOGIN_RESPONSE=$(curl -s -X POST \
  "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-001"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 로그인 실패. 응답: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ 로그인 성공!"

# 2. 테스트 투표 질문 패턴들
declare -a TEST_PATTERNS=(
    "가장 웃긴 사람은"
    "스타일이 좋은 사람은"
    "가장 친근한 사람은"
    "가장 똑똑한 사람은"
    "운동을 잘하는 사람은"
)

# 3. Circle 목록에서 투표들 찾아서 삭제
CIRCLES_RESPONSE=$(curl -s -X GET \
  "$API_BASE_URL/circles/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

CIRCLE_ID=$(echo $CIRCLES_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CIRCLE_ID" ]; then
    echo "❌ Circle을 찾을 수 없습니다."
    exit 1
fi

echo "📍 Circle ID: $CIRCLE_ID"

# 4. 투표 목록 조회
POLLS_RESPONSE=$(curl -s -X GET \
  "$API_BASE_URL/polls?circle_id=$CIRCLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "🔍 현재 투표 목록 확인 중..."

# 5. 테스트 투표들 식별 및 삭제 (실제로는 관리자만 삭제 가능하므로 목록만 출력)
DELETED_COUNT=0

for pattern in "${TEST_PATTERNS[@]}"; do
    if echo "$POLLS_RESPONSE" | grep -q "$pattern"; then
        echo "   🎯 발견된 테스트 투표: '$pattern'"
        # 실제 삭제는 백엔드에서 관리자만 가능하므로 여기서는 확인만
        DELETED_COUNT=$((DELETED_COUNT + 1))
    fi
done

if [ $DELETED_COUNT -eq 0 ]; then
    echo "ℹ️  삭제할 테스트 투표가 없습니다."
else
    echo "⚠️  $DELETED_COUNT개의 테스트 투표를 발견했습니다."
    echo "⚠️  현재 백엔드 설정상 사용자는 투표를 직접 삭제할 수 없습니다."
    echo "📝 관리자에게 삭제를 요청하거나, 데이터베이스에서 직접 삭제해주세요."
    
    echo ""
    echo "🗄️  데이터베이스 직접 삭제 방법:"
    echo "docker-compose exec db psql -U circly_user -d circly_db"
    echo "DELETE FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE question_text LIKE '%가장 웃긴%' OR question_text LIKE '%스타일이 좋은%' OR question_text LIKE '%가장 친근한%' OR question_text LIKE '%가장 똑똑한%' OR question_text LIKE '%운동을 잘%');"
    echo "DELETE FROM polls WHERE question_text LIKE '%가장 웃긴%' OR question_text LIKE '%스타일이 좋은%' OR question_text LIKE '%가장 친근한%' OR question_text LIKE '%가장 똑똑한%' OR question_text LIKE '%운동을 잘%';"
fi

echo ""
echo "🏁 정리 스크립트 완료!"