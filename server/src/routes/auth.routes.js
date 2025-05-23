const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user.model');
const NeDBUser = require('../models/NeDBUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserLog = require('../models/userLog.model');
const NeDBUserLog = require('../models/NeDBUserLog');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * @route   GET /api/auth/bnet
 * @desc    배틀넷 OAuth 로그인 시작
 * @access  Public
 */
router.get('/bnet', (req, res, next) => {
  // state 매개변수 생성 - CSRF 방지 위한 무작위 문자열
  req.session.state = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
  
  // state 매개변수를 포함하여 인증
  passport.authenticate('bnet', { 
    state: req.session.state 
  })(req, res, next);
});

/**
 * @route   GET /api/auth/bnet/callback
 * @desc    배틀넷 OAuth 콜백 처리
 * @access  Public
 */
router.get('/bnet/callback',
  (req, res, next) => {
    // state 매개변수 검증
    if (req.query.state !== req.session.state) {
      logger.warn('OAuth state 매개변수 불일치', { 
        expected: req.session.state, 
        received: req.query.state 
      });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }
    
    // state 검증 성공 시 인증 진행
    passport.authenticate('bnet', { 
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` 
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // 사용자 로그인 로그 기록
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // 로그 데이터 구성
      const logData = {
        userId: req.user._id,
        bnetId: req.user.bnetId,
        battleTag: req.user.battletag || req.user.battleTag,
        ipAddress,
        userAgent,
        action: 'login',
        details: 'Battle.net OAuth 로그인'
      };
      
      // MongoDB 로그 저장
      try {
        await UserLog.create(logData);
      } catch (logErr) {
        logger.error('로그 생성 중 오류:', logErr);
      }
      
      // 토큰 생성
      const token = req.user.generateAuthToken();
      
      // 클라이언트로 리디렉션
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error) {
      console.error('로그인 로그 기록 중 오류:', error);
      // 에러가 있어도 로그인 처리는 계속 진행
      const token = req.user.generateAuthToken();
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    }
  }
);

/**
 * @route   POST /api/auth/admin-login
 * @desc    관리자 로그인
 * @access  Public
 */
router.post('/admin-login', async (req, res) => {
  try {
    logger.debug('관리자 로그인 요청', { username: req.body.username });
    const { username, password } = req.body;
    
    // 초기 관리자 계정이 없는 경우 생성
    await initializeAdminAccount();
    
    let adminUser;
    
    // 데이터베이스 유형에 따라 관리자 계정 찾기
    if (global.useNeDB) {
      logger.debug('NeDB에서 관리자 계정 조회', { username });
      adminUser = await NeDBUser.findByAdminUsername(username);
    } else {
      logger.debug('MongoDB에서 관리자 계정 조회', { username });
      adminUser = await User.findOne({
        adminUsername: username,
        isAdmin: true
      });
    }
    
    logger.debug('관리자 계정 조회 결과', { found: adminUser ? true : false });
    
    // 관리자가 존재하지 않는 경우
    if (!adminUser) {
      logger.warn('관리자 로그인 실패: 계정 없음', { username });
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, adminUser.adminPassword);
    
    if (!isMatch) {
      logger.warn('관리자 로그인 실패: 비밀번호 불일치', { username });
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    // 관리자 로그인 로그 기록
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // 로그 데이터 구성
      const logData = {
        userId: adminUser._id,
        bnetId: adminUser.bnetId || adminUser.battleNetId,
        battleTag: adminUser.battletag || adminUser.battleTag,
        ipAddress,
        userAgent,
        action: 'admin_login',
        details: `관리자 로그인: ${username}`
      };
      
      // 데이터베이스 유형에 따라 로그 저장
      if (global.useNeDB) {
        await NeDBUserLog.create(logData);
      } else {
        await UserLog.create(logData);
      }
      
      logger.info('관리자 로그인 성공', { 
        username, 
        userId: adminUser._id,
        battleTag: adminUser.battletag || adminUser.battleTag
      });
    } catch (logError) {
      logger.error('관리자 로그인 로그 기록 오류', logError);
      // 로그 오류가 있어도 로그인 진행
    }
    
    // JWT 토큰 생성
    const payload = {
      id: adminUser._id,
      isAdmin: true
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'your-jwt-secret', 
      { expiresIn: '24h' }
    );
    
    // 사용자 정보 반환
    res.json({
      token,
      user: {
        id: adminUser._id,
        battleTag: adminUser.battleTag || adminUser.battletag,
        nickname: adminUser.nickname,
        isAdmin: adminUser.isAdmin
      }
    });
  } catch (err) {
    logger.error('관리자 로그인 처리 오류', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 초기 관리자 계정 생성 (없는 경우에만)
 */
async function initializeAdminAccount() {
  try {
    let adminExists;
    
    // MongoDB에서만 관리자 계정 확인 및 생성
    logger.debug('MongoDB에서 관리자 계정 확인 중');
    adminExists = await User.findOne({ adminUsername: 'kooingh354', isAdmin: true });
    
    // 이미 있으면 생성하지 않음
    if (adminExists) {
      logger.debug('기존 관리자 계정 발견 (MongoDB)');
      
      // 기존 관리자 계정에 isSuperAdmin 필드가 없으면 업데이트
      if (adminExists.adminUsername === 'kooingh354' && adminExists.isSuperAdmin !== true) {
        adminExists.isSuperAdmin = true;
        await adminExists.save();
        logger.debug('최고관리자 속성 추가 완료:', adminExists._id);
      }
      
      return;
    }
    
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('674512@Alsrl', salt);
    
    // 관리자 계정 생성
    const adminUser = new User({
      bnetId: 'admin-user', // 필수 필드
      battletag: 'admin#0000', // 필수 필드 
      nickname: '관리자',
      isAdmin: true,
      isSuperAdmin: true,  // 최고관리자 표시
      adminUsername: 'kooingh354',
      adminPassword: hashedPassword
    });
    
    await adminUser.save();
    logger.info('초기 관리자 계정이 생성되었습니다 (MongoDB):', adminUser._id);
  } catch (err) {
    logger.error('관리자 계정 초기화 중 오류', err);
  }
}

/**
 * 승률 계산 유틸리티 함수
 */
function getUserWinRate(user) {
  if (!user) return 0;
  const totalGames = user.wins + user.losses;
  return totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
}

/**
 * @route   GET /api/auth/me
 * @desc    현재 인증된 사용자 정보 가져오기
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    // 인증 토큰 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 로그 추가
    logger.debug('토큰 검증 결과:', {
      userId: decoded.id,
      idType: typeof decoded.id
    });

    let user;

    // MongoDB만 사용하도록 수정
    try {
      // 먼저 bnetId로 사용자를 찾음
      user = await User.findOne({ bnetId: decoded.id }).select('-accessToken -refreshToken -adminPassword');
      
      // bnetId로 찾을 수 없는 경우 _id로 조회
      if (!user && decoded.id) {
          // MongoDB ObjectId가 유효한지 확인
          if (mongoose.Types.ObjectId.isValid(decoded.id)) {
            user = await User.findById(decoded.id).select('-accessToken -refreshToken -adminPassword');
          }
      }
    } catch (findErr) {
      logger.error('사용자 조회 오류:', findErr);
    }

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 사용자 정보 반환
    const winRate = getUserWinRate(user);
    
    // 배틀태그 정보 일관성 처리
    let battleTagField = user.battleTag || user.battletag || '';
    
    // 로그 추가
    logger.debug('사용자 정보 반환 전처리:', {
      originalFields: {
        battleTag: user.battleTag,
        battletag: user.battletag
      },
      normalizedTag: battleTagField
    });
      
    res.json({
      user: {
        id: user._id,
        battleTag: battleTagField,
        battletag: battleTagField, // 두 필드 모두 동일한 값 설정
        nickname: user.nickname || (battleTagField ? battleTagField.split('#')[0] : ''),
        profilePicture: user.profilePicture,
        preferredRoles: user.preferredRoles,
        favoriteHeroes: user.favoriteHeroes,
        preferredHeroes: user.preferredHeroes, // 이전 버전 호환성
        playerStats: user.playerStats,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin || false,  // 최고관리자 여부
        isProfileComplete: user.isProfileComplete || false,
        winRate: winRate,
        mmr: user.mmr || 1500,
        wins: user.wins || 0,
        losses: user.losses || 0,
        previousTier: user.previousTier || 'placement'
      }
    });
  } catch (err) {
    console.error('사용자 인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
});

/**
 * @route   GET /api/auth/user
 * @desc    현재 인증된 사용자 정보 가져오기 (/api/auth/me와 동일)
 * @access  Private
 */
router.get('/user', async (req, res) => {
  try {
    // 인증 토큰 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 로그 추가
    logger.debug('토큰 검증 결과:', {
      userId: decoded.id,
      idType: typeof decoded.id
    });

    let user;

    // MongoDB만 사용하도록 수정
    try {
      // 먼저 bnetId로 사용자를 찾음
      user = await User.findOne({ bnetId: decoded.id }).select('-accessToken -refreshToken -adminPassword');
      
      // bnetId로 찾을 수 없는 경우 _id로 조회
      if (!user && decoded.id) {
        // MongoDB ObjectId가 유효한지 확인
        if (mongoose.Types.ObjectId.isValid(decoded.id)) {
          user = await User.findById(decoded.id).select('-accessToken -refreshToken -adminPassword');
        }
      }
    } catch (findErr) {
      logger.error('사용자 조회 오류:', findErr);
    }

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 사용자 정보 반환
    const winRate = getUserWinRate(user);
    
    // 배틀태그 정보 일관성 처리
    let battleTagField = user.battleTag || user.battletag || '';
    
    // 로그 추가
    logger.debug('사용자 정보 반환 전처리:', {
      originalFields: {
        battleTag: user.battleTag,
        battletag: user.battletag
      },
      normalizedTag: battleTagField
    });
      
    res.json({
      user: {
        id: user._id,
        battleTag: battleTagField,
        battletag: battleTagField, // 두 필드 모두 동일한 값 설정
        nickname: user.nickname || (battleTagField ? battleTagField.split('#')[0] : ''),
        profilePicture: user.profilePicture,
        preferredRoles: user.preferredRoles,
        favoriteHeroes: user.favoriteHeroes,
        preferredHeroes: user.preferredHeroes, // 이전 버전 호환성
        playerStats: user.playerStats,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin || false,  // 최고관리자 여부
        isProfileComplete: user.isProfileComplete || false,
        winRate: winRate,
        mmr: user.mmr || 1500,
        wins: user.wins || 0,
        losses: user.losses || 0,
        previousTier: user.previousTier || 'placement'
      }
    });
  } catch (err) {
    console.error('사용자 인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
});

/**
 * @route   GET /api/auth/logout
 * @desc    로그아웃
 * @access  Public
 */
router.get('/logout', async (req, res) => {
  try {
    // 사용자가 인증된 경우에만 로그 기록
    if (req.isAuthenticated() && req.user) {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // 로그 데이터 구성
      const logData = {
        userId: req.user._id,
        bnetId: req.user.bnetId || req.user.battleNetId,
        battleTag: req.user.battletag || req.user.battleTag,
        ipAddress,
        userAgent,
        action: 'logout',
        details: '사용자 로그아웃'
      };
      
      // MongoDB 로그 저장
      try {
        await UserLog.create(logData);
      } catch (logErr) {
        logger.error('로그아웃 로그 생성 중 오류:', logErr);
      }
    }
    
    // 로그아웃 처리
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: '로그아웃 실패' });
      }
      res.json({ message: '로그아웃 성공' });
    });
  } catch (error) {
    console.error('로그아웃 처리 중 오류:', error);
    // 오류가 있어도 로그아웃은 처리
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: '로그아웃 실패' });
      }
      res.json({ message: '로그아웃 성공' });
    });
  }
});

/**
 * @route   POST /api/auth/profile/setup
 * @desc    사용자 프로필 설정
 * @access  Private
 */
router.post('/profile/setup', async (req, res) => {
  try {
    // 인증 토큰 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    let user;
    try {
      // 먼저 bnetId로 사용자를 찾음
      user = await User.findOne({ bnetId: decoded.id });
      
      // bnetId로 찾을 수 없는 경우 _id로 조회
      if (!user && decoded.id) {
        // MongoDB ObjectId가 유효한지 확인
        if (mongoose.Types.ObjectId.isValid(decoded.id)) {
          user = await User.findById(decoded.id);
        }
      }
    } catch (findErr) {
      logger.error('사용자 조회 오류:', findErr);
    }
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 요청 데이터 추출
    const { nickname, preferredRoles, previousTier, initialMmr } = req.body;
    
    // 데이터 검증
    if (!preferredRoles || !Array.isArray(preferredRoles) || preferredRoles.length === 0) {
      return res.status(400).json({ message: '선호하는 역할은 필수 항목입니다' });
    }
    
    // 사용자 정보 업데이트
    user.nickname = nickname || user.nickname;
    user.preferredRoles = preferredRoles;
    user.previousTier = previousTier || 'placement';
    
    // 초기 MMR 설정 - 배치 티어 선택 시에는 MMR이 변경되지 않도록 수정
    if (initialMmr && (!user.mmr || user.mmr === 1500) && previousTier !== 'placement') {
      user.mmr = initialMmr;
    }
    
    // 프로필 설정 완료 표시
    user.isProfileComplete = true;
    
    // 변경사항 저장
    await user.save();
    
    // 로그 기록
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // 로그 데이터 구성
      const logData = {
        userId: user._id,
        bnetId: user.bnetId,
        battleTag: user.battletag || user.battleTag,
        ipAddress,
        userAgent,
        action: 'profile_update',
        details: '프로필 정보 업데이트'
      };
      
      // 로그 저장
      await UserLog.create(logData);
    } catch (logErr) {
      logger.error('프로필 업데이트 로그 생성 중 오류:', logErr);
      // 로그 오류는 무시하고 진행
    }
    
    // 응답 데이터 구성
    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: {
        id: user._id,
        battletag: user.battletag || user.battleTag,
        nickname: user.nickname,
        preferredRoles: user.preferredRoles,
        previousTier: user.previousTier,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (err) {
    logger.error('프로필 설정 중 오류:', err);
    res.status(500).json({ 
      success: false,
      message: '프로필 설정 중 오류가 발생했습니다' 
    });
  }
});

module.exports = router; 