-- PostgreSQL 초기화 스크립트
-- Docker Compose에서 PostgreSQL 컨테이너 시작 시 실행됩니다.

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_tag VARCHAR(255) UNIQUE NOT NULL,
    bnet_id VARCHAR(50) UNIQUE,
    nickname VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255), -- 관리자 계정용 비밀번호
    role VARCHAR(50) DEFAULT 'user',
    is_profile_complete BOOLEAN DEFAULT FALSE,
    preferred_roles JSONB DEFAULT '["전체"]',
    previous_tier VARCHAR(50) DEFAULT 'placement',
    mmr INTEGER DEFAULT 1500,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 매치 테이블
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) DEFAULT 'waiting',
    game_mode VARCHAR(100),
    map_name VARCHAR(255),
    max_players INTEGER DEFAULT 10,
    current_players INTEGER DEFAULT 0,
    average_mmr INTEGER,
    created_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 매치 참가자 테이블
CREATE TABLE IF NOT EXISTS match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team INTEGER,
    hero VARCHAR(255),
    role VARCHAR(50),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, user_id)
);

-- 리플레이 테이블
CREATE TABLE IF NOT EXISTS replays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id),
    uploader_id UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    game_version VARCHAR(50),
    game_length INTEGER,
    map_name VARCHAR(255),
    game_mode VARCHAR(100),
    analysis_data JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 매치메이킹 큐 테이블
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_role VARCHAR(50),
    game_mode VARCHAR(100),
    mmr INTEGER,
    queue_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'waiting',
    UNIQUE(user_id)
);

-- 사용자 로그 테이블
CREATE TABLE IF NOT EXISTS user_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_battle_tag ON users(battle_tag);
CREATE INDEX IF NOT EXISTS idx_users_bnet_id ON users(bnet_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at);

CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_replays_match_id ON replays(match_id);
CREATE INDEX IF NOT EXISTS idx_replays_uploader_id ON replays(uploader_id);
CREATE INDEX IF NOT EXISTS idx_replays_uploaded_at ON replays(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_user_id ON matchmaking_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_queue_time ON matchmaking_queue(queue_time);

CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_action ON user_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON user_logs(created_at);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 (개발용)
INSERT INTO users (battle_tag, bnet_id, nickname, mmr, is_profile_complete)
VALUES
    ('TestUser1#1234', '1001', 'TestUser1', 1600, true),
    ('TestUser2#5678', '1002', 'TestUser2', 1400, true),
    ('TestUser3#9012', '1003', 'TestUser3', 1700, true)
ON CONFLICT (battle_tag) DO NOTHING;

COMMIT;
