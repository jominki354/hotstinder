const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const NeDBUser = require('../models/NeDBUser');
const Match = require('../models/match.model');
const NeDBMatch = require('../models/NeDBMatch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    
    // 사용자 정보 조회 (데이터베이스 유형에 따라 다르게 처리)
    let user;
    if (global.useNeDB) {
      user = await NeDBUser.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
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
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // NeDB 사용 시
      let allUsers = await NeDBUser.findAll();
      
      // 검색 필터링
      if (search) {
        const searchLower = search.toLowerCase();
        allUsers = allUsers.filter(user => 
          (user.battleTag && user.battleTag.toLowerCase().includes(searchLower)) ||
          (user.battletag && user.battletag.toLowerCase().includes(searchLower)) ||
          (user.nickname && user.nickname.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      
      // 총 사용자 수
      const totalUsers = allUsers.length;
      
      // 정렬 필드 매핑 (NeDB와 MongoDB 간의 필드명 차이 처리)
      let sortField = sortBy;
      if (sortBy === 'battleTag') sortField = 'battletag';
      if (sortBy === 'mmr' && !allUsers[0]?.mmr) sortField = 'playerStats.mmr';
      
      // 정렬
      allUsers.sort((a, b) => {
        let aValue, bValue;
        
        // 중첩 필드 처리 (playerStats.mmr 등)
        if (sortField.includes('.')) {
          const [obj, field] = sortField.split('.');
          aValue = a[obj] ? a[obj][field] : '';
          bValue = b[obj] ? b[obj][field] : '';
        } else {
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
        }
        
        if (aValue < bValue) return sortDirection === 1 ? -1 : 1;
        if (aValue > bValue) return sortDirection === 1 ? 1 : -1;
        return 0;
      });
      
      // 페이지네이션
      const paginatedUsers = allUsers.slice(skip, skip + limit);
      
      // 민감한 정보 제거 및 필드명 표준화
      const users = paginatedUsers.map(user => {
        // eslint-disable-next-line no-unused-vars
        const { accessToken, refreshToken, adminPassword, ...userInfo } = user;
        
        // 필드명 표준화
        return {
          ...userInfo,
          // battletag와 battleTag 필드 통일
          battletag: userInfo.battletag || userInfo.battleTag,
          // MMR 및 승/패 정보 표준화
          mmr: userInfo.playerStats?.mmr || userInfo.mmr || 1500,
          wins: userInfo.playerStats?.wins || userInfo.wins || 0,
          losses: userInfo.playerStats?.losses || userInfo.losses || 0
        };
      });
      
      const totalPages = Math.ceil(totalUsers / limit);
      
      res.json({
        users,
        totalUsers,
        totalPages,
        currentPage: page
      });
    } else {
      // MongoDB 사용 시
      // 검색 조건
      let query = {};
      if (search) {
        query = {
          $or: [
            { battleTag: { $regex: search, $options: 'i' } },
            { nickname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        };
      }
      
      // 정렬 옵션
      const sortOptions = {};
      if (sortBy === 'mmr') {
        sortOptions['playerStats.mmr'] = sortDirection;
      } else if (sortBy === 'wins') {
        sortOptions['playerStats.wins'] = sortDirection;
      } else if (sortBy === 'losses') {
        sortOptions['playerStats.losses'] = sortDirection;
      } else {
        sortOptions[sortBy] = sortDirection;
      }
      
      // 사용자 목록 조회
      const users = await User.find(query)
        .select('-accessToken -refreshToken -adminPassword')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
      
      // 표준화된 사용자 데이터 생성
      const formattedUsers = users.map(user => {
        const userData = user.toObject();
        return {
          ...userData,
          battletag: userData.battleTag,
          mmr: userData.playerStats?.mmr || 1500,
          wins: userData.playerStats?.wins || 0,
          losses: userData.playerStats?.losses || 0
        };
      });
      
      // 총 사용자 수
      const totalUsers = await User.countDocuments(query);
      const totalPages = Math.ceil(totalUsers / limit);
      
      res.json({
        users: formattedUsers,
        totalUsers,
        totalPages,
        currentPage: page
      });
    }
  } catch (err) {
    console.error('사용자 목록 조회 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    특정 사용자 정보 가져오기
 * @access  Admin
 */
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    let user;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      user = await NeDBUser.findById(req.params.id);
      
      if (user) {
        // 민감한 정보 제거
        const { accessToken, refreshToken, adminPassword, ...userInfo } = user;
        
        // 필드명 표준화
        user = {
          ...userInfo,
          // battletag와 battleTag 필드 통일
          battletag: userInfo.battletag || userInfo.battleTag,
          battleTag: userInfo.battletag || userInfo.battleTag,
          // MMR 및 승/패 정보 표준화
          playerStats: userInfo.playerStats || {
            mmr: userInfo.mmr || 1500,
            wins: userInfo.wins || 0,
            losses: userInfo.losses || 0,
            totalGames: (userInfo.wins || 0) + (userInfo.losses || 0)
          }
        };
      }
    } else {
      user = await User.findById(req.params.id)
        .select('-accessToken -refreshToken -adminPassword');
      
      if (user) {
        // 표준화된 사용자 데이터 생성
        const userData = user.toObject();
        user = {
          ...userData,
          battletag: userData.battleTag
        };
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    res.json(user);
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
    }
    
    let user;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      user = await NeDBUser.update(req.params.id, updateData);
      
      if (user) {
        // 민감한 정보 제거
        const { accessToken, refreshToken, adminPassword, ...userInfo } = user;
        user = userInfo;
      }
    } else {
      // 사용자 업데이트
      user = await User.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, 
        { new: true }
      ).select('-accessToken -refreshToken -adminPassword');
    }
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
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
        bnetId: battleNetId,
        battletag: battleTag,
        nickname: userData.nickname || battleTag.split('#')[0],
        email: userData.email || '',
        accessToken: 'dummy-token',
        isAdmin: isAdmin || false,
        playerStats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          mmr: 1500
        }
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
        battleNetId,
        battleTag,
        ...userData,
        accessToken: 'dummy-token', // 실제 서비스에서는 OAuth 토큰 필요
        isAdmin: isAdmin || false
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
      
      // MMR 초기화
      user.playerStats.mmr = 1500;
      await user.save();
      
      res.json({
        message: 'MMR이 성공적으로 초기화되었습니다',
        user: {
          id: user._id,
          battletag: user.battleTag,
          nickname: user.nickname,
          mmr: user.playerStats.mmr
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
    let user;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      user = await NeDBUser.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      }
      
      // NeDBMatch 모델을 사용하여 사용자의 매치 기록 조회
      try {
        const matches = await NeDBMatch.findByPlayer(req.params.id);
        res.json(matches || []);
      } catch (matchErr) {
        console.error('매치 기록 조회 오류:', matchErr);
        res.json([]);
      }
    } else {
      user = await User.findById(req.params.id);
      
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
        }).sort({ createdAt: -1 }).limit(10);
        
        res.json(matches);
      } catch (matchErr) {
        console.error('매치 기록 조회 오류:', matchErr);
        res.status(500).json({ message: '사용자 매치 기록을 가져오는데 실패했습니다.' });
      }
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
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // NeDB 사용 시
      let allMatches = await NeDBMatch.findAll();
      
      // 상태 필터링
      if (status !== 'all') {
        allMatches = allMatches.filter(match => match.status === status);
      }
      
      // 검색 필터링
      if (search) {
        const searchLower = search.toLowerCase();
        allMatches = allMatches.filter(match => 
          (match.title && match.title.toLowerCase().includes(searchLower)) ||
          (match.description && match.description.toLowerCase().includes(searchLower)) ||
          (match.map && match.map.toLowerCase().includes(searchLower))
        );
      }
      
      // 총 매치 수
      const totalMatches = allMatches.length;
      
      // 정렬
      allMatches.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // 중첩 필드 처리
        if (sortBy.includes('.')) {
          const [obj, field] = sortBy.split('.');
          aValue = a[obj] ? a[obj][field] : '';
          bValue = b[obj] ? b[obj][field] : '';
        }
        
        // 날짜 비교
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 1 ? aValue - bValue : bValue - aValue;
        }
        
        // 문자열 또는 기타 값 비교
        if (aValue < bValue) return sortDirection === 1 ? -1 : 1;
        if (aValue > bValue) return sortDirection === 1 ? 1 : -1;
        return 0;
      });
      
      // 페이지네이션
      const paginatedMatches = allMatches.slice(skip, skip + limit);
      
      // 생성자 정보 추가
      const matchesWithCreatorInfo = [];
      for (const match of paginatedMatches) {
        let creatorInfo = null;
        if (match.creator) {
          creatorInfo = await NeDBUser.findById(match.creator);
        }
        
        matchesWithCreatorInfo.push({
          ...match,
          creator: creatorInfo ? {
            _id: creatorInfo._id,
            battletag: creatorInfo.battletag || creatorInfo.battleTag,
            nickname: creatorInfo.nickname
          } : null
        });
      }
      
      const totalPages = Math.ceil(totalMatches / limit);
      
      res.json({
        matches: matchesWithCreatorInfo,
        totalMatches,
        totalPages,
        currentPage: page
      });
    } else {
      // MongoDB 사용 시
      // 검색 조건
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
        .populate('creator', 'battleTag nickname')
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
    }
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
    let match;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      match = await NeDBMatch.findById(req.params.id);
      
      if (match) {
        // 생성자 정보 추가
        let creatorInfo = null;
        if (match.creator) {
          creatorInfo = await NeDBUser.findById(match.creator);
        }
        
        // 팀 정보 추가
        const blueTeamWithInfo = [];
        const redTeamWithInfo = [];
        
        if (match.teams?.blue) {
          for (const player of match.teams.blue) {
            let userInfo = null;
            if (player.user) {
              userInfo = await NeDBUser.findById(player.user);
            }
            
            blueTeamWithInfo.push({
              ...player,
              user: userInfo ? {
                _id: userInfo._id,
                battletag: userInfo.battletag || userInfo.battleTag,
                nickname: userInfo.nickname,
                playerStats: userInfo.playerStats || { mmr: 1500 }
              } : null
            });
          }
        }
        
        if (match.teams?.red) {
          for (const player of match.teams.red) {
            let userInfo = null;
            if (player.user) {
              userInfo = await NeDBUser.findById(player.user);
            }
            
            redTeamWithInfo.push({
              ...player,
              user: userInfo ? {
                _id: userInfo._id,
                battletag: userInfo.battletag || userInfo.battleTag,
                nickname: userInfo.nickname,
                playerStats: userInfo.playerStats || { mmr: 1500 }
              } : null
            });
          }
        }
        
        match = {
          ...match,
          creator: creatorInfo ? {
            _id: creatorInfo._id,
            battletag: creatorInfo.battletag || creatorInfo.battleTag,
            nickname: creatorInfo.nickname
          } : null,
          teams: {
            blue: blueTeamWithInfo,
            red: redTeamWithInfo
          }
        };
      }
    } else {
      match = await Match.findById(req.params.id)
        .populate('creator', 'battleTag nickname')
        .populate('teams.blue.user', 'battleTag nickname playerStats')
        .populate('teams.red.user', 'battleTag nickname playerStats');
    }
    
    if (!match) {
      return res.status(404).json({ message: '매치를 찾을 수 없습니다' });
    }
    
    res.json(match);
  } catch (err) {
    console.error('매치 정보 조회 오류:', err);
    res.status(500).json({ message: '매치 정보를 가져오는데 실패했습니다' });
  }
});

