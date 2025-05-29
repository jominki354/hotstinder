#!/bin/bash

# 도커 환경 설정 스크립트

echo "🐳 HotsTinder 도커 환경 설정을 시작합니다..."

# 환경 변수 파일 확인
if [ ! -f ".env.docker" ]; then
    echo "❌ .env.docker 파일이 없습니다. 먼저 환경 변수를 설정해주세요."
    exit 1
fi

# 도커 및 도커 컴포즈 설치 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다. Docker를 먼저 설치해주세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되지 않았습니다. Docker Compose를 먼저 설치해주세요."
    exit 1
fi

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너를 정리합니다..."
docker-compose down --remove-orphans

# 이미지 빌드
echo "🔨 도커 이미지를 빌드합니다..."
docker-compose build --no-cache

# 컨테이너 시작
echo "🚀 컨테이너를 시작합니다..."
docker-compose --env-file .env.docker up -d

# 상태 확인
echo "📊 컨테이너 상태를 확인합니다..."
docker-compose ps

echo "✅ 도커 환경 설정이 완료되었습니다!"
echo "🌐 애플리케이션: http://localhost:5000"
echo "📊 MongoDB: localhost:27017"
echo ""
echo "로그 확인: docker-compose logs -f"
echo "컨테이너 중지: docker-compose down"
