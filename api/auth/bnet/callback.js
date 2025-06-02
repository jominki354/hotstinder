require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');

// Passport 설정 (bnet.js와 동일)
passport.use('bnet', new (require('passport-bnet').Strategy)({
  clientID: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  callbackURL: process.env.BNET_CALLBACK_URL || 'https://hotstinder.vercel.app/api/auth/bnet/callback',
  region: process.env.BNET_REGION || 'kr'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      bnetId: profile.id,
      battleTag: profile.battletag,
      accessToken: accessToken,
      generateAuthToken: function() {
        return jwt.sign(
          {
            id: this.id,        // UUID 사용 (이 시점에서는 아직 없으므로 나중에 설정)
            bnetId: this.bnetId,
            battleTag: this.battleTag
          },
          process.env.JWT_SECRET || 'your-jwt-secret',
          { expiresIn: '24h' }
        );
      }
    };
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// PostgreSQL 연결 함수
const connectPostgreSQL = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  }

  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

  await sequelize.authenticate();
  console.log('PostgreSQL 연결 성공');

  return sequelize;
};

// User 모델 정의
const defineUser = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    battleTag: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'battle_tag'
    },
    bnetId: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'bnet_id'
    },
    nickname: {
      type: DataTypes.STRING(255)
    },
    email: {
      type: DataTypes.STRING(255)
    },
    password: {
      type: DataTypes.STRING(255)
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user'
    },
    isProfileComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_profile_complete'
    },
    preferredRoles: {
      type: DataTypes.JSONB,
      defaultValue: ['전체'],
      field: 'preferred_roles'
    },
    previousTier: {
      type: DataTypes.STRING(50),
      defaultValue: 'placement',
      field: 'previous_tier'
    },
    mmr: {
      type: DataTypes.INTEGER,
      defaultValue: 1500
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    }
  }, {
    tableName: 'users'
  });
};

module.exports = async function handler(req, res) {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('API 타임아웃 발생');
      res.status(504).json({
        error: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        timeout: true
      });
    }
  }, 25000);

  try {
    console.log('Vercel /api/auth/bnet/callback 요청 처리:', req.method);

    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://hotstinder.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      clearTimeout(timeoutId);
      return res.status(405).json({ error: '지원하지 않는 메서드입니다' });
    }

    const { code, state } = req.query;

    if (!code) {
      clearTimeout(timeoutId);
      return res.status(400).json({ error: '인증 코드가 필요합니다' });
    }

    // Battle.net OAuth 토큰 교환
    const tokenResponse = await fetch('https://oauth.battle.net/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.BNET_CLIENT_ID}:${process.env.BNET_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.BNET_REDIRECT_URI || 'https://hotstinder.vercel.app/api/auth/bnet/callback'
      })
    });

    if (!tokenResponse.ok) {
      console.error('Battle.net 토큰 교환 실패:', await tokenResponse.text());
      clearTimeout(timeoutId);
      return res.status(400).json({ error: 'Battle.net 인증에 실패했습니다' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Battle.net 사용자 정보 조회
    const userResponse = await fetch('https://oauth.battle.net/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      console.error('Battle.net 사용자 정보 조회 실패:', await userResponse.text());
      clearTimeout(timeoutId);
      return res.status(400).json({ error: '사용자 정보를 가져올 수 없습니다' });
    }

    const userData = await userResponse.json();
    console.log('Battle.net 사용자 정보:', userData);

    // PostgreSQL 연결
    console.log('PostgreSQL 연결 시도 중...');
    const sequelize = await Promise.race([
      connectPostgreSQL(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PostgreSQL 연결 타임아웃')), 15000)
      )
    ]);
    console.log('PostgreSQL 연결 완료');

    // 모델 정의
    const User = defineUser(sequelize);

    // 사용자 찾기 또는 생성
    let user = await User.findOne({ where: { bnetId: userData.id.toString() } });

    if (!user) {
      // 새 사용자 생성
      user = await User.create({
        bnetId: userData.id.toString(),
        battleTag: userData.battletag,
        nickname: userData.battletag?.split('#')[0] || '사용자',
        email: userData.email,
        isProfileComplete: false,
        mmr: 1500,
        wins: 0,
        losses: 0,
        preferredRoles: ['전체'],
        previousTier: 'placement',
        role: 'user',
        lastLoginAt: new Date()
      });

      console.log('새 사용자 생성:', user.battleTag);
    } else {
      // 기존 사용자 로그인 시간 업데이트
      await user.update({ lastLoginAt: new Date() });
      console.log('기존 사용자 로그인:', user.battleTag);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        bnetId: user.bnetId,
        battleTag: user.battleTag,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // 프론트엔드로 리디렉션 (토큰과 함께)
    const frontendUrl = process.env.FRONTEND_URL || 'https://hotstinder.vercel.app';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      bnetId: user.bnetId,
      battleTag: user.battleTag,
      nickname: user.nickname,
      role: user.role,
      isProfileComplete: user.isProfileComplete
    }))}`;

    console.log('Battle.net 인증 성공, 리디렉션:', user.battleTag);

    clearTimeout(timeoutId);
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('/api/auth/bnet/callback 오류:', error);
    clearTimeout(timeoutId);

    // 에러 발생 시 프론트엔드 에러 페이지로 리디렉션
    const frontendUrl = process.env.FRONTEND_URL || 'https://hotstinder.vercel.app';
    const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent('인증 중 오류가 발생했습니다')}`;

    return res.redirect(errorUrl);
  }
};
