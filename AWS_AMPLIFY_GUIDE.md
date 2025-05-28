# 🚀 AWS Amplify 배포 가이드

## 왜 AWS Amplify인가?

### ✅ **Railway 대비 장점**
- 🎯 **더 안정적인 빌드**: Node.js 프로젝트 특화
- 💰 **무료 플랜**: 월 1000 빌드 분, 5GB 저장공간
- 🔄 **자동 배포**: GitHub 푸시 시 자동 빌드
- 🌐 **글로벌 CDN**: 빠른 로딩 속도
- 📊 **모니터링**: 상세한 빌드 로그와 성능 지표

## 🚀 AWS Amplify 배포 단계

### 1단계: AWS 계정 생성 (5분)
1. [AWS 콘솔](https://aws.amazon.com) 접속
2. "계정 생성" 클릭
3. 이메일, 비밀번호 설정
4. 신용카드 등록 (무료 플랜 사용 시 과금 없음)

### 2단계: MongoDB Atlas 설정 (5분)
1. [MongoDB Atlas](https://www.mongodb.com/atlas) 가입
2. 무료 클러스터 생성 (M0 Sandbox)
3. 데이터베이스 사용자 생성
4. 네트워크 접근 허용 (0.0.0.0/0)
5. 연결 문자열 복사

### 3단계: AWS Amplify 앱 생성 (3분)

#### 3-1. Amplify 콘솔 접속
1. AWS 콘솔에서 "Amplify" 검색
2. "AWS Amplify" 서비스 선택
3. "새 앱 호스팅" 클릭

#### 3-2. GitHub 연결
1. "GitHub" 선택
2. GitHub 계정 연결 승인
3. 저장소 선택: `hotstinder`
4. 브랜치 선택: `main`

#### 3-3. 빌드 설정 확인
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd client && npm ci
    build:
      commands:
        - cd client && npm run build
  artifacts:
    baseDirectory: client/build
    files:
      - '**/*'
  cache:
    paths:
      - client/node_modules/**/*
```

### 4단계: 환경 변수 설정 (5분)

Amplify 콘솔에서 **환경 변수** 탭으로 이동하여 설정:

#### 필수 환경 변수
```bash
NODE_ENV=production
USE_MONGODB=true
MONGODB_URI=mongodb+srv://[사용자명]:[비밀번호]@[클러스터].mongodb.net/hotstinder?retryWrites=true&w=majority
```

#### 보안 키 생성
로컬에서 실행:
```bash
node scripts/generate-secrets.js
```

생성된 키를 Amplify에 설정:
```bash
JWT_SECRET=[생성된_JWT_키]
SESSION_SECRET=[생성된_세션_키]
```

#### 기타 설정
```bash
FRONTEND_URL=https://[앱ID].amplifyapp.com
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

### 5단계: 배포 시작 (자동)
1. "저장 및 배포" 클릭
2. 빌드 진행 상황 실시간 확인
3. 배포 완료 후 URL 확인

## 🎯 Amplify vs Railway 비교

| 항목 | AWS Amplify | Railway |
|------|-------------|---------|
| **설정 난이도** | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ |
| **빌드 안정성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ |
| **무료 플랜** | 1000 빌드분/월 | 500시간/월 |
| **글로벌 CDN** | ✅ 포함 | ❌ 별도 설정 |
| **모니터링** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ |
| **커스텀 도메인** | ✅ 무료 | ✅ 무료 |

## 🔧 문제 해결

### 빌드 실패 시
1. Amplify 콘솔에서 빌드 로그 확인
2. `amplify.yml` 설정 검토
3. 환경 변수 설정 재확인

### 환경 변수 오류 시
1. MongoDB 연결 문자열 재확인
2. 보안 키 재생성
3. 특수문자 이스케이프 처리

## 💰 비용 예상

### 무료 플랜 (12개월)
- **빌드**: 1000분/월
- **호스팅**: 5GB 저장공간
- **데이터 전송**: 15GB/월
- **MongoDB Atlas**: 512MB 무료
- **총 비용**: $0/월

### 유료 플랜 (필요 시)
- **빌드**: $0.01/분 (초과 시)
- **호스팅**: $0.15/GB/월
- **데이터 전송**: $0.15/GB
- **예상 비용**: $5-10/월

## 🚀 배포 후 확인사항

### 1. 애플리케이션 테스트
- 메인 페이지 로딩 확인
- API 엔드포인트 응답 확인
- 데이터베이스 연결 확인

### 2. 성능 최적화
- CloudFront CDN 자동 적용
- 이미지 최적화 설정
- 캐싱 정책 확인

### 3. 모니터링 설정
- CloudWatch 로그 확인
- 성능 지표 모니터링
- 알림 설정

## 🎉 Amplify 장점 요약

1. **🔧 간단한 설정**: 클릭 몇 번으로 배포 완료
2. **🚀 빠른 성능**: 글로벌 CDN으로 빠른 로딩
3. **💰 저렴한 비용**: 무료 플랜으로 시작 가능
4. **📊 풍부한 기능**: 모니터링, 로그, 알림 등
5. **🔄 자동 배포**: GitHub 푸시 시 자동 빌드

---

Railway에서 계속 문제가 발생한다면 AWS Amplify가 더 안정적인 선택입니다! 🚀 