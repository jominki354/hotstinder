version: 1
backend:
  phases:
    build:
      commands:
        - echo "서버 의존성 설치 중..."
        - cd server && npm ci --only=production
        - echo "서버 빌드 완료"
frontend:
  phases:
    preBuild:
      commands:
        - echo "클라이언트 의존성 설치 중..."
        - cd client && npm ci
        - echo "클라이언트 의존성 설치 완료"
    build:
      commands:
        - echo "클라이언트 빌드 시작..."
        - cd client && npm run build
        - echo "클라이언트 빌드 완료"
  artifacts:
    baseDirectory: client/build
    files:
      - '**/*'
  cache:
    paths:
      - client/node_modules/**/*
      - server/node_modules/**/* 