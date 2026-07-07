#!/bin/bash
# 현재 IP 주소로 .env의 API URL을 자동 업데이트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
PORT=${1:-8002}

# 현재 IP 주소 가져오기
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP" ]; then
    echo "❌ IP 주소를 가져올 수 없습니다"
    exit 1
fi

NEW_URL="http://${IP}:${PORT}/api/v1"

# .env 파일 업데이트
if [ -f "$ENV_FILE" ]; then
    # macOS와 Linux 호환 sed 명령어
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${NEW_URL}|" "$ENV_FILE"
    else
        sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${NEW_URL}|" "$ENV_FILE"
    fi
    echo "✅ API URL 업데이트: ${NEW_URL}"
else
    echo "❌ .env 파일을 찾을 수 없습니다: $ENV_FILE"
    exit 1
fi
