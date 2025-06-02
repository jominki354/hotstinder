# HotsTinder 개발 가이드라인

## 🎯 목적
이 문서는 HotsTinder 프로젝트에서 일관된 코드 작성과 일반적인 실수 방지를 위한 가이드라인을 제공합니다.

## 📋 목차
1. [데이터베이스 모델 사용법](#데이터베이스-모델-사용법)
2. [일반적인 실수와 해결책](#일반적인-실수와-해결책)
3. [코딩 컨벤션](#코딩-컨벤션)
4. [개발 환경 설정](#개발-환경-설정)
5. [디버깅 도구](#디버깅-도구)

## 📊 데이터베이스 모델 사용법

### 사용 가능한 모델 목록

```javascript
// ✅ 올바른 모델명들
const models = {
  User: 'User',
  Match: 'Match',
  MatchParticipant: 'MatchParticipant', // ❌ MatchPlayer 아님!
  Replay: 'Replay',
  MatchmakingQueue: 'MatchmakingQueue',
  UserLog: 'UserLog'
};
```

### 모델별 올바른 필드명

#### Match 모델
```javascript
// ✅ 올바른 사용법
const match = await global.db.Match.findByPk(matchId, {
  attributes: [
    'id',
    'mapName',        // ❌ 'map' 아님!
    'gameMode',
    'winner',
    'status',
    'gameDuration',   // ❌ 'duration' 아님!
    'createdBy',      // ❌ 'creator' 아님!
    'createdAt',
    'updatedAt'
  ]
});

// ❌ 잘못된 사용법
const wrongMatch = await global.db.Match.findByPk(matchId, {
  attributes: ['id', 'map', 'duration', 'creator'] // 모두 잘못된 필드명
});
```

#### MatchParticipant 모델
```javascript
// ✅ 올바른 사용법
const participants = await global.db.MatchParticipant.findAll({
  where: { matchId },
  attributes: [
    'id', 'matchId', 'userId', 'team', 'role', 'hero',
    'kills', 'deaths', 'assists', 'heroDamage', 'siegeDamage',
    'healing', 'experience', 'mmrBefore', 'mmrAfter', 'mmrChange'
  ]
});
```

### 모델 관계 (Association) 사용법

```javascript
// ✅ 올바른 관계 별칭 사용
const match = await global.db.Match.findByPk(matchId, {
  include: [
    {
      model: global.db.MatchParticipant,
      as: 'participants',  // ❌ 'players' 아님!
      include: [
        {
          model: global.db.User,
          as: 'user',
          attributes: ['id', 'battleTag', 'nickname']
        }
      ]
    },
    {
      model: global.db.User,
      as: 'creator',
      attributes: ['id', 'battleTag']
    }
  ]
});

// ❌ 잘못된 사용법
const wrongMatch = await global.db.Match.findByPk(matchId, {
  include: [
    {
      model: global.db.MatchPlayer,  // ❌ 존재하지 않는 모델
      as: 'players'                  // ❌ 잘못된 별칭
    }
  ]
});
```

## ⚠️ 일반적인 실수와 해결책

### 1. 모델명 실수

| ❌ 잘못된 사용 | ✅ 올바른 사용 | 설명 |
|---------------|---------------|------|
| `MatchPlayer` | `MatchParticipant` | Prisma 스키마와 Sequelize 모델명이 다름 |
| `Player` | `MatchParticipant` | 줄임말 사용 금지 |
| `global.db.MatchPlayer` | `global.db.MatchParticipant` | 전역 객체에서도 올바른 모델명 사용 |

### 2. 필드명 실수

| ❌ 잘못된 사용 | ✅ 올바른 사용 | 설명 |
|---------------|---------------|------|
| `match.map` | `match.mapName` | 데이터베이스 필드명과 일치 |
| `match.duration` | `match.gameDuration` | 명확한 필드명 사용 |
| `match.creator` | `match.createdBy` | 실제 필드명 사용 |

### 3. 관계 별칭 실수

| ❌ 잘못된 사용 | ✅ 올바른 사용 | 설명 |
|---------------|---------------|------|
| `as: 'players'` | `as: 'participants'` | Match 모델의 올바른 관계 별칭 |
| `match.players` | `match.participants` | 관계 접근 시 올바른 별칭 사용 |

### 4. 쿼리 작성 실수

```javascript
// ❌ 잘못된 쿼리
const wrongQuery = await global.db.Match.findAll({
  include: [{
    model: global.db.MatchPlayer,  // 존재하지 않는 모델
    as: 'players',                 // 잘못된 별칭
    where: { userId },
    attributes: ['team', 'hero']
  }],
  attributes: ['id', 'map', 'winner'] // 잘못된 필드명
});

// ✅ 올바른 쿼리
const correctQuery = await global.db.Match.findAll({
  include: [{
    model: global.db.MatchParticipant,  // 올바른 모델
    as: 'participants',                 // 올바른 별칭
    where: { userId },
    attributes: ['team', 'hero', 'role']
  }],
  attributes: ['id', 'mapName', 'winner'] // 올바른 필드명
});
```

## 🎨 코딩 컨벤션

### 1. 모델 접근 패턴

```javascript
// ✅ 권장 패턴
const authenticate = async (req, res, next) => {
  try {
    // 모델 존재 확인
    if (!global.db || !global.db.User) {
      return res.status(500).json({ message: '데이터베이스가 초기화되지 않았습니다' });
    }

    // 사용자 조회
    const user = await global.db.User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};
```

### 2. 에러 처리 패턴

```javascript
// ✅ 권장 에러 처리
router.get('/matches/:id', authenticate, async (req, res) => {
  try {
    const matchId = req.params.id;

    // 모델 존재 확인
    if (!global.db.Match || !global.db.MatchParticipant) {
      return res.status(500).json({ message: '필요한 모델이 초기화되지 않았습니다' });
    }

    const match = await global.db.Match.findByPk(matchId, {
      include: [{
        model: global.db.MatchParticipant,
        as: 'participants',
        include: [{
          model: global.db.User,
          as: 'user',
          attributes: ['id', 'battleTag', 'nickname']
        }]
      }]
    });

    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }

    res.json({ success: true, match });

  } catch (err) {
    logger.error('매치 조회 오류:', err);
    res.status(500).json({ message: '매치 정보 조회에 실패했습니다' });
  }
});
```

### 3. 로깅 패턴

```javascript
// ✅ 권장 로깅 패턴
logger.info('매치 생성 요청:', {
  userId: req.user.id,
  battleTag: req.user.battleTag,
  gameMode,
  mapName
});

// 성공 로그
logger.info('매치 생성 완료:', {
  matchId: match.id,
  createdBy: req.user.battleTag,
  participants: match.participants?.length || 0
});

// 에러 로그
logger.error('매치 생성 실패:', {
  error: err.message,
  stack: err.stack,
  userId: req.user?.id,
  requestData: { gameMode, mapName }
});
```

## 🛠️ 개발 환경 설정

### 환경 변수 설정

```bash
# .env.development
NODE_ENV=development
USE_POSTGRESQL=true
DATABASE_URL=postgresql://username:password@localhost:5432/hotstinder

# 개발 모드에서 모델 검증 활성화
ENABLE_MODEL_VALIDATION=true
```

### 개발 모드 기능

개발 환경에서는 다음 기능들이 자동으로 활성화됩니다:

1. **모델 검증**: 잘못된 모델명, 필드명, 관계 별칭 사용 시 경고
2. **모델 사용 추적**: 각 요청에서 사용된 모델들 로깅
3. **일반적인 실수 감지**: 코드에서 흔한 실수 패턴 자동 감지

## 🔍 디버깅 도구

### 1. 모델 검증 로그 확인

```bash
# 개발 서버 실행 시 자동으로 출력되는 검증 로그
🔍 일반적인 모델 사용 실수들:
{
  "modelNames": {
    "❌ MatchPlayer": "✅ MatchParticipant",
    "❌ Player": "✅ MatchParticipant"
  },
  "fieldNames": {
    "❌ match.map": "✅ match.mapName",
    "❌ match.duration": "✅ match.gameDuration"
  },
  "associations": {
    "❌ as: \"players\"": "✅ as: \"participants\"",
    "❌ match.players": "✅ match.participants"
  }
}
```

### 2. 모델 사용 통계 확인

```bash
# 각 API 요청 후 출력되는 모델 사용 통계
📊 요청별 모델 사용 통계: {
  "method": "GET",
  "url": "/api/matches/123",
  "duration": "45ms",
  "modelsUsed": [
    {
      "model": "Match",
      "operation": "findByPk",
      "timestamp": 1640995200000
    },
    {
      "model": "MatchParticipant",
      "operation": "include",
      "timestamp": 1640995200001
    }
  ]
}
```

### 3. 실시간 오류 감지

개발 환경에서 잘못된 모델 사용 시 즉시 콘솔에 경고가 출력됩니다:

```bash
❌ 잘못된 모델명: MatchPlayer
{
  "availableModels": ["User", "Match", "MatchParticipant", "Replay", "MatchmakingQueue", "UserLog"],
  "suggestion": "혹시 'MatchParticipant'을 의도하셨나요?"
}

❌ 잘못된 필드명: Match.map
{
  "correctField": "Match.mapName를 사용하세요",
  "example": "match.map → match.mapName"
}
```

## 📝 체크리스트

새로운 기능 개발 시 다음 사항들을 확인하세요:

### 모델 사용 체크리스트
- [ ] 올바른 모델명 사용 (`MatchParticipant`, `MatchPlayer` 아님)
- [ ] 올바른 필드명 사용 (`mapName`, `map` 아님)
- [ ] 올바른 관계 별칭 사용 (`participants`, `players` 아님)
- [ ] 모델 존재 확인 코드 포함
- [ ] 적절한 에러 처리 구현
- [ ] 로깅 추가

### 코드 품질 체크리스트
- [ ] try-catch 블록으로 에러 처리
- [ ] 의미있는 로그 메시지 작성
- [ ] 입력값 검증 구현
- [ ] 적절한 HTTP 상태 코드 사용
- [ ] 일관된 응답 형식 사용

### 테스트 체크리스트
- [ ] 개발 환경에서 모델 검증 로그 확인
- [ ] 다양한 시나리오 테스트
- [ ] 에러 케이스 테스트
- [ ] 로그 출력 확인

## 🚀 추가 리소스

- [Sequelize 공식 문서](https://sequelize.org/docs/v6/)
- [PostgreSQL 데이터 타입](https://www.postgresql.org/docs/current/datatype.html)
- [Express.js 에러 처리](https://expressjs.com/en/guide/error-handling.html)

---

**참고**: 이 가이드라인은 지속적으로 업데이트됩니다. 새로운 패턴이나 실수 사례를 발견하면 이 문서를 업데이트해주세요.