/**
 * @route   POST /api/admin/dummy/generate
 * @desc    테스트용 더미 데이터 생성
 * @access  Admin
 */
router.post('/dummy/generate', authenticateAdmin, async (req, res) => {
  try {
    const { userCount = 100, matchCount = 200 } = req.body;
    
    // 생성된 더미 데이터 ID 저장
    const generatedIds = {
      users: [],
      matches: []
    };
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // NeDB 사용 시 더미 사용자 생성
      for (let i = 0; i < userCount; i++) {
        const index = i + 1;
        const dummyUser = {
          bnetId: 10000000 + index,
          battletag: `더미유저#${index}`,
          nickname: `더미닉네임${index}`,
          email: `dummy${index}@test.com`,
          accessToken: 'dummy-token',
          isAdmin: false,
          isDummy: true, // 더미 데이터 식별 태그
          playerStats: {
            totalGames: Math.floor(Math.random() * 50),
            wins: Math.floor(Math.random() * 30),
            losses: Math.floor(Math.random() * 20),
            mmr: 1000 + Math.floor(Math.random() * 1000)
          },
          preferredRoles: getRandomRoles(),
          favoriteHeroes: getRandomHeroes(),
          lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        };
        
        // 더미 사용자 생성
        const newUser = await NeDBUser.create(dummyUser);
        generatedIds.users.push(newUser._id);
      }
      
      // 더미 사용자로 더미 매치 생성
      const allDummyUsers = await NeDBUser.findByDummy(true);
      
      for (let i = 0; i < matchCount; i++) {
        const index = i + 1;
        const blueTeamSize = 3 + Math.floor(Math.random() * 3); // 3-5명
        const redTeamSize = 3 + Math.floor(Math.random() * 3); // 3-5명
        
        // 무작위로 더미 사용자 선택
        const selectedUsers = getRandomUsers(allDummyUsers, blueTeamSize + redTeamSize);
        const blueTeam = selectedUsers.slice(0, blueTeamSize);
        const redTeam = selectedUsers.slice(blueTeamSize);
        
        const matchResult = Math.random() > 0.5 ? 'blue' : 'red';
        const matchDuration = 15 + Math.floor(Math.random() * 25); // 15-40분
        
        const dummyMatch = {
          title: `더미 매치 #${index}`,
          description: `테스트용 더미 매치 #${index}`,
          creator: blueTeam[0]._id,
          gameMode: getRandomGameMode(),
          maxPlayers: blueTeamSize + redTeamSize,
          map: getRandomMap(),
          status: 'completed',
          isDummy: true, // 더미 데이터 식별 태그
          teams: {
            blue: blueTeam.map(user => ({
              user: user._id,
              hero: getRandomHero(),
              role: getRandomRole()
            })),
            red: redTeam.map(user => ({
              user: user._id,
              hero: getRandomHero(),
              role: getRandomRole()
            }))
          },
          result: {
            winner: matchResult,
            blueScore: matchResult === 'blue' ? Math.floor(Math.random() * 10) + 20 : Math.floor(Math.random() * 15),
            redScore: matchResult === 'red' ? Math.floor(Math.random() * 10) + 20 : Math.floor(Math.random() * 15),
            duration: matchDuration * 60 // 초 단위
          },
          scheduledTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        };
        
        // 더미 매치 생성
        const newMatch = await NeDBMatch.create(dummyMatch);
        generatedIds.matches.push(newMatch._id);
        
        // 매치에 참여한 사용자의 MMR 및 전적 업데이트
        for (const user of [...blueTeam, ...redTeam]) {
          const isWinner = (matchResult === 'blue' && blueTeam.includes(user)) || 
                          (matchResult === 'red' && redTeam.includes(user));
          
          if (!user.playerStats) {
            user.playerStats = {
              totalGames: 0,
              wins: 0,
              losses: 0,
              mmr: 1500
            };
          }
          
          user.playerStats.totalGames += 1;
          
          if (isWinner) {
            user.playerStats.wins += 1;
            user.playerStats.mmr += Math.floor(Math.random() * 20) + 10;
          } else {
            user.playerStats.losses += 1;
            user.playerStats.mmr -= Math.floor(Math.random() * 15) + 5;
          }
          
          // 마이너스 MMR 방지
          if (user.playerStats.mmr < 0) user.playerStats.mmr = 0;
          
          await NeDBUser.update(user._id, { playerStats: user.playerStats });
        }
      }
    } else {
      // MongoDB 사용 시 더미 사용자 생성
      const dummyUsers = [];
      
      for (let i = 0; i < userCount; i++) {
        const index = i + 1;
        const dummyUser = new User({
          battleNetId: 10000000 + index,
          battleTag: `더미유저#${index}`,
          nickname: `더미닉네임${index}`,
          email: `dummy${index}@test.com`,
          accessToken: 'dummy-token',
          isAdmin: false,
          isDummy: true, // 더미 데이터 식별 태그
          playerStats: {
            totalGames: Math.floor(Math.random() * 50),
            wins: Math.floor(Math.random() * 30),
            losses: Math.floor(Math.random() * 20),
            mmr: 1000 + Math.floor(Math.random() * 1000)
          },
          preferredRoles: getRandomRoles(),
          favoriteHeroes: getRandomHeroes(),
          lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        });
        
        await dummyUser.save();
        dummyUsers.push(dummyUser);
        generatedIds.users.push(dummyUser._id);
      }
      
      // 더미 매치 생성
      for (let i = 0; i < matchCount; i++) {
        const index = i + 1;
        const blueTeamSize = 3 + Math.floor(Math.random() * 3); // 3-5명
        const redTeamSize = 3 + Math.floor(Math.random() * 3); // 3-5명
        
        // 무작위로 더미 사용자 선택
        const selectedUsers = getRandomUsers(dummyUsers, blueTeamSize + redTeamSize);
        const blueTeam = selectedUsers.slice(0, blueTeamSize);
        const redTeam = selectedUsers.slice(blueTeamSize);
        
        const matchResult = Math.random() > 0.5 ? 'blue' : 'red';
        const matchDuration = 15 + Math.floor(Math.random() * 25); // 15-40분
        
        const dummyMatch = new Match({
          title: `더미 매치 #${index}`,
          description: `테스트용 더미 매치 #${index}`,
          creator: blueTeam[0]._id,
          gameMode: getRandomGameMode(),
          maxPlayers: blueTeamSize + redTeamSize,
          map: getRandomMap(),
          status: 'completed',
          isDummy: true, // 더미 데이터 식별 태그
          teams: {
            blue: blueTeam.map(user => ({
              user: user._id,
              hero: getRandomHero(),
              role: getRandomRole()
            })),
            red: redTeam.map(user => ({
              user: user._id,
              hero: getRandomHero(),
              role: getRandomRole()
            }))
          },
          result: {
            winner: matchResult,
            blueScore: matchResult === 'blue' ? Math.floor(Math.random() * 10) + 20 : Math.floor(Math.random() * 15),
            redScore: matchResult === 'red' ? Math.floor(Math.random() * 10) + 20 : Math.floor(Math.random() * 15),
            duration: matchDuration * 60 // 초 단위
          },
          scheduledTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        });
        
        await dummyMatch.save();
        generatedIds.matches.push(dummyMatch._id);
        
        // 매치에 참여한 사용자의 MMR 및 전적 업데이트
        for (const user of [...blueTeam, ...redTeam]) {
          const isWinner = (matchResult === 'blue' && blueTeam.includes(user)) || 
                          (matchResult === 'red' && redTeam.includes(user));
          
          user.playerStats.totalGames += 1;
          
          if (isWinner) {
            user.playerStats.wins += 1;
            user.playerStats.mmr += Math.floor(Math.random() * 20) + 10;
          } else {
            user.playerStats.losses += 1;
            user.playerStats.mmr -= Math.floor(Math.random() * 15) + 5;
          }
          
          // 마이너스 MMR 방지
          if (user.playerStats.mmr < 0) user.playerStats.mmr = 0;
          
          await user.save();
        }
      }
    }
    
    res.json({
      message: `${userCount}개의 더미 사용자와 ${matchCount}개의 더미 매치가 성공적으로 생성되었습니다.`,
      generatedIds
    });
  } catch (err) {
    console.error('더미 데이터 생성 오류:', err);
    res.status(500).json({ message: '더미 데이터 생성에 실패했습니다.' });
  }
});

