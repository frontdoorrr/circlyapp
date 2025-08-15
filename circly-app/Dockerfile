FROM node:23-alpine

WORKDIR /app

# Expo CLI 설치
RUN npm install -g @expo/cli

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --legacy-peer-deps

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 19006 8081

# 애플리케이션 실행
CMD ["npx", "expo", "start", "--web"]