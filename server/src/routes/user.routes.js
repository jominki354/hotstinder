const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// 미들웨어: 인증 확인
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};

// 미들웨어: 관리자 확인
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
  next();
};

/**
 * @route   GET /api/users/profile
 * @desc    자신의 프로필 정보 조회
 * @access  Private
 */
router.get('/profile', authenticate, (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    battleTag: user.battleTag,
    nickname: user.nickname || user.battleTag.split('#')[0],
    email: user.email,
    profilePicture: user.profilePicture,
    preferredHeroes: user.preferredHeroes,
    playerStats: user.playerStats,
    winRate: user.getWinRate(),
    createdAt: user.createdAt
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    프로필 정보 업데이트
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { nickname, preferredHeroes, profilePicture } = req.body;
    const user = req.user;
    
    // 업데이트할 필드 설정
    if (nickname) user.nickname = nickname;
    if (profilePicture) user.profilePicture = profilePicture;
    if (preferredHeroes) user.preferredHeroes = preferredHeroes;
    
    // 저장
    await user.save();
    
    res.json({
      message: '프로필이 업데이트되었습니다',
      user: {
        id: user._id,
        battleTag: user.battleTag,
        nickname: user.nickname,
        profilePicture: user.profilePicture,
        preferredHeroes: user.preferredHeroes
      }
    });
  } catch (err) {
    console.error('프로필 업데이트 오류:', err);
    res.status(500).json({ message: '프로필 업데이트에 실패했습니다' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    특정 사용자 정보 조회
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-accessToken -refreshToken -email');
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    res.json({
      id: user._id,
      battleTag: user.battleTag,
      nickname: user.nickname || user.battleTag.split('#')[0],
      profilePicture: user.profilePicture,
      preferredHeroes: user.preferredHeroes,
      playerStats: user.playerStats,
      winRate: user.getWinRate(),
      isAdmin: user.isAdmin
    });
  } catch (err) {
    console.error('사용자 조회 오류:', err);
    res.status(500).json({ message: '사용자 정보 조회에 실패했습니다' });
  }
});

/**
 * @route   GET /api/users/search/:query
 * @desc    사용자 검색
 * @access  Private
 */
router.get('/search/:query', authenticate, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    let users;
    
    // 배틀태그로 검색
    if (searchQuery.includes('#')) {
      users = await User.find({ battleTag: new RegExp(searchQuery, 'i') })
        .select('_id battleTag nickname profilePicture playerStats')
        .limit(10);
    } else {
      // 닉네임으로 검색
      users = await User.find({
        $or: [
          { nickname: new RegExp(searchQuery, 'i') },
          { battleTag: new RegExp(searchQuery, 'i') }
        ]
      })
        .select('_id battleTag nickname profilePicture playerStats')
        .limit(10);
    }
    
    // 검색 결과 반환
    res.json(users.map(user => ({
      id: user._id,
      battleTag: user.battleTag,
      nickname: user.nickname || user.battleTag.split('#')[0],
      profilePicture: user.profilePicture,
      mmr: user.playerStats.mmr
    })));
  } catch (err) {
    console.error('사용자 검색 오류:', err);
    res.status(500).json({ message: '사용자 검색에 실패했습니다' });
  }
});

/**
 * @route   GET /api/users/admin/all
 * @desc    모든 사용자 목록 조회 (관리자용)
 * @access  Admin
 */
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-accessToken -refreshToken')
      .sort('-createdAt');
    
    res.json(users);
  } catch (err) {
    console.error('사용자 목록 조회 오류:', err);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다' });
  }
});

module.exports = router; 