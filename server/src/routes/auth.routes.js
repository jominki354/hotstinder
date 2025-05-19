const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user.model');
const NeDBUser = require('../models/NeDBUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @route   GET /api/auth/bnet
 * @desc    배틀넷 OAuth 로그인 시작
 * @access  Public
 */
router.get('/bnet', passport.authenticate('bnet'));

/**
 * @route   GET /api/auth/bnet/callback
 * @desc    배틀넷 OAuth 콜백 처리
 * @access  Public
 */
router.get('/bnet/callback',
  passport.authenticate('bnet', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` 
  }),
  (req, res) => {
    // 토큰 생성
    const token = req.user.generateAuthToken();
    
    // 클라이언트로 리디렉션
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  }
);

/**
 * @route   POST /api/auth/admin-login
 * @desc    관리자 로그인
 * @access  Public
 */
router.post('/admin-login', async (req, res) => {
  try {
    console.log('관리자 로그인 요청:', req.body);
    const { username, password } = req.body;
    
    // 초기 관리자 계정이 없는 경우 생성
    await initializeAdminAccount();
    
    let adminUser;
    
    // 데이터베이스 유형에 따라 관리자 계정 찾기
    if (global.useNeDB) {
      console.log('NeDB에서 관리자 계정 조회 중:', username);
      adminUser = await NeDBUser.findByAdminUsername(username);
    } else {
      console.log('MongoDB에서 관리자 계정 조회 중:', username);
      adminUser = await User.findOne({
        adminUsername: username,
        isAdmin: true
      });
    }
    
    console.log('찾은 관리자 계정:', adminUser ? '있음' : '없음');
    
    // 관리자가 존재하지 않는 경우
    if (!adminUser) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, adminUser.adminPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    // JWT 토큰 생성
    const payload = {
      id: adminUser._id,
      isAdmin: true
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // 사용자 정보 반환
    res.json({
      token,
      user: {
        id: adminUser._id,
        battleTag: adminUser.battleTag,
        nickname: adminUser.nickname,
        isAdmin: adminUser.isAdmin
      }
    });
  } catch (err) {
    console.error('관리자 로그인 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 초기 관리자 계정 생성 (없는 경우에만)
 */
async function initializeAdminAccount() {
  try {
    let adminExists;
    
    // 데이터베이스 유형에 따라 관리자 계정 확인 및 생성
    if (global.useNeDB) {
      console.log('NeDB에서 관리자 계정 확인 중');
      adminExists = await NeDBUser.findByAdminUsername('kooingh354');
      
      // 이미 있으면 생성하지 않음
      if (adminExists) {
        console.log('기존 관리자 계정 발견 (NeDB)');
        return;
      }
      
      // 비밀번호 해싱
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('674512@Alsrl', salt);
      
      // 관리자 계정 생성
      const adminUser = await NeDBUser.create({
        bnetId: 'admin',
        battletag: 'admin#0000',
        nickname: '관리자',
        accessToken: 'admin-token',
        isAdmin: true,
        adminUsername: 'kooingh354',
        adminPassword: hashedPassword,
        playerStats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          mmr: 1500
        }
      });
      
      console.log('초기 관리자 계정이 생성되었습니다 (NeDB):', adminUser._id);
    } else {
      console.log('MongoDB에서 관리자 계정 확인 중');
      adminExists = await User.findOne({ adminUsername: 'kooingh354', isAdmin: true });
      
      // 이미 있으면 생성하지 않음
      if (adminExists) {
        console.log('기존 관리자 계정 발견 (MongoDB)');
        return;
      }
      
      // 비밀번호 해싱
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('674512@Alsrl', salt);
      
      // 관리자 계정 생성
      const adminUser = new User({
        battleNetId: 'admin',
        battleTag: 'admin#0000',
        nickname: '관리자',
        accessToken: 'admin-token',
        isAdmin: true,
        adminUsername: 'kooingh354',
        adminPassword: hashedPassword
      });
      
      await adminUser.save();
      console.log('초기 관리자 계정이 생성되었습니다 (MongoDB):', adminUser._id);
    }
  } catch (err) {
    console.error('초기 관리자 계정 생성 오류:', err);
  }
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
    
    let user;
    
    // 데이터베이스 유형에 따라 사용자 정보 조회
    if (global.useNeDB) {
      user = await NeDBUser.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id).select('-accessToken -refreshToken -adminPassword');
    }
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 사용자 정보 반환
    const winRate = global.useNeDB 
      ? NeDBUser.getWinRate(user)
      : user.getWinRate();
      
    res.json({
      user: {
        id: user._id,
        battleTag: user.battleTag,
        nickname: user.nickname || user.battleTag.split('#')[0],
        profilePicture: user.profilePicture,
        preferredHeroes: user.preferredHeroes,
        playerStats: user.playerStats,
        isAdmin: user.isAdmin,
        winRate: winRate
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
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: '로그아웃 실패' });
    }
    res.json({ message: '로그아웃 성공' });
  });
});

module.exports = router; 