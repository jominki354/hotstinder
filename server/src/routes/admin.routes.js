const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const NeDBUser = require('../models/NeDBUser');
const Match = require('../models/match.model');
const NeDBMatch = require('../models/NeDBMatch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const UserLog = require('../models/userLog.model');
const NeDBUserLog = require('../models/NeDBUserLog');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// 미들웨어: 관리자 인증 확인
const authenticateAdmin = async (req, res, next) => {
  try {
    // 인증 토큰 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회 (MongoDB 사용)
    let user;
    try {
      // 먼저 bnetId로 사용자를 찾음
      user = await User.findOne({ bnetId: decoded.id });
      
      // bnetId로 찾을 수 없는 경우 _id로 조회
      if (!user && decoded.id) {
      user = await User.findById(decoded.id);
      }
    } catch (findErr) {
      console.error('사용자 조회 오류:', findErr);
    }
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 관리자 권한 확인
    if (!user.isAdmin) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('관리자 인증 오류:', err);
    return res.status(401).json({ message: '인증에 실패했습니다' });
  }
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    관리자 대시보드 통계 정보 가져오기
 * @access  Admin
 */
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    let totalUsers, activeUsers, totalMatches, recentMatches;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // NeDB 사용 시
      const allUsers = await NeDBUser.findAll();
      totalUsers = allUsers.length;
      
      // 최근 7일간 활성 사용자 수
      activeUsers = allUsers.filter(user => 
        user.lastActive && new Date(user.lastActive) >= sevenDaysAgo
      ).length;
      
      // NeDBMatch 모델 사용
      totalMatches = (await NeDBMatch.findAll()).length;
      recentMatches = await NeDBMatch.countSince(oneDayAgo);
      
      res.json({
        totalUsers,
        totalMatches,
        activeUsers,
        recentMatches
      });
    } else {
      // MongoDB 사용 시
      // 총 사용자 수
      totalUsers = await User.countDocuments();
      
      // 총 매치 수
      totalMatches = await Match.countDocuments();
      
      // 최근 7일간 활성 사용자 수
      activeUsers = await User.countDocuments({
        lastActive: { $gte: sevenDaysAgo }
      });
      
      // 최근 24시간 동안의 매치 수
      recentMatches = await Match.countDocuments({
        createdAt: { $gte: oneDayAgo }
      });
      
      res.json({
        totalUsers,
        totalMatches,
        activeUsers,
        recentMatches
      });
    }
  } catch (err) {
    console.error('대시보드 통계 조회 오류:', err);
    res.status(500).json({ message: '통계 데이터를 가져오는데 실패했습니다.' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    모든 사용자 목록 가져오기
 * @access  Admin
 */
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortDirection = req.query.sortDirection === 'asc' ? 1 : -1;
    
    // MongoDB 사용
    // 검색 조건 구성
    let searchQuery = {};
      if (search) {
      searchQuery = {
          $or: [
          { battletag: { $regex: search, $options: 'i' } },
            { battleTag: { $regex: search, $options: 'i' } },
            { nickname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
    // 정렬 설정
    let sortOptions = {};
        sortOptions[sortBy] = sortDirection;
    
    // 총 사용자 수 조회
    const totalUsers = await User.countDocuments(searchQuery);
    
    // 사용자 목록 조회 (민감한 정보 제외)
    const users = await User.find(searchQuery)
        .select('-accessToken -refreshToken -adminPassword')
        .sort(sortOptions)
        .skip(skip)
      .limit(limit)
      .lean();
    
    // 필드명 표준화 및 데이터 가공
    const normalizedUsers = users.map(user => {
      // battletag와 battleTag 필드 통일
      const battleTagField = user.battletag || user.battleTag || '';
      
        return {
        ...user,
        battletag: battleTagField,
        battleTag: battleTagField,
        // MMR 및 승/패 정보 표준화
        mmr: user.playerStats?.mmr || user.mmr || 1500,
        wins: user.playerStats?.wins || user.wins || 0,
        losses: user.playerStats?.losses || user.losses || 0
        };
      });
      
      const totalPages = Math.ceil(totalUsers / limit);
      
      res.json({
      users: normalizedUsers,
        totalUsers,
        totalPages,
        currentPage: page
      });
  } catch (err) {
    console.error('사용자 목록 조회 오류:', err);
    res.status(500).json({ message: '사용자 목록을 가져오는데 실패했습니다.' });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    특정 사용자 정보 가져오기
 * @access  Admin
 */
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    // 유효한 ObjectId 확인
    let userId = req.params.id;
    
    // [object Object] 문자열이 전달된 경우 처리
    if (userId === '[object Object]') {
      console.error('잘못된 사용자 ID 형식: [object Object]');
      return res.status(400).json({ message: '잘못된 사용자 ID 형식입니다.' });
    }
    
    // MongoDB에서 사용자 정보 조회
    const user = await User.findById(userId)
      .select('-accessToken -refreshToken -adminPassword')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 필드명 표준화
    const battleTagField = user.battleTag || user.battletag || '';
    
    // 표준화된 사용자 데이터 생성
    const normalizedUser = {
      ...user,
      battletag: battleTagField,
      battleTag: battleTagField,
      // MMR 및 승/패 정보 표준화 - playerStats가 아닌 직접 필드 사용
      mmr: user.mmr || 1500,
      wins: user.wins || 0,
      losses: user.losses || 0,
      previousTier: user.previousTier || 'placement',
      totalGames: (user.wins || 0) + (user.losses || 0)
    };
    
    res.json(normalizedUser);
  } catch (err) {
    console.error('사용자 정보 조회 오류:', err);
    res.status(500).json({ message: '사용자 데이터를 가져오는데 실패했습니다.' });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    사용자 정보 업데이트
 * @access  Admin
 */
router.put('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { isAdmin, adminUsername, adminPassword, ...updates } = req.body;
    
    // 업데이트할 데이터
    const updateData = { ...updates };
    
    // 관리자 권한 변경 처리
    if (typeof isAdmin === 'boolean') {
      updateData.isAdmin = isAdmin;
      console.log(`사용자 ${req.params.id}의 관리자 권한 변경: ${isAdmin} (요청값)`);
    }
    
    // 관리자 계정 정보 처리
    if (isAdmin && adminUsername) {
      updateData.adminUsername = adminUsername;
      
      // 비밀번호가 제공된 경우 해싱
      if (adminPassword) {
        const salt = await bcrypt.genSalt(10);
        updateData.adminPassword = await bcrypt.hash(adminPassword, salt);
      }
    } else if (isAdmin === false) {
      // 관리자 권한 제거 시 계정 정보도 제거
      updateData.adminUsername = undefined;
      updateData.adminPassword = undefined;
      
      // MongoDB에서 필드 제거를 위한 $unset 연산 준비
      updateData.$unset = {
        adminUsername: 1,
        adminPassword: 1
      };
    }
    
      // MongoDB 사용자 업데이트
      console.log('MongoDB 업데이트 데이터:', JSON.stringify(updateData));
      
      // 사용자 업데이트
    let user;
    
    // $unset 연산이 있는 경우 별도 처리
    if (updateData.$unset) {
      const { $unset, ...setData } = updateData;
      user = await User.findByIdAndUpdate(
        req.params.id,
        { 
          $set: setData,
          $unset: $unset
        },
        { new: true }
      ).select('-accessToken -refreshToken -adminPassword');
    } else {
      user = await User.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, 
        { new: true }
      ).select('-accessToken -refreshToken -adminPassword');
    }
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 관리자 권한 변경 후 업데이트된 사용자 정보 확인
    if (typeof isAdmin === 'boolean') {
      console.log('업데이트 후 사용자 정보:', JSON.stringify({
        id: user._id,
        battletag: user.battletag || user.battleTag,
        isAdmin: user.isAdmin,
        updateSucceeded: isAdmin === user.isAdmin ? '성공' : '실패'
      }));
    }
    
    res.json(user);
  } catch (err) {
    console.error('사용자 업데이트 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    새 사용자 생성
 * @access  Admin
 */
router.post('/users', authenticateAdmin, async (req, res) => {
  try {
    const { battleNetId, battleTag, isAdmin, adminUsername, adminPassword, ...userData } = req.body;
    
    // 필수 필드 확인
    if (!battleNetId || !battleTag) {
      return res.status(400).json({ message: '배틀넷 ID와 배틀태그는 필수 항목입니다' });
    }
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // 중복 확인
      const existingUser = await NeDBUser.findByBnetId(battleNetId);
      if (existingUser) {
        return res.status(400).json({ message: '이미 존재하는 배틀넷 ID입니다' });
      }
      
      // 새 사용자 데이터
      const newUserData = {
        bnetId: 10000000 + Math.floor(Math.random() * 1000000),
        battletag: battleTag,
        nickname: userData.nickname || battleTag.split('#')[0],
        email: userData.email || '',
        accessToken: 'dummy-token',
        isAdmin: isAdmin || false,
        mmr: Math.floor(Math.random() * 1000) + 1000,
          wins: 0,
        losses: 0
      };
      
      // 관리자 계정 정보 처리
      if (isAdmin && adminUsername) {
        newUserData.adminUsername = adminUsername;
        
        // 비밀번호 해싱
        if (adminPassword) {
          const salt = await bcrypt.genSalt(10);
          newUserData.adminPassword = await bcrypt.hash(adminPassword, salt);
        }
      }
      
      // 사용자 생성
      const newUser = await NeDBUser.create(newUserData);
      
      // 민감한 정보 제거
      const { accessToken, adminPassword: pwd, ...userInfo } = newUser;
      
      res.status(201).json(userInfo);
    } else {
      // MongoDB 사용
      // 중복 확인
      const existingUser = await User.findOne({ battleNetId });
      if (existingUser) {
        return res.status(400).json({ message: '이미 존재하는 배틀넷 ID입니다' });
      }
      
      // 새 사용자 데이터
      const newUserData = {
        bnetId: 10000000 + Math.floor(Math.random() * 1000000),
        battletag: battleTag,
        ...userData,
        accessToken: 'dummy-token', // 실제 서비스에서는 OAuth 토큰 필요
        isAdmin: isAdmin || false,
        mmr: Math.floor(Math.random() * 1000) + 1000,
        wins: 0,
        losses: 0
      };
      
      // 관리자 계정 정보 처리
      if (isAdmin && adminUsername) {
        newUserData.adminUsername = adminUsername;
        
        // 비밀번호 해싱
        if (adminPassword) {
          const salt = await bcrypt.genSalt(10);
          newUserData.adminPassword = await bcrypt.hash(adminPassword, salt);
        }
      }
      
      // 사용자 생성
      const newUser = new User(newUserData);
      await newUser.save();
      
      res.status(201).json(newUser);
    }
  } catch (err) {
    console.error('사용자 생성 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    사용자 삭제
 * @access  Admin
 */
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    let deleted = false;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      deleted = await NeDBUser.delete(req.params.id);
    } else {
      const user = await User.findByIdAndDelete(req.params.id);
      deleted = !!user;
    }
    
    if (!deleted) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    res.json({ message: '사용자가 성공적으로 삭제되었습니다' });
  } catch (err) {
    console.error('사용자 삭제 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   POST /api/admin/users/delete
 * @desc    여러 사용자 삭제
 * @access  Admin
 */
router.post('/users/delete', authenticateAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: '삭제할 사용자 ID 목록이 필요합니다' });
    }
    
    let deletedCount = 0;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // NeDB 사용 시 각 ID에 대해 개별적으로 삭제
      for (const id of userIds) {
        const deleted = await NeDBUser.delete(id);
        if (deleted) deletedCount++;
      }
    } else {
      // MongoDB 사용 시 한 번에 모두 삭제
      const result = await User.deleteMany({ _id: { $in: userIds } });
      deletedCount = result.deletedCount;
    }
    
    res.json({
      message: `${deletedCount}명의 사용자가 성공적으로 삭제되었습니다`
    });
  } catch (err) {
    console.error('다중 사용자 삭제 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   POST /api/admin/users/:id/reset-mmr
 * @desc    사용자 MMR 초기화
 * @access  Admin
 */
router.post('/users/:id/reset-mmr', authenticateAdmin, async (req, res) => {
  try {
    let user;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      user = await NeDBUser.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      }
      
      // MMR 초기화
      if (!user.playerStats) {
        user.playerStats = {
          totalGames: 0,
          wins: 0,
          losses: 0,
          mmr: 1500
        };
      } else {
        user.playerStats.mmr = 1500;
      }
      
      // 업데이트
      await NeDBUser.update(user._id, { playerStats: user.playerStats });
      
      res.json({
        message: 'MMR이 성공적으로 초기화되었습니다',
        user: {
          id: user._id,
          battletag: user.battletag || user.battleTag,
          nickname: user.nickname,
          mmr: user.playerStats.mmr
        }
      });
    } else {
      user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      }
      
      // MMR 초기화 - 직접 필드에 적용
      user.mmr = 1500;
      await user.save();
      
      res.json({
        message: 'MMR이 성공적으로 초기화되었습니다',
        user: {
          id: user._id,
          battletag: user.battletag || user.battleTag,
          nickname: user.nickname,
          mmr: user.mmr
        }
      });
    }
  } catch (err) {
    console.error('MMR 초기화 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   GET /api/admin/users/:id/matches
 * @desc    사용자의 매치 기록 조회
 * @access  Admin
 */
router.get('/users/:id/matches', authenticateAdmin, async (req, res) => {
  try {
    // 사용자 존재 확인
    const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      }
      
      // 사용자가 참여한 매치 조회
      try {
        const matches = await Match.find({
          $or: [
            { 'teams.blue.user': req.params.id },
            { 'teams.red.user': req.params.id }
          ]
      })
      .populate('createdBy', 'battleTag nickname')
      .sort({ createdAt: -1 })
      .limit(10);
        
        res.json(matches);
      } catch (matchErr) {
        console.error('매치 기록 조회 오류:', matchErr);
        res.status(500).json({ message: '사용자 매치 기록을 가져오는데 실패했습니다.' });
    }
  } catch (err) {
    console.error('사용자 매치 기록 조회 오류:', err);
    res.status(500).json({ message: '사용자 매치 기록을 가져오는데 실패했습니다.' });
  }
});

/**
 * @route   GET /api/admin/matches
 * @desc    모든 매치 목록 가져오기
 * @access  Admin
 */
router.get('/matches', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortDirection = req.query.sortDirection === 'asc' ? 1 : -1;
    const status = req.query.status || 'all';
    
    // 검색 조건 구성
      let query = {};
      if (status !== 'all') {
        query.status = status;
      }
      
      if (search) {
        query = {
          ...query,
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { map: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
      // 정렬 옵션
      const sortOptions = {};
      sortOptions[sortBy] = sortDirection;
      
      // 매치 목록 조회
      const matches = await Match.find(query)
      .populate('createdBy', 'battleTag nickname')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
      
      // 총 매치 수
      const totalMatches = await Match.countDocuments(query);
      const totalPages = Math.ceil(totalMatches / limit);
      
      res.json({
        matches,
        totalMatches,
        totalPages,
        currentPage: page
      });
  } catch (err) {
    console.error('매치 목록 조회 오류:', err);
    res.status(500).json({ message: '매치 목록을 가져오는데 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/matches/:id
 * @desc    특정 매치 정보 가져오기
 * @access  Admin
 */
router.get('/matches/:id', authenticateAdmin, async (req, res) => {
  try {
    // MongoDB에서 매치 정보 조회 - populate 문제를 피하기 위해 수정
    const match = await Match.findById(req.params.id)
      .populate('createdBy', 'battleTag battletag nickname')
      .populate('teams.blue.user', 'battleTag battletag nickname mmr')
      .populate('teams.red.user', 'battleTag battletag nickname mmr');
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    // 디버깅용 로그 - 원본 데이터 확인
    console.log('==== 매치 상세 정보 디버깅 (🔎 개선된 로그) ====');
    console.log(`매치 ID: ${match._id}`);
    console.log(`매치 데이터 필드 체크:`);
    console.log(`- 매치 제목: ${match.title}`);
    console.log(`- 매치 상태: ${match.status}`);
    console.log(`- 승자: ${match.result?.winner}`);
    console.log(`- mmrChanges 존재 여부: ${!!match.mmrChanges}`);
    console.log(`- mmrChanges 배열 여부: ${Array.isArray(match.mmrChanges)}`);
    console.log(`- mmrChanges 길이: ${Array.isArray(match.mmrChanges) ? match.mmrChanges.length : 'N/A'}`);
    console.log(`- mmrChanges 원본 데이터:`, match.mmrChanges);
    console.log(`- eventLog 존재 여부: ${!!match.eventLog}`);
    console.log(`- eventLog 배열 여부: ${Array.isArray(match.eventLog)}`);
    console.log(`- eventLog 길이: ${Array.isArray(match.eventLog) ? match.eventLog.length : 'N/A'}`);
    
    // mmrChanges가 undefined인 경우 빈 배열로 초기화
    if (!match.mmrChanges) {
      console.log('경고: mmrChanges 필드가 없습니다! 빈 배열로 초기화합니다.');
      match.mmrChanges = [];
    } else if (!Array.isArray(match.mmrChanges)) {
      console.log('경고: mmrChanges 필드가 배열이 아닙니다! 빈 배열로 초기화합니다.');
      match.mmrChanges = [];
    }
    
    // eventLog가 undefined인 경우 빈 배열로 초기화
    if (!match.eventLog) {
      console.log('경고: eventLog 필드가 없습니다! 빈 배열로 초기화합니다.');
      match.eventLog = [];
    } else if (!Array.isArray(match.eventLog)) {
      console.log('경고: eventLog 필드가 배열이 아닙니다! 빈 배열로 초기화합니다.');
      match.eventLog = [];
    }
    
    // 사용자 ID 목록 추출
    const userIds = [];
    
    // mmrChanges와 eventLog에서 사용자 ID 수집
    if (match.mmrChanges && match.mmrChanges.length > 0) {
      match.mmrChanges.forEach(change => {
        if (change.userId && typeof change.userId === 'object' && change.userId._id) {
          userIds.push(change.userId._id);
        } else if (change.userId) {
          userIds.push(change.userId);
        }
      });
    }
    
    if (match.eventLog && match.eventLog.length > 0) {
      match.eventLog.forEach(event => {
        if (event.user && typeof event.user === 'object' && event.user._id) {
          userIds.push(event.user._id);
        } else if (event.user) {
          userIds.push(event.user);
        }
      });
    }
    
    // 고유한 사용자 ID 목록 생성
    const uniqueUserIds = [...new Set(userIds.map(id => id.toString()))];
    
    // 사용자 정보 한 번에 조회
    const users = await User.find({
      _id: { $in: uniqueUserIds }
    }).select('battleTag battletag nickname').lean();
    
    // 사용자 ID를 키로 하는 매핑 생성
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    
    // 디버깅용 로그
    console.log('매치 mmrChanges 원본 (상세):', JSON.stringify(match.mmrChanges, null, 2));
    
    // matchData 객체 JSON으로 변환하고 필수 필드 초기화
    const matchData = JSON.parse(JSON.stringify(match));
    
    // 기본 필드 초기화 - undefined 체크
    if (!matchData.teams) matchData.teams = { blue: [], red: [] };
    if (!matchData.teams.blue) matchData.teams.blue = [];
    if (!matchData.teams.red) matchData.teams.red = [];
    if (!matchData.mmrChanges) matchData.mmrChanges = [];
    if (!matchData.eventLog) matchData.eventLog = [];
    if (!matchData.result) matchData.result = { winner: null };
    
    // blueTeam과 redTeam 초기화
    matchData.blueTeam = [];
    matchData.redTeam = [];
    
    // 팀 정보와 created by 정보가 문자열화되지 않도록 처리
    if (matchData.createdBy && typeof matchData.createdBy === 'object') {
      matchData.createdBy = matchData.createdBy._id.toString();
    }
    
    // 블루팀과 레드팀 정보 처리
    if (matchData.teams) {
      // 블루팀 처리
      if (matchData.teams.blue && Array.isArray(matchData.teams.blue)) {
        matchData.blueTeam = matchData.teams.blue.map(player => {
          let playerUserId = '';
          if (player.user && typeof player.user === 'object') {
            playerUserId = player.user._id.toString();
            
            // mmrChange 정보 찾기 - 더 자세한 로깅 추가
            let mmrChange = null;
            try {
              if (matchData.mmrChanges && Array.isArray(matchData.mmrChanges)) {
                console.log(`블루팀 플레이어 ${playerUserId}의 MMR 변동 검색 시작. 전체 mmrChanges 개수: ${matchData.mmrChanges.length}`);
                
                // userId 문자열 형식으로 변환하여 비교
                const mmrChangeInfo = matchData.mmrChanges.find(change => {
                  if (!change || !change.userId) return false;
                  
                  const changeUserId = typeof change.userId === 'object' 
                    ? (change.userId._id ? change.userId._id.toString() : null)
                    : change.userId.toString();
                  
                  const result = changeUserId === playerUserId;
                  if (result) {
                    console.log(`블루팀 플레이어 ${playerUserId}의 MMR 변동 정보 찾음:`, change);
                  }
                  return result;
                });
                
                if (mmrChangeInfo) {
                  mmrChange = mmrChangeInfo.change;
                  console.log(`블루팀 플레이어 ${playerUserId}의 MMR 변동: ${mmrChange} (before: ${mmrChangeInfo.before}, after: ${mmrChangeInfo.after})`);
                } else {
                  console.log(`블루팀 플레이어 ${playerUserId}의 MMR 변동 정보를 찾을 수 없습니다.`);
                }
              } else {
                console.log(`mmrChanges 배열이 없거나 배열이 아닙니다. mmrChanges:`, matchData.mmrChanges);
              }
            } catch (err) {
              console.error(`블루팀 플레이어 ${playerUserId}의 MMR 변동 정보 처리 중 오류 발생:`, err);
              mmrChange = null;
            }
            
            return {
              userId: playerUserId,
              battletag: player.user.battletag || player.user.battleTag || player.user.nickname,
              mmr: player.user.mmr || 1500,
              mmrChange: mmrChange,
              role: player.role,
              hero: player.hero,
              stats: player.stats
            };
          }
          return player;
        });
      } else {
        matchData.blueTeam = [];
      }
      
      // 레드팀 처리
      if (matchData.teams.red && Array.isArray(matchData.teams.red)) {
        matchData.redTeam = matchData.teams.red.map(player => {
          let playerUserId = '';
          if (player.user && typeof player.user === 'object') {
            playerUserId = player.user._id.toString();
            
            // mmrChange 정보 찾기 - 더 자세한 로깅 추가
            let mmrChange = null;
            try {
              if (matchData.mmrChanges && Array.isArray(matchData.mmrChanges)) {
                console.log(`레드팀 플레이어 ${playerUserId}의 MMR 변동 검색 시작. 전체 mmrChanges 개수: ${matchData.mmrChanges.length}`);
                
                // userId 문자열 형식으로 변환하여 비교
                const mmrChangeInfo = matchData.mmrChanges.find(change => {
                  if (!change || !change.userId) return false;
                  
                  const changeUserId = typeof change.userId === 'object' 
                    ? (change.userId._id ? change.userId._id.toString() : null)
                    : change.userId.toString();
                  
                  const result = changeUserId === playerUserId;
                  if (result) {
                    console.log(`레드팀 플레이어 ${playerUserId}의 MMR 변동 정보 찾음:`, change);
                  }
                  return result;
                });
                
                if (mmrChangeInfo) {
                  mmrChange = mmrChangeInfo.change;
                  console.log(`레드팀 플레이어 ${playerUserId}의 MMR 변동: ${mmrChange} (before: ${mmrChangeInfo.before}, after: ${mmrChangeInfo.after})`);
                } else {
                  console.log(`레드팀 플레이어 ${playerUserId}의 MMR 변동 정보를 찾을 수 없습니다.`);
                }
              } else {
                console.log(`mmrChanges 배열이 없거나 배열이 아닙니다. mmrChanges:`, matchData.mmrChanges);
              }
            } catch (err) {
              console.error(`레드팀 플레이어 ${playerUserId}의 MMR 변동 정보 처리 중 오류 발생:`, err);
              mmrChange = null;
            }
            
            return {
              userId: playerUserId,
              battletag: player.user.battletag || player.user.battleTag || player.user.nickname,
              mmr: player.user.mmr || 1500,
              mmrChange: mmrChange,
              role: player.role,
              hero: player.hero,
              stats: player.stats
            };
          }
          return player;
        });
      } else {
        matchData.redTeam = [];
      }
    }
    
    // 평균 MMR 계산
    matchData.blueTeamAvgMmr = matchData.blueTeam && matchData.blueTeam.length > 0
      ? Math.round(matchData.blueTeam.reduce((sum, player) => sum + (player.mmr || 1500), 0) / matchData.blueTeam.length)
      : 0;
      
    matchData.redTeamAvgMmr = matchData.redTeam && matchData.redTeam.length > 0
      ? Math.round(matchData.redTeam.reduce((sum, player) => sum + (player.mmr || 1500), 0) / matchData.redTeam.length)
      : 0;
      
    // mmrChanges 정보 처리 - userMap 사용하여 처리
    try {
    if (matchData.mmrChanges && Array.isArray(matchData.mmrChanges)) {
        matchData.mmrChanges = matchData.mmrChanges.filter(change => change !== null && change !== undefined)
          .map(change => {
          try {
        // 사용자 정보 처리
        let userId = change.userId;
        let battletag = change.battletag || '알 수 없음';
        
        // userId가 객체인 경우
        if (userId && typeof userId === 'object') {
          battletag = userId.battletag || userId.battleTag || userId.nickname || battletag;
              userId = userId._id ? userId._id.toString() : null;
        } else if (userId) {
          // userMap에서 사용자 정보 찾기
          const userInfo = userMap[userId.toString()];
          if (userInfo) {
            battletag = userInfo.battletag || userInfo.battleTag || userInfo.nickname || battletag;
          }
          userId = userId.toString();
        }
        
        return {
              userId: userId || null,
          battletag,
          before: change.before || change.oldMmr || 0, // oldMmr도 체크
          after: change.after || change.newMmr || 0,   // newMmr도 체크
          change: change.change || 0
        };
          } catch (mapErr) {
            console.error('mmrChange 항목 매핑 중 오류:', mapErr);
            return {
              userId: null,
              battletag: '오류',
              before: 0,
              after: 0,
              change: 0
            };
          }
      });
      
      // 디버깅용 출력
      console.log('변환된 mmrChanges:', JSON.stringify(matchData.mmrChanges, null, 2));
    } else {
        console.log('유효한 mmrChanges 배열이 없어 빈 배열로 초기화합니다.');
        matchData.mmrChanges = [];
      }
    } catch (mmrErr) {
      console.error('mmrChanges 데이터 처리 중 오류 발생:', mmrErr);
      matchData.mmrChanges = [];
    }
    
    // eventLog 정보 처리 - userMap 사용하여 처리
    try {
    if (matchData.eventLog && Array.isArray(matchData.eventLog)) {
        matchData.eventLog = matchData.eventLog.filter(event => event !== null && event !== undefined)
          .map(event => {
          try {
        // 사용자 정보 처리
        let userId = event.user;
        let username = '시스템';
        
        // user가 객체인 경우
        if (userId && typeof userId === 'object') {
          username = userId.battletag || userId.battleTag || userId.nickname || username;
              userId = userId._id ? userId._id.toString() : null;
        } else if (userId) {
          // userMap에서 사용자 정보 찾기
          const userInfo = userMap[userId.toString()];
          if (userInfo) {
            username = userInfo.battletag || userInfo.battleTag || userInfo.nickname || username;
          }
          userId = userId.toString();
        }
        
        return {
          type: event.type || '메시지',
          description: event.description || '',
          timestamp: event.timestamp || new Date(),
              user: userId || null,
          username
        };
          } catch (mapErr) {
            console.error('eventLog 항목 매핑 중 오류:', mapErr);
            return {
              type: '메시지',
              description: '데이터 처리 오류',
              timestamp: new Date(),
              user: null,
              username: '시스템'
            };
          }
      });
      
      // 시간 순서대로 정렬
      matchData.eventLog.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // 디버깅용 출력
      console.log('변환된 eventLog:', JSON.stringify(matchData.eventLog, null, 2));
    } else {
        console.log('유효한 eventLog 배열이 없어 빈 배열로 초기화합니다.');
        matchData.eventLog = [];
      }
    } catch (eventErr) {
      console.error('eventLog 데이터 처리 중 오류 발생:', eventErr);
      matchData.eventLog = [];
    }
    
    // result.winner 정보 처리
    if (matchData.result) {
      matchData.winner = matchData.result.winner;
    }
    
    // 최종 디버깅 - undefined 체크 추가
    console.log('클라이언트로 보내는 최종 데이터:', JSON.stringify({
      mmrChanges: matchData.mmrChanges ? matchData.mmrChanges.length : 0, 
      eventLog: matchData.eventLog ? matchData.eventLog.length : 0,
      mmrChanges데이터: matchData.mmrChanges && matchData.mmrChanges.length > 0 ? matchData.mmrChanges.slice(0, 2) : [] // 첫 2개 항목만 표시
    }, null, 2));
    
    // 최종 안전 검사 - 데이터가 없는 경우 빈 배열 초기화
    if (!matchData.mmrChanges) matchData.mmrChanges = [];
    if (!matchData.eventLog) matchData.eventLog = [];
    
    res.json(matchData);
  } catch (err) {
    console.error('매치 정보 조회 오류:', err);
    res.status(500).json({ message: '매치 정보를 가져오는데 실패했습니다' });
  }
});

/**
 * @route   GET /api/admin/users/:id/logs
 * @desc    특정 사용자의 로그 가져오기
 * @access  Admin
 */
router.get('/users/:id/logs', authenticateAdmin, async (req, res) => {
  try {
    // 유효한 ObjectId 확인
    let userId = req.params.id;
    
    // [object Object] 문자열이 전달된 경우 처리
    if (userId === '[object Object]') {
      console.error('잘못된 사용자 ID 형식: [object Object]');
      return res.status(400).json({ message: '잘못된 사용자 ID 형식입니다.' });
    }
    
    // 사용자 확인
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // MongoDB에서 로그 가져오기
    const logs = await UserLog.findByUserId(userId, 50);
    
    res.json(logs);
  } catch (err) {
    console.error('사용자 로그 조회 오류:', err);
    res.status(500).json({ message: '사용자 로그를 가져오는데 실패했습니다.' });
  }
});

/**
 * @route   POST /api/admin/create-test-accounts
 * @desc    테스트 계정을 여러 개 생성
 * @access  Admin
 */
router.post('/create-test-accounts', authenticateAdmin, async (req, res) => {
  try {
    const { count = 10 } = req.body; // 기본값은 10개 계정
    const createdAccounts = [];
    
    // 유효한 역할 목록 (MongoUser.js에 정의된 값)
    const roles = ['원거리 암살자', '근접 암살자', '전사', '서포터', '특수병', '탱커', '힐러'];
    
    // 히어로즈 오브 더 스톰 영웅 목록
    const heroes = [
      // 탱커
      'Anubarak', 'Arthas', 'Blaze', 'Cho', 'Diablo', 'ETC', 'Garrosh', 'Johanna', 'Mal\'Ganis', 'Muradin', 'Stitches', 'Tyrael',
      // 근접 암살자
      'Alarak', 'Butcher', 'Gazlowe', 'Illidan', 'Imperius', 'Kerrigan', 'Maiev', 'Malthael', 'Murky', 'Qhira', 'Samuro', 'Valeera', 'Zeratul',
      // 원거리 암살자
      'Azmodan', 'Cassia', 'Chromie', 'Falstad', 'Fenix', 'Gall', 'Genji', 'Greymane', 'Gul\'dan', 'Hanzo', 'Jaina', 'Junkrat', 'Kael\'thas',
      'Kel\'Thuzad', 'Li-Ming', 'Lunara', 'Mephisto', 'Nazeebo', 'Nova', 'Orphea', 'Probius', 'Raynor', 'Sgt. Hammer', 'Sylvanas', 'Tracer',
      'Tychus', 'Valla', 'Zagara', 'Zul\'jin',
      // 치유사
      'Alexstrasza', 'Ana', 'Anduin', 'Auriel', 'Brightwing', 'Deckard', 'Kharazim', 'Li Li', 'Lt. Morales', 'Lucio', 'Malfurion',
      'Rehgar', 'Stukov', 'Uther', 'Whitemane',
      // 지원가
      'Abathur', 'Medivh', 'Tassadar', 'The Lost Vikings', 'Zarya'
    ];
    
    // 테스트 계정 생성
    for (let i = 0; i < count; i++) {
      // 랜덤 MMR 생성 (1000~3000)
      const mmr = Math.floor(Math.random() * 2000) + 1000;
      
      // MMR에 따른 승/패 생성 (MMR이 높을수록 승률이 높음)
      const totalGames = Math.floor(Math.random() * 100) + 50; // 50~150판
      let winRate;
      
      if (mmr < 1500) {
        winRate = 0.3 + (mmr - 1000) / 1500 * 0.2; // 30%~50%
      } else if (mmr < 2000) {
        winRate = 0.5 + (mmr - 1500) / 500 * 0.15; // 50%~65%
      } else if (mmr < 2500) {
        winRate = 0.65 + (mmr - 2000) / 500 * 0.1; // 65%~75%
      } else {
        winRate = 0.75 + (mmr - 2500) / 500 * 0.1; // 75%~85%
      }
      
      const wins = Math.floor(totalGames * winRate);
      const losses = totalGames - wins;
      
      // 랜덤 역할 선택 (유효한 역할만 선택)
      const preferredRoles = [];
      const numRoles = Math.floor(Math.random() * 3) + 1; // 1~3개 역할
      
      for (let j = 0; j < numRoles; j++) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        if (!preferredRoles.includes(role)) {
          preferredRoles.push(role);
        }
      }
      
      // 선호 영웅 목록도 생성
      const favoriteHeroes = [];
      const numHeroes = Math.floor(Math.random() * 5) + 1; // 1~5개 영웅
      
      for (let j = 0; j < numHeroes; j++) {
        const hero = heroes[Math.floor(Math.random() * heroes.length)];
        if (!favoriteHeroes.includes(hero)) {
          favoriteHeroes.push(hero);
        }
      }
      
      // 계정 생성
      const nickname = `TestUser${i + 1}`;
      const battleTag = `${nickname}#${Math.floor(1000 + Math.random() * 9000)}`;
      const email = `testuser${i + 1}@example.com`;
      
      // 사용자 데이터 생성
      const userData = {
        bnetId: `test-${Date.now()}-${i}`,
        battletag: battleTag,
        nickname,
        email,
        isProfileComplete: true,
        preferredRoles,
        mmr: mmr,
        wins: wins,
        losses: losses
      };
      
      // MongoDB에 저장
      const newUser = new User(userData);
      await newUser.save();
      createdAccounts.push(newUser);
    }
    
    res.status(201).json({
      message: `${count}개의 테스트 계정이 성공적으로 생성되었습니다.`,
      accounts: createdAccounts.map(user => ({
        id: user._id,
        battletag: user.battletag,
        mmr: user.mmr,
        wins: user.wins,
        losses: user.losses
      }))
    });
  } catch (err) {
    console.error('테스트 계정 생성 오류:', err);
    res.status(500).json({ 
      message: '테스트 계정 생성 중 오류가 발생했습니다.',
      error: err.message 
    });
  }
});

/**
 * @route   POST /api/admin/create-test-matches
 * @desc    테스트 매치를 여러 개 생성
 * @access  Admin
 */
router.post('/create-test-matches', authenticateAdmin, async (req, res) => {
  try {
    const { count = 5 } = req.body; // 기본값은 5개 매치
    const createdMatches = [];
    
    // 전장 목록
    const maps = [
      'Alterac Pass', 'Battlefield of Eternity', 'Blackheart\'s Bay', 'Braxis Holdout',
      'Cursed Hollow', 'Dragon Shire', 'Garden of Terror', 'Hanamura Temple',
      'Infernal Shrines', 'Sky Temple', 'Tomb of the Spider Queen', 'Towers of Doom',
      'Volskaya Foundry', 'Warhead Junction'
    ];
    
    // 히어로즈 오브 더 스톰 역할 목록 (MongoUser.js에 정의된 값)
    const roles = ['원거리 암살자', '근접 암살자', '전사', '서포터', '특수병', '탱커', '힐러'];
    
    // 히어로즈 오브 더 스톰 영웅 목록 (역할별)
    const heroesByRole = {
      '탱커': ['Anubarak', 'Arthas', 'Blaze', 'Diablo', 'ETC', 'Garrosh', 'Johanna', 'Mal\'Ganis', 'Muradin', 'Stitches'],
      '힐러': ['Alexstrasza', 'Ana', 'Anduin', 'Auriel', 'Brightwing', 'Deckard', 'Kharazim', 'Li Li', 'Lt. Morales', 'Lucio', 'Malfurion', 'Rehgar', 'Stukov', 'Uther', 'Whitemane'],
      '원거리 암살자': ['Chromie', 'Falstad', 'Fenix', 'Genji', 'Gul\'dan', 'Hanzo', 'Jaina', 'Junkrat', 'Kael\'thas', 'Li-Ming', 'Lunara', 'Nova', 'Orphea', 'Raynor', 'Sylvanas', 'Tracer', 'Tychus', 'Valla', 'Zagara', 'Zul\'jin'],
      '근접 암살자': ['Alarak', 'Butcher', 'Illidan', 'Kerrigan', 'Maiev', 'Malthael', 'Murky', 'Qhira', 'Samuro', 'Valeera', 'Zeratul'],
      '전사': ['Artanis', 'Chen', 'D.Va', 'Deathwing', 'Dehaka', 'Leoric', 'Sonya', 'Thrall', 'Xul', 'Yrel'],
      '서포터': ['Abathur', 'Medivh', 'Tassadar', 'Zarya'],
      '특수병': ['The Lost Vikings', 'Cho', 'Gall', 'Greymane', 'Probius']
    };
    
    // 모든 사용자 가져오기
    const users = await User.find({}).lean();
    
    if (users.length < 10) {
      return res.status(400).json({ 
        message: '매치를 생성하기 위해 최소 10명의 사용자가 필요합니다. 먼저 테스트 계정을 생성해주세요.'
      });
    }
    
    const adminUser = req.user;
    
    // 테스트 매치 생성
    for (let i = 0; i < count; i++) {
      // 무작위로 사용자 10명 선택 (중복 없이)
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const selectedUsers = shuffledUsers.slice(0, 10);
      
      // 무작위로 전장 선택
      const map = maps[Math.floor(Math.random() * maps.length)];
      
      // 블루팀과 레드팀으로 나누기 (MMR 기준으로 분배하여 밸런스 맞추기)
      selectedUsers.sort((a, b) => (b.mmr || 1500) - (a.mmr || 1500));
      
      const teamPlayers = [
        selectedUsers[0], selectedUsers[2], selectedUsers[4], selectedUsers[6], selectedUsers[8], // 블루팀
        selectedUsers[1], selectedUsers[3], selectedUsers[5], selectedUsers[7], selectedUsers[9]  // 레드팀
      ];
      
      // 팀 구성
      const blueTeam = [];
      const redTeam = [];
      
      // 팀별 역할 분배 (각 팀에 탱커, 힐러, 딜러 등 역할 배분)
      const assignedRoles = {
        blue: [],
        red: []
      };
      
      // 필수 역할 보장 (각 팀당 탱커 1명, 힐러 1명)
      const essentialRoles = ['탱커', '힐러'];
      
      for (let j = 0; j < 5; j++) {
        const bluePlayer = teamPlayers[j];
        const redPlayer = teamPlayers[j + 5];
        
        // 블루팀 역할 할당
        let blueRole;
        if (j < essentialRoles.length) {
          blueRole = essentialRoles[j];
        } else {
          // 남은 역할은 공격 역할로 설정
          const dpsRoles = ['원거리 암살자', '근접 암살자', '전사'];
          blueRole = dpsRoles[Math.floor(Math.random() * dpsRoles.length)];
        }
        assignedRoles.blue.push(blueRole);
        
        // 레드팀 역할 할당
        let redRole;
        if (j < essentialRoles.length) {
          redRole = essentialRoles[j];
        } else {
          // 남은 역할은 공격 역할로 설정
          const dpsRoles = ['원거리 암살자', '근접 암살자', '전사'];
          redRole = dpsRoles[Math.floor(Math.random() * dpsRoles.length)];
        }
        assignedRoles.red.push(redRole);
        
        // 역할에 맞는 영웅 선택
        const blueHero = heroesByRole[blueRole][Math.floor(Math.random() * heroesByRole[blueRole].length)];
        const redHero = heroesByRole[redRole][Math.floor(Math.random() * heroesByRole[redRole].length)];
        
        // 팀에 추가
        blueTeam.push({
          user: bluePlayer._id,
          role: blueRole,
          hero: blueHero,
          stats: {
            kills: Math.floor(Math.random() * 10),
            deaths: Math.floor(Math.random() * 8),
            assists: Math.floor(Math.random() * 20)
          }
        });
        
        redTeam.push({
          user: redPlayer._id,
          role: redRole,
          hero: redHero,
          stats: {
            kills: Math.floor(Math.random() * 10),
            deaths: Math.floor(Math.random() * 8),
            assists: Math.floor(Math.random() * 20)
          }
        });
      }
      
      // 무작위로 승자 결정
      const winner = Math.random() > 0.5 ? 'blue' : 'red';
      
      // MMR 변화 계산
      const blueTeamAvgMmr = blueTeam.reduce((sum, player) => {
        const user = users.find(u => u._id.toString() === player.user.toString());
        return sum + (user?.mmr || 1500);
      }, 0) / 5;
      
      const redTeamAvgMmr = redTeam.reduce((sum, player) => {
        const user = users.find(u => u._id.toString() === player.user.toString());
        return sum + (user?.mmr || 1500);
      }, 0) / 5;
      
      // 경기 결과에 따른 MMR 변화 계산
      const mmrChanges = [];
      
      // K-팩터 (MMR 변화량 가중치)
      const K_FACTOR = 32;
      
      // 기대 승률 계산
      const getExpectedWinRate = (teamMmr, opponentMmr) => {
        return 1 / (1 + Math.pow(10, (opponentMmr - teamMmr) / 400));
      };
      
      // 블루팀 MMR 변화
      const blueTeamExpected = getExpectedWinRate(blueTeamAvgMmr, redTeamAvgMmr);
      const blueTeamActual = winner === 'blue' ? 1 : 0;
      const blueMmrChange = Math.round(K_FACTOR * (blueTeamActual - blueTeamExpected));
      
      // 레드팀 MMR 변화
      const redTeamExpected = getExpectedWinRate(redTeamAvgMmr, blueTeamAvgMmr);
      const redTeamActual = winner === 'red' ? 1 : 0;
      const redMmrChange = Math.round(K_FACTOR * (redTeamActual - redTeamExpected));
      
      // MMR 변화 기록
      for (const player of blueTeam) {
        const user = users.find(u => u._id.toString() === player.user.toString());
        const oldMmr = user?.mmr || 1500;
        const newMmr = oldMmr + blueMmrChange;
        
        mmrChanges.push({
          userId: player.user,
          before: oldMmr,
          after: newMmr,
          change: blueMmrChange,
          battletag: user?.battletag || user?.battleTag || '알 수 없음'
        });
      }
      
      for (const player of redTeam) {
        const user = users.find(u => u._id.toString() === player.user.toString());
        const oldMmr = user?.mmr || 1500;
        const newMmr = oldMmr + redMmrChange;
        
        mmrChanges.push({
          userId: player.user,
          before: oldMmr,
          after: newMmr,
          change: redMmrChange,
          battletag: user?.battletag || user?.battleTag || '알 수 없음'
        });
      }
      
      // 이벤트 로그 생성
      const eventLog = [
        {
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
          type: '매치_생성',
          details: '매치가 생성되었습니다'
        },
        {
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 1800000)),
          type: '매치_시작',
          details: '매치가 시작되었습니다'
        }
      ];
      
      // 킬 이벤트 로그 추가
      const matchDuration = Math.floor(Math.random() * 20) + 10; // 10~30분
      
      for (let min = 1; min <= matchDuration; min++) {
        // 각 분마다 0~2개의 킬 이벤트 생성
        const killEvents = Math.floor(Math.random() * 3);
        
        for (let k = 0; k < killEvents; k++) {
          const killerTeam = Math.random() > 0.5 ? blueTeam : redTeam;
          const victimTeam = killerTeam === blueTeam ? redTeam : blueTeam;
          
          const killer = killerTeam[Math.floor(Math.random() * 5)];
          const victim = victimTeam[Math.floor(Math.random() * 5)];
          
          eventLog.push({
            timestamp: new Date(Date.now() - Math.floor((matchDuration - min) * 60000) - Math.floor(Math.random() * 60000)),
            type: '메시지',
            details: `${killer.hero}가 ${victim.hero}를 처치했습니다`,
            user: killer.user
          });
        }
      }
      
      // 매치 종료 이벤트
      eventLog.push({
        timestamp: new Date(),
        type: '매치_종료',
        details: `${winner === 'blue' ? '블루팀' : '레드팀'}이 승리했습니다`,
        user: adminUser._id
      });
      
      // 매치 데이터 생성
      const matchData = {
        title: `테스트 매치 #${i + 1}`,
        description: `자동 생성된 테스트 매치입니다.`,
        map,
        teams: {
          blue: blueTeam,
          red: redTeam
        },
        result: {
          winner,
          duration: matchDuration * 60 // 초 단위
        },
        status: 'completed',
        winner: winner,
        createdBy: adminUser._id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // 최근 24시간 내
        mmrChanges: [],
        eventLog: []
      };
      
      // mmrChanges 배열에 데이터 추가
      mmrChanges.forEach(change => {
        matchData.mmrChanges.push({
          userId: change.userId,
          before: change.before,
          after: change.after,
          change: change.change,
          battletag: change.battletag
        });
      });
      
      // eventLog 배열에 데이터 추가
      eventLog.forEach(event => {
        matchData.eventLog.push({
          type: event.type,
          description: event.details || event.description,
          timestamp: event.timestamp,
          user: event.user
        });
      });
      
      // 매치 데이터 디버깅 출력
      console.log(`테스트 매치 #${i+1} 생성 정보:`);
      console.log(`- mmrChanges 항목 수: ${matchData.mmrChanges.length}`);
      console.log(`- eventLog 항목 수: ${matchData.eventLog.length}`);
      console.log(`- mmrChanges 샘플(첫 항목): ${JSON.stringify(matchData.mmrChanges[0])}`);
      console.log(`- eventLog 샘플(첫 항목): ${JSON.stringify(matchData.eventLog[0])}`);
      
      // MongoDB에 저장
      const newMatch = new Match(matchData);
      
      try {
        // 저장 전 데이터 검증
        console.log(`저장 전 확인 - mmrChanges 길이: ${newMatch.mmrChanges.length}, eventLog 길이: ${newMatch.eventLog.length}`);
        
        // 저장
      await newMatch.save();
      
      // 저장된 데이터 확인 (저장 후 데이터베이스에서 다시 조회)
        const savedMatch = await Match.findById(newMatch._id).lean();
      console.log(`매치 #${i+1} 저장 확인:`);
      console.log(`- 상태: ${savedMatch.status}, 승자: ${savedMatch.result?.winner}`);
      console.log(`- 저장된 이벤트 로그 항목: ${savedMatch.eventLog?.length || 0}`);
      console.log(`- 저장된 MMR 변화 항목: ${savedMatch.mmrChanges?.length || 0}`);
      
      // mmrChanges나 eventLog가 저장되지 않았다면 직접 업데이트
      if (!savedMatch.mmrChanges || savedMatch.mmrChanges.length === 0 || !savedMatch.eventLog || savedMatch.eventLog.length === 0) {
        console.log(`경고: 매치 #${i+1}의 데이터가 제대로 저장되지 않았습니다. 직접 업데이트합니다.`);
        
          // MongoDB의 $set 연산자로 전체 배열 업데이트
        const updateObj = {};
        
        if (!savedMatch.mmrChanges || savedMatch.mmrChanges.length === 0) {
            console.log(`mmrChanges 배열 직접 업데이트 (${matchData.mmrChanges.length}개 항목)`);
            // matchData에서 이미 변환된 배열 사용
            updateObj.mmrChanges = matchData.mmrChanges;
        }
        
        if (!savedMatch.eventLog || savedMatch.eventLog.length === 0) {
            console.log(`eventLog 배열 직접 업데이트 (${matchData.eventLog.length}개 항목)`);
            // matchData에서 이미 변환된 배열 사용
            updateObj.eventLog = matchData.eventLog;
        }
        
        // 직접 업데이트 실행
        if (Object.keys(updateObj).length > 0) {
            const updateResult = await Match.updateOne(
              { _id: savedMatch._id },
              { $set: updateObj }
            );
            console.log(`매치 #${i+1} 직접 업데이트 결과:`, updateResult);
        }
        }
      } catch (saveErr) {
        console.error(`매치 #${i+1} 저장 중 오류 발생:`, saveErr);
      }
      
      // 사용자 MMR 및 승/패 업데이트
      for (const change of mmrChanges) {
        const user = await User.findById(change.userId);
        
        if (user) {
          // MMR 업데이트
          user.mmr = change.after;
          
          // 승/패 업데이트
          if (
            (winner === 'blue' && blueTeam.some(p => p.user.toString() === user._id.toString())) ||
            (winner === 'red' && redTeam.some(p => p.user.toString() === user._id.toString()))
          ) {
            user.wins += 1;
          } else {
            user.losses += 1;
          }
          
          await user.save();
        }
      }
      
      createdMatches.push(newMatch);
    }
    
    res.status(201).json({
      message: `${count}개의 테스트 매치가 성공적으로 생성되었습니다.`,
      matches: createdMatches.map(match => ({
        id: match._id,
        title: match.title,
        map: match.map,
        winner: match.result.winner,
        createdAt: match.createdAt
      }))
    });
  } catch (err) {
    console.error('테스트 매치 생성 오류:', err);
    res.status(500).json({ 
      message: '테스트 매치 생성 중 오류가 발생했습니다.', 
      error: err.message 
    });
  }
});

/**
 * @route   DELETE /api/admin/delete-all-matches
 * @desc    모든 매치 데이터 삭제
 * @access  Admin
 */
router.delete('/delete-all-matches', authenticateAdmin, async (req, res) => {
  try {
    // MongoDB 매치 데이터 삭제
    const result = await Match.deleteMany({});
    
    res.json({
      message: `${result.deletedCount}개의 매치 데이터가 성공적으로 삭제되었습니다.`
    });
  } catch (err) {
    console.error('매치 데이터 삭제 오류:', err);
    res.status(500).json({ message: '매치 데이터 삭제 중 오류가 발생했습니다.' });
  }
});

/**
 * @route   DELETE /api/admin/delete-all-users
 * @desc    관리자를 제외한, 모든 사용자 데이터 삭제
 * @access  Admin
 */
router.delete('/delete-all-users', authenticateAdmin, async (req, res) => {
  try {
    // 관리자를 제외한 모든 사용자 삭제
    const result = await User.deleteMany({ isAdmin: { $ne: true } });
    
    res.json({
      message: `${result.deletedCount}명의 사용자 데이터가 성공적으로 삭제되었습니다.`
    });
  } catch (err) {
    console.error('사용자 데이터 삭제 오류:', err);
    res.status(500).json({ message: '사용자 데이터 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 