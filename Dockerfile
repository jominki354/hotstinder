# 멀티스테이지 빌드를 사용하여 클라이언트와 서버를 모두 포함하는 이미지 생성

# Stage 1: 클라이언트 빌드
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# 클라이언트 의존성 설치
COPY client/package*.json ./
RUN npm ci --only=production

# 클라이언트 소스 복사
COPY client/ ./

# 환경 변수 설정
ENV REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_ENV=development
ENV REACT_APP_SOCKET_URL=http://localhost:5000

# 클라이언트 빌드
RUN npm run build

# Stage 2: 서버 빌드
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# 서버 의존성 설치
COPY server/package*.json ./
RUN npm ci --only=production

# 서버 소스 복사
COPY server/ ./

# Stage 3: 최종 이미지
FROM node:18-alpine

# 필요한 패키지 설치
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 서버 파일 복사
COPY --from=server-builder --chown=nodejs:nodejs /app/server ./server

# 클라이언트 빌드 결과물 복사
COPY --from=client-builder --chown=nodejs:nodejs /app/client/build ./client/build

# 서버에서 클라이언트 정적 파일 서빙을 위한 설정
RUN mkdir -p /app/server/public && \
    cp -r /app/client/build/* /app/server/public/

# 필요한 디렉토리 생성
RUN mkdir -p /app/server/data /app/server/uploads /app/server/logs && \
    chown -R nodejs:nodejs /app

# 사용자 변경
USER nodejs

# 포트 노출
EXPOSE 5000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 서버 시작
WORKDIR /app/server
CMD ["dumb-init", "node", "src/index.js"]