/**
 * @route   DELETE /api/admin/dummy
 * @desc    모든 더미 데이터 삭제
 * @access  Admin
 */
router.delete('/dummy', authenticateAdmin, async (req, res) => {
  try {
    let deletedUsers = 0;
    let deletedMatches = 0;
    
    // 데이터베이스 유형에 따라 다르게 처리
    if (global.useNeDB) {
      // NeDB 사용 시
      // 더미 매치 모두 삭제
      deletedMatches = await NeDBMatch.deleteAllDummy();
      
      // 더미 사용자 모두 삭제
      deletedUsers = await NeDBUser.deleteAllDummy();
    } else {
      // MongoDB 사용 시
      // 더미 매치 모두 삭제
      const matchResult = await Match.deleteMany({ isDummy: true });
      deletedMatches = matchResult.deletedCount;
      
      // 더미 사용자 모두 삭제
      const userResult = await User.deleteMany({ isDummy: true });
      deletedUsers = userResult.deletedCount;
    }
    
    res.json({
      message: `${deletedUsers}개의 더미 사용자와 ${deletedMatches}개의 더미 매치가 성공적으로 삭제되었습니다.`
    });
  } catch (err) {
    console.error('더미 데이터 삭제 오류:', err);
    res.status(500).json({ message: '더미 데이터 삭제에 실패했습니다.' });
  }
});

// 더미 데이터 생성에 필요한 헬퍼 함수들
const getRandomUsers = (users, count) => {
  const shuffled = [...users].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomRoles = () => {
  const roles = ['탱커', '투사', '힐러', '원거리 암살자', '근접 암살자', '전문가'];
  const roleCount = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...roles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, roleCount);
};

const getRandomRole = () => {
  const roles = ['tank', 'bruiser', 'healer', 'ranged_assassin', 'melee_assassin', 'support'];
  return roles[Math.floor(Math.random() * roles.length)];
};

const getRandomHeroes = () => {
  const heroes = [
    '가로쉬', '겐지', '그레이메인', '길 짐', '노바', '더블로', '데하카', '라그나로스', '레오릭', '레이너',
    '루나라', '리리', '리밍', '마이에브', '말가니스', '말퓨리온', '메이', '메피스토', '모랄레스', '무라딘',
    '물리바', '바리안', '발라', '블레이즈', '비숍', '사무로', '소냐', '스투코프', '스랄', '실바나스',
    '아나', '아눕아락', '아르타니스', '아르투아니스', '아르하스', '알렉스트라자', '안두인', '요한나', '우서',
    '이렐', '임페리우스', '자리야', '자리아', '자가라', '젤나자', '정예 타우렌 족장', '줄진', '직소', '징크스',
    '카라짐', '카라짐', '카시아', '켈투자드', '크로미', '타이커스', '타사다르', '트레이서', '티란데', '티리엘',
    '페녹스', '프로비우스', '한조', '해머'
  ];
  
  const heroCount = Math.floor(Math.random() * 5) + 1;
  const shuffled = [...heroes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, heroCount);
};

const getRandomHero = () => {
  const heroes = [
    'Abathur', 'Alarak', 'Alexstrasza', 'Ana', 'Anduin', 'Anubarak', 'Artanis', 'Arthas', 'Auriel', 'Azmodan',
    'Blaze', 'Brightwing', 'Cassia', 'Chen', 'Cho', 'Chromie', 'DVa', 'Deathwing', 'Deckard', 'Dehaka',
    'Diablo', 'ETC', 'Falstad', 'Fenix', 'Garrosh', 'Gazlowe', 'Genji', 'Greymane', 'Gul\'dan', 'Hanzo',
    'Hogger', 'Illidan', 'Imperius', 'Jaina', 'Johanna', 'Junkrat', 'Kael\'thas', 'Kel\'Thuzad', 'Kerrigan', 'Kharazim',
    'Leoric', 'Li Li', 'Li-Ming', 'Lt. Morales', 'Lunara', 'Maiev', 'Mal\'Ganis', 'Malfurion', 'Malthael', 'Medivh',
    'Mephisto', 'Muradin', 'Murky', 'Nazeebo', 'Nova', 'Orphea', 'Probius', 'Qhira', 'Ragnaros', 'Raynor',
    'Rehgar', 'Rexxar', 'Samuro', 'Sgt. Hammer', 'Sonya', 'Stitches', 'Stukov', 'Sylvanas', 'Tassadar', 'The Butcher',
    'The Lost Vikings', 'Thrall', 'Tracer', 'Tychus', 'Tyrael', 'Tyrande', 'Uther', 'Valeera', 'Valla', 'Varian',
    'Whitemane', 'Xul', 'Yrel', 'Zagara', 'Zarya', 'Zeratul', 'Zul\'jin'
  ];
  
  return heroes[Math.floor(Math.random() * heroes.length)];
};

const getRandomGameMode = () => {
  const gameModes = ['Standard', 'ARAM', 'Custom'];
  return gameModes[Math.floor(Math.random() * gameModes.length)];
};

const getRandomMap = () => {
  const maps = [
    '알테락 패스', '전투의 마루', '저주받은 골짜기', '용의 둥지', '영원한 전쟁터', '해골 광산', 
    '인페르날 신단', '인퍼널 신단', '불지옥 신단', '핼러우드 광산 맵', '나이트메어', '마카브레', 
    '가든 오브 테러', '배틀 오브 이터니티', '블랙하트 베이', '브락시스 홀드아웃', '하늘 사원', 
    '볼스카야 공장', '하나무라 신사', '톰 오브 더 스파이더 퀸'
  ];
  
  return maps[Math.floor(Math.random() * maps.length)];
};

module.exports = router; 