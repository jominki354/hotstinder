# 🐳 HotsTinder Docker 설정 가이드

이 가이드는 HotsTinder 애플리케이션을 Docker를 사용하여 실행하는 방법을 설명합니다.

## 📋 사전 요구사항

### 1. Docker 설치
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- Windows: Docker Desktop for Windows
- macOS: Docker Desktop for Mac
- Linux: Docker Engine + Docker Compose

### 2. 환경 변수 설정
`.env.docker` 파일을 프로젝트 루트에 생성하고 다음 내용을 설정:

```env
# Battle.net OAuth 설정
BNET_CLIENT_ID=your_bnet_client_id
BNET_CLIENT_SECRET=your_bnet_client_secret
BNET_CALLBACK_URL=http://localhost:5000/api/auth/bnet/callback

# JWT 및 세션 시크릿 (프로덕션에서는 반드시 변경)
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key

# 관리자 계정 설정
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@hotstinder.com
```

## 🚀 빠른 시작

### 프로덕션 환경 실행

```bash
# Windows
scripts\docker-setup.bat

# Linux/macOS
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh
```

또는 수동으로:

```bash
# 1. 환경 변수 파일 복사
cp .env.docker .env

# 2. 컨테이너 빌드 및 실행
docker-compose --env-file .env.docker up -d --build

# 3. 상태 확인
docker-compose ps
```

### 개발 환경 실행

```bash
# Linux/macOS
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh

# 또는 수동으로
docker-compose -f docker-compose.dev.yml --env-file .env.docker up -d --build
```

## 📁 Docker 구성

### 파일 구조
```
├── Dockerfile                 # 프로덕션용 멀티스테이지 빌드
├── docker-compose.yml         # 프로덕션 환경 구성
├── docker-compose.dev.yml     # 개발 환경 구성
├── .env.docker               # Docker 환경 변수
├── .dockerignore             # Docker 빌드 제외 파일
├── server/
│   └── Dockerfile.dev        # 서버 개발용 Dockerfile
├── client/
│   └── Dockerfile.dev        # 클라이언트 개발용 Dockerfile
└── scripts/
    ├── postgres-init.sql     # PostgreSQL 초기화 스크립트
    ├── docker-setup.sh       # 프로덕션 설정 스크립트
    ├── docker-setup.bat      # Windows용 설정 스크립트
    └── docker-dev.sh         # 개발 환경 설정 스크립트
```

### 서비스 구성

#### 프로덕션 환경 (`docker-compose.yml`)
- **app**: 통합된 애플리케이션 (클라이언트 + 서버)
- **postgres**: PostgreSQL 데이터베이스

#### 개발 환경 (`docker-compose.dev.yml`)
- **server**: 백엔드 서버 (핫 리로드)
- **client**: 프론트엔드 클라이언트 (핫 리로드)
- **postgres**: PostgreSQL 데이터베이스

## 🔧 주요 명령어

### 컨테이너 관리
```bash
# 컨테이너 시작
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 컨테이너 재시작
docker-compose restart

# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f app
```

### 개발 환경 명령어
```bash
# 개발 환경 시작
docker-compose -f docker-compose.dev.yml up -d

# 개발 환경 중지
docker-compose -f docker-compose.dev.yml down

# 개발 환경 로그 확인
docker-compose -f docker-compose.dev.yml logs -f server
docker-compose -f docker-compose.dev.yml logs -f client
```

### 데이터베이스 관리
```bash
# PostgreSQL 컨테이너 접속
docker exec -it hotstinder-postgres psql -U hotstinder_user -d hotstinder

# PostgreSQL 데이터 백업
docker exec hotstinder-postgres pg_dump -U hotstinder_user hotstinder > backup.sql

# 볼륨 확인
docker volume ls
```

## 🌐 접속 정보

### 프로덕션 환경
- **애플리케이션**: http://localhost:5000
- **API**: http://localhost:5000/api
- **PostgreSQL**: localhost:5432

### 개발 환경
- **클라이언트**: http://localhost:3000
- **서버 API**: http://localhost:5000/api
- **PostgreSQL**: localhost:5432

## 🔍 트러블슈팅

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# 컨테이너 강제 중지
docker-compose down --remove-orphans
```

### 이미지 재빌드
```bash
# 캐시 없이 재빌드
docker-compose build --no-cache

# 모든 이미지 삭제 후 재빌드
docker system prune -a
docker-compose up -d --build
```

### 볼륨 초기화
```bash
# 모든 볼륨 삭제 (데이터 손실 주의!)
docker-compose down -v

# 특정 볼륨만 삭제
docker volume rm hotstinder_postgres_data
```

### 로그 확인
```bash
# 실시간 로그 모니터링
docker-compose logs -f --tail=100

# 특정 시간대 로그
docker-compose logs --since="2024-01-01T00:00:00"

# 에러 로그만 필터링
docker-compose logs | grep -i error
```

## 🔒 보안 고려사항

1. **환경 변수**: `.env.docker` 파일을 Git에 커밋하지 마세요
2. **시크릿 키**: 프로덕션에서는 강력한 JWT_SECRET과 SESSION_SECRET 사용
3. **PostgreSQL**: 프로덕션에서는 인증 설정 강화
4. **네트워크**: 필요한 포트만 외부에 노출

## 📊 모니터링

### 헬스체크
```bash
# 애플리케이션 상태 확인
curl http://localhost:5000/api/health

# PostgreSQL 상태 확인
docker exec hotstinder-postgres pg_isready -U hotstinder_user -d hotstinder
```

### 리소스 사용량
```bash
# 컨테이너 리소스 사용량
docker stats

# 디스크 사용량
docker system df
```

## 🚀 배포

### 프로덕션 배포 준비
1. 환경 변수 설정 확인
2. 도메인 및 SSL 인증서 설정
3. 리버스 프록시 설정 (Nginx 등)
4. 백업 전략 수립

### CI/CD 파이프라인
Docker 이미지를 레지스트리에 푸시하고 자동 배포 설정을 고려하세요.

---

문제가 발생하면 GitHub Issues에 보고해주세요!
