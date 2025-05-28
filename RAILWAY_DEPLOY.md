# 🚀 Railway 배포 가이드

## 사전 준비

### 1. 필수 계정 생성
- [Railway](https://railway.app) 계정 생성
- [MongoDB Atlas](https://www.mongodb.com/atlas) 계정 생성 (무료)
- GitHub 계정 (코드 저장소)

### 2. MongoDB Atlas 설정

#### 2-1. 클러스터 생성
1. MongoDB Atlas 로그인
2. "Create a New Cluster" 클릭
3. 무료 플랜 (M0 Sandbox) 선택
4. 클러스터 이름: `hotstinder`
5. 생성 완료까지 대기 (2-3분)

#### 2-2. 데이터베이스 사용자 생성
1. Database Access → Add New Database User
2. 사용자명/비밀번호 설정 (기록해두기!)
3. Built-in Role: `Read and write to any database`

#### 2-3. 네트워크 접근 허용
1. Network Access → Add IP Address
2. "Allow Access from Anywhere" (0.0.0.0/0) 선택
3. 또는 Railway IP 대역 추가

#### 2-4. 연결 문자열 복사
1. Clusters → Connect → Connect your application
2. Driver: Node.js, Version: 4.1 or later
3. 연결 문자열 복사 (예시):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hotstinder?retryWrites=true&w=majority
   ```

## Railway 배포 단계

### 1단계: GitHub 저장소 준비

```bash
# 현재 프로젝트를 GitHub에 푸시
git add .
git commit -m "Railway 배포 준비"
git push origin main
```

### 2단계: Railway 프로젝트 생성

1. [Railway](https://railway.app) 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. 저장소 선택: `hotstinder`
5. "Deploy Now" 클릭

### 3단계: 환경 변수 설정

Railway 대시보드에서 Variables 탭으로 이동하여 다음 환경 변수들을 설정:

#### 필수 환경 변수
```bash
NODE_ENV=production
PORT=5000
USE_MONGODB=true
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hotstinder?retryWrites=true&w=majority
```

#### 보안 키 생성 및 설정
```bash
# JWT 시크릿 (32자 이상 랜덤 문자열)
JWT_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx

# 세션 시크릿 (32자 이상 랜덤 문자열)  
SESSION_SECRET=wxyz9876vuts5432rqpo1098nmlk6543jihg2109fedc
```

#### 기타 설정
```bash
FRONTEND_URL=https://your-app-name.up.railway.app
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

### 4단계: 배포 확인

1. Railway 대시보드에서 배포 로그 확인
2. 배포 완료 후 생성된 URL 확인
3. 브라우저에서 접속 테스트

### 5단계: 도메인 설정 (선택사항)

#### 커스텀 도메인 연결
1. Railway 대시보드 → Settings → Domains
2. "Custom Domain" 클릭
3. 도메인 입력 (예: hotstinder.com)
4. DNS 설정:
   ```
   Type: CNAME
   Name: @
   Value: your-app-name.up.railway.app
   ```

## 배포 후 설정

### 1. 환경 변수 업데이트

배포된 URL을 확인한 후 다음 환경 변수들을 실제 URL로 업데이트:

```bash
FRONTEND_URL=https://your-actual-domain.up.railway.app
BNET_CALLBACK_URL=https://your-actual-domain.up.railway.app/api/auth/bnet/callback
```

### 2. 클라이언트 환경 변수 설정

`client/.env` 파일 생성:
```bash
REACT_APP_API_URL=https://your-actual-domain.up.railway.app
REACT_APP_SOCKET_URL=https://your-actual-domain.up.railway.app
REACT_APP_ENV=production
```

### 3. 재배포

환경 변수 변경 후 재배포:
```bash
git add .
git commit -m "환경 변수 업데이트"
git push origin main
```

## 문제 해결

### 배포 실패 시
1. Railway 대시보드에서 Build Logs 확인
2. 환경 변수 설정 재확인
3. MongoDB 연결 문자열 확인

### 연결 오류 시
1. MongoDB Atlas 네트워크 접근 설정 확인
2. 데이터베이스 사용자 권한 확인
3. 연결 문자열의 사용자명/비밀번호 확인

### 성능 최적화
1. Railway Pro 플랜 고려 ($5/월)
2. MongoDB Atlas M2/M5 클러스터 업그레이드
3. CDN 설정 (Cloudflare 등)

## 비용 예상

### 무료 플랜
- Railway: 무료 (제한적)
- MongoDB Atlas: 무료 (512MB)
- **총 비용: $0/월**

### 권장 플랜
- Railway Hobby: $5/월
- MongoDB Atlas M2: $9/월
- **총 비용: $14/월**

## 모니터링

### Railway 대시보드
- 배포 상태 모니터링
- 리소스 사용량 확인
- 로그 실시간 확인

### MongoDB Atlas
- 데이터베이스 성능 모니터링
- 연결 상태 확인
- 백업 설정

## 자동 배포 설정

GitHub에 코드를 푸시하면 자동으로 Railway에 배포됩니다:

```bash
git add .
git commit -m "새로운 기능 추가"
git push origin main
# → Railway에서 자동 배포 시작
```

## 백업 전략

1. **코드 백업**: GitHub 저장소
2. **데이터베이스 백업**: MongoDB Atlas 자동 백업
3. **환경 설정 백업**: Railway 환경 변수 문서화

---

배포 과정에서 문제가 발생하면 Railway 대시보드의 로그를 확인하거나 MongoDB Atlas의 연결 상태를 점검해보세요. 