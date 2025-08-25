#!/bin/bash
# 테스트용 투표 5개 생성 스크립트
# Docker 환경에서 실행: bash scripts/create_test_polls.sh

API_BASE_URL="http://localhost:8000/v1"

echo "🚀 테스트 투표 생성 스크립트 시작..."

# 1. 먼저 로그인해서 토큰 얻기 (첫 번째 사용자)
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

echo "✅ 로그인 성공! 토큰 획득"

# 2. Circle 목록 조회
echo "📍 Circle 목록 조회 중..."

CIRCLES_RESPONSE=$(curl -s -X GET \
  "$API_BASE_URL/circles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Circle 응답: $CIRCLES_RESPONSE"

# Circle ID 추출 (첫 번째 Circle 사용)
CIRCLE_ID=$(echo $CIRCLES_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CIRCLE_ID" ]; then
    echo "❌ Circle을 찾을 수 없습니다. Circle을 먼저 생성해주세요."
    echo "Circle 생성 예시:"
    echo 'curl -X POST "$API_BASE_URL/circles" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '"'"'{"name": "테스트 Circle", "description": "테스트용 Circle입니다"}'"'"
    exit 1
fi

echo "✅ Circle ID 발견: $CIRCLE_ID"

# 3. 현재 날짜 + 7일 계산 (마감일)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    DEADLINE=$(date -v+7d -u +"%Y-%m-%dT%H:%M:%S.000Z")
else
    # Linux
    DEADLINE=$(date -d "+7 days" -u +"%Y-%m-%dT%H:%M:%S.000Z")
fi

echo "⏰ 투표 마감일: $DEADLINE"

# 4. 테스트 투표 5개 생성
declare -a POLL_QUESTIONS=(
    "우리 Circle에서 가장 웃긴 사람은? 😂"
    "가장 스타일이 좋은 사람은? 👗"
    "가장 친근한 사람은? 😊"
    "가장 똑똑한 사람은? 🤓"
    "가장 운동을 잘하는 사람은? ⚽"
)

declare -a TEMPLATE_IDS=(
    "funny_person"
    "stylish_person"
    "friendly_person"
    "smart_person"
    "athletic_person"
)

SUCCESS_COUNT=0

for i in "${!POLL_QUESTIONS[@]}"; do
    QUESTION="${POLL_QUESTIONS[$i]}"
    TEMPLATE_ID="${TEMPLATE_IDS[$i]}"
    
    echo ""
    echo "📝 투표 생성 중 ($((i+1))/5): $QUESTION"
    
    POLL_DATA='{
        "question_text": "'$QUESTION'",
        "circle_id": '$CIRCLE_ID',
        "template_id": "'$TEMPLATE_ID'",
        "deadline": "'$DEADLINE'",
        "is_anonymous": true,
        "max_votes_per_user": 1
    }'
    
    POLL_RESPONSE=$(curl -s -X POST \
      "$API_BASE_URL/polls" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$POLL_DATA")
    
    # 응답에서 에러 확인
    if echo "$POLL_RESPONSE" | grep -q '"detail"'; then
        ERROR=$(echo $POLL_RESPONSE | grep -o '"detail":"[^"]*' | cut -d'"' -f4)
        echo "   ❌ 실패: $ERROR"
    elif echo "$POLL_RESPONSE" | grep -q '"id"'; then
        POLL_ID=$(echo $POLL_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "   ✅ 성공! 투표 ID: $POLL_ID"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "   ❌ 알 수 없는 응답: $POLL_RESPONSE"
    fi
    
    # 요청 간격 조절
    sleep 1
done

echo ""
echo "🎉 테스트 투표 생성 완료!"
echo "📊 총 $SUCCESS_COUNT/5개의 투표가 생성되었습니다."
echo "⏰ 모든 투표는 7일 후($DEADLINE)에 마감됩니다."

# 5. 생성된 투표 목록 확인
echo ""
echo "📋 생성된 투표 목록 확인:"
POLLS_LIST=$(curl -s -X GET \
  "$API_BASE_URL/polls?circle_id=$CIRCLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$POLLS_LIST" | grep -o '"question_text":"[^"]*' | cut -d'"' -f4 | while read line; do
    echo "   • $line"
done

echo ""
echo "🏁 스크립트 완료!"
echo ""
echo "📱 이제 앱에서 HomeScreen을 새로고침하면 생성된 투표들을 볼 수 있습니다."
echo "🗑️  투표 삭제가 필요하면 개별적으로 DELETE 요청을 보내주세요."