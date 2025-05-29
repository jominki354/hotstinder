#!/bin/bash

# 개발 환경 도커 설정 스크립트

echo "🐳 HotsTinder 개발 환경을 시작합니다..."

# 환경 변수 파일 확인
if [ ! -f ".env.docker" ]; then
    echo "❌ .env.docker 파일이 없습니다. 먼저 환경 변수를 설정해주세요."
    exit 1
fi

# 기존 개발 컨테이너 정리
echo "🧹 기존 개발 컨테이너를 정리합니다..."
docker-compose -f docker-compose.dev.yml down --remove-orphans

# 개발 이미지 빌드
echo "🔨 개발용 도커 이미지를 빌드합니다..."
docker-compose -f docker-compose.dev.yml build

# 개발 컨테이너 시작
echo "🚀 개발 컨테이너를 시작합니다..."
docker-compose -f docker-compose.dev.yml --env-file .env.docker up -d

# 상태 확인
echo "📊 컨테이너 상태를 확인합니다..."
docker-compose -f docker-compose.dev.yml ps

echo "✅ 개발 환경이 준비되었습니다!"
echo "🌐 클라이언트: http://localhost:3000"
echo "🔧 서버 API: http://localhost:5000"
echo "📊 MongoDB: localhost:27017"
echo ""
echo "로그 확인:"
echo "  전체: docker-compose -f docker-compose.dev.yml logs -f"
echo "  서버: docker-compose -f docker-compose.dev.yml logs -f server"
echo "  클라이언트: docker-compose -f docker-compose.dev.yml logs -f client"
echo ""
echo "컨테이너 중지: docker-compose -f docker-compose.dev.yml down"
