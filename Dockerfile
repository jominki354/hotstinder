# 멀티스테이지 빌드를 위한 Dockerfile
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 루트 package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 클라이언트 빌드 스테이지
FROM node:18-alpine AS client-build

WORKDIR /app

# 클라이언트 소스 복사
COPY client/package*.json ./client/
COPY client/ ./client/

# 클라이언트 의존성 설치 및 빌드
WORKDIR /app/client
RUN npm ci
RUN npm run build

# 서버 빌드 스테이지
FROM node:18-alpine AS server-build

WORKDIR /app

# 서버 소스 복사
COPY server/package*.json ./server/
COPY server/ ./server/

# 서버 의존성 설치
WORKDIR /app/server
RUN npm ci --only=production

# 최종 프로덕션 스테이지
FROM node:18-alpine AS production

WORKDIR /app

# 서버 파일 복사
COPY --from=server-build /app/server ./server

# 클라이언트 빌드 결과 복사
COPY --from=client-build /app/client/build ./client/build

# 서버 디렉토리로 이동
WORKDIR /app/server

# 포트 노출
EXPOSE 5000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 서버 시작
CMD ["npm", "start"] 