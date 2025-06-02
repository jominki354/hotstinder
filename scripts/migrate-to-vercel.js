#!/usr/bin/env node

/**
 * Vercel Postgres 데이터베이스 마이그레이션 스크립트
 * 로컬 PostgreSQL에서 Vercel Postgres로 데이터를 마이그레이션합니다.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// .env.vercel 파일 읽기
function loadVercelEnv() {
  const vercelEnvPath = path.join(__dirname, '..', '.env.vercel');
  if (fs.existsSync(vercelEnvPath)) {
    const envContent = fs.readFileSync(vercelEnvPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return envVars;
  }
  return {};
}

// 환경 변수 로드
require('dotenv').config();
const vercelEnv = loadVercelEnv();

// 로컬 데이터베이스 연결 설정
const localConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://kooingh354:674512@Alsrl@localhost:5432/hotstinder',
};

// Vercel Postgres 연결 설정 (.env.vercel에서 가져옴)
const vercelConfig = {
  connectionString: vercelEnv.POSTGRES_URL || vercelEnv.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('🚀 Vercel Postgres 마이그레이션 시작...\n');
console.log('🔗 Vercel Postgres URL:', vercelConfig.connectionString ? '✅ 발견됨' : '❌ 없음');

// 테이블 생성 SQL
const createTablesSQL = `
-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bnet_id VARCHAR(50) UNIQUE,
  battle_tag VARCHAR(255) NOT NULL UNIQUE,
  nickname VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_profile_complete BOOLEAN DEFAULT false,
  preferred_roles JSONB DEFAULT '["전체"]',
  previous_tier VARCHAR(50) DEFAULT 'placement',
  mmr INTEGER DEFAULT 1500,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches 테이블
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_name VARCHAR(255) NOT NULL,
  game_mode VARCHAR(100) DEFAULT 'Storm League',
  status VARCHAR(50) DEFAULT 'waiting',
  winner VARCHAR(10),
  game_duration INTEGER DEFAULT 0,
  is_simulation BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MatchParticipants 테이블
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team VARCHAR(10) NOT NULL,
  hero VARCHAR(100),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  hero_damage INTEGER DEFAULT 0,
  siege_damage INTEGER DEFAULT 0,
  healing INTEGER DEFAULT 0,
  experience_contribution INTEGER DEFAULT 0,
  mmr_change INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UserLogs 테이블
CREATE TABLE IF NOT EXISTS user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MatchmakingQueue 테이블
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferred_roles JSONB DEFAULT '["전체"]',
  mmr INTEGER DEFAULT 1500,
  queue_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_bnet_id ON users(bnet_id);
CREATE INDEX IF NOT EXISTS idx_users_battle_tag ON users(battle_tag);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_action ON user_logs(action);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_user_id ON matchmaking_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON matchmaking_queue(status);

-- 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_match_participants_updated_at ON match_participants;
CREATE TRIGGER update_match_participants_updated_at BEFORE UPDATE ON match_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matchmaking_queue_updated_at ON matchmaking_queue;
CREATE TRIGGER update_matchmaking_queue_updated_at BEFORE UPDATE ON matchmaking_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// 관리자 계정 생성 SQL (비밀번호 1231로 변경)
const createAdminSQL = `
-- 기존 관리자 계정 삭제 (있다면)
DELETE FROM users WHERE battle_tag = 'admin';

-- 새 관리자 계정 생성
INSERT INTO users (
  battle_tag, 
  nickname, 
  email, 
  password, 
  role, 
  is_profile_complete, 
  mmr, 
  wins, 
  losses
) VALUES (
  'admin',
  'admin',
  'admin@hotstinder.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1VdCFyPdHcUkn/TwpIqSaSK2Dvpvs9G', -- bcrypt hash of '1231'
  'admin',
  true,
  2000,
  0,
  0
);
`;

// 테이블 생성 함수
async function createTables(client) {
  try {
    console.log('📋 테이블 생성 중...');
    await client.query(createTablesSQL);
    console.log('✅ 테이블 생성 완료');
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
    throw error;
  }
}

// 관리자 계정 생성 함수
async function createAdminUser(client) {
  try {
    console.log('👤 관리자 계정 생성 중...');
    await client.query(createAdminSQL);
    console.log('✅ 관리자 계정 생성 완료');
  } catch (error) {
    console.error('❌ 관리자 계정 생성 실패:', error.message);
    throw error;
  }
}

// 데이터 마이그레이션 함수
async function migrateData() {
  let localClient, vercelClient;

  try {
    console.log('🔗 로컬 데이터베이스 연결 중...');
    localClient = new Client(localConfig);
    await localClient.connect();
    console.log('✅ 로컬 데이터베이스 연결 성공');

    console.log('🔗 Vercel Postgres 연결 중...');
    vercelClient = new Client(vercelConfig);
    await vercelClient.connect();
    console.log('✅ Vercel Postgres 연결 성공');

    // Vercel Postgres에 테이블 생성
    await createTables(vercelClient);

    // 관리자 계정 생성
    await createAdminUser(vercelClient);

    // 사용자 데이터 마이그레이션
    console.log('👥 사용자 데이터 마이그레이션 중...');
    const usersResult = await localClient.query('SELECT * FROM users');
    
    if (usersResult.rows.length > 0) {
      for (const user of usersResult.rows) {
        try {
          await vercelClient.query(`
            INSERT INTO users (
              id, bnet_id, battle_tag, nickname, email, password, role,
              is_profile_complete, preferred_roles, previous_tier, mmr,
              wins, losses, last_login_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO UPDATE SET
              bnet_id = EXCLUDED.bnet_id,
              battle_tag = EXCLUDED.battle_tag,
              nickname = EXCLUDED.nickname,
              email = EXCLUDED.email,
              password = EXCLUDED.password,
              role = EXCLUDED.role,
              is_profile_complete = EXCLUDED.is_profile_complete,
              preferred_roles = EXCLUDED.preferred_roles,
              previous_tier = EXCLUDED.previous_tier,
              mmr = EXCLUDED.mmr,
              wins = EXCLUDED.wins,
              losses = EXCLUDED.losses,
              last_login_at = EXCLUDED.last_login_at,
              updated_at = CURRENT_TIMESTAMP
          `, [
            user.id, user.bnet_id, user.battle_tag, user.nickname, user.email,
            user.password, user.role, user.is_profile_complete, user.preferred_roles,
            user.previous_tier, user.mmr, user.wins, user.losses, user.last_login_at,
            user.created_at, user.updated_at
          ]);
        } catch (userError) {
          console.log(`⚠️  사용자 ${user.battle_tag} 마이그레이션 실패:`, userError.message);
        }
      }
      console.log(`✅ ${usersResult.rows.length}명의 사용자 데이터 마이그레이션 완료`);
    } else {
      console.log('ℹ️  마이그레이션할 사용자 데이터가 없습니다.');
    }

    // 매치 데이터 마이그레이션
    console.log('🎮 매치 데이터 마이그레이션 중...');
    const matchesResult = await localClient.query('SELECT * FROM matches');
    
    if (matchesResult.rows.length > 0) {
      for (const match of matchesResult.rows) {
        try {
          await vercelClient.query(`
            INSERT INTO matches (
              id, map_name, game_mode, status, winner, game_duration,
              is_simulation, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              map_name = EXCLUDED.map_name,
              game_mode = EXCLUDED.game_mode,
              status = EXCLUDED.status,
              winner = EXCLUDED.winner,
              game_duration = EXCLUDED.game_duration,
              is_simulation = EXCLUDED.is_simulation,
              updated_at = CURRENT_TIMESTAMP
          `, [
            match.id, match.map_name, match.game_mode, match.status,
            match.winner, match.game_duration, match.is_simulation,
            match.created_at, match.updated_at
          ]);
        } catch (matchError) {
          console.log(`⚠️  매치 ${match.id} 마이그레이션 실패:`, matchError.message);
        }
      }
      console.log(`✅ ${matchesResult.rows.length}개의 매치 데이터 마이그레이션 완료`);
    } else {
      console.log('ℹ️  마이그레이션할 매치 데이터가 없습니다.');
    }

    console.log('\n🎉 데이터 마이그레이션 완료!');
    console.log('\n📋 다음 단계:');
    console.log('1. Vercel 대시보드에서 DATABASE_URL 환경 변수 확인');
    console.log('2. vercel --prod 명령으로 프로덕션 배포');
    console.log('3. https://hotstinder.vercel.app 에서 서비스 확인');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error.message);
    throw error;
  } finally {
    if (localClient) {
      await localClient.end();
      console.log('🔌 로컬 데이터베이스 연결 종료');
    }
    if (vercelClient) {
      await vercelClient.end();
      console.log('🔌 Vercel Postgres 연결 종료');
    }
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🎯 Vercel Postgres 마이그레이션');
    console.log('📊 로컬 → Vercel 데이터 이전\n');

    if (!vercelConfig.connectionString) {
      console.error('❌ Vercel Postgres 연결 정보가 없습니다.');
      console.log('💡 다음 단계를 먼저 완료하세요:');
      console.log('1. Vercel 대시보드에서 Postgres 데이터베이스 생성');
      console.log('2. DATABASE_URL 환경 변수 설정');
      console.log('3. POSTGRES_URL 환경 변수를 로컬 .env 파일에 추가');
      process.exit(1);
    }

    await migrateData();

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { migrateData, createTables, createAdminUser }; 