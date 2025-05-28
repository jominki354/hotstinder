.

## Vercel 배포 환경변수 설정

### 클라이언트 환경변수 (Vercel Dashboard에서 설정)
```
REACT_APP_API_URL=https://hotstinder.vercel.app
```

### 서버 환경변수 (Vercel Dashboard에서 설정)
```
NODE_ENV=production
BNET_CLIENT_ID=your_bnet_client_id
BNET_CLIENT_SECRET=your_bnet_client_secret
BNET_CALLBACK_URL=https://hotstinder.vercel.app/api/auth/bnet/callback
BNET_REGION=kr
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://hotstinder.vercel.app
MONGODB_URI=your_mongodb_connection_string
```

### Battle.net 애플리케이션 설정
Battle.net Developer Portal에서 다음 설정을 업데이트해야 합니다:
- **Redirect URIs**: `https://hotstinder.vercel.app/api/auth/bnet/callback` 추가
- **Web Origins**: `https://hotstinder.vercel.app` 추가
