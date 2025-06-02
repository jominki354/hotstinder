import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { translateHero, translateMap } from '../../utils/hotsTranslations';

const ReplayUploadModal = ({ isOpen, onClose, onComplete, matchId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisPreview, setShowAnalysisPreview] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // 실제 매치 정보에서 플레이어 정보 가져오기
  const getMatchPlayerInfo = () => {
    try {
      const savedMatchInfo = localStorage.getItem('lastMatchInfo');
      if (savedMatchInfo) {
        const matchInfo = JSON.parse(savedMatchInfo);
        return {
          blueTeam: matchInfo.blueTeam || [],
          redTeam: matchInfo.redTeam || [],
          isSimulation: matchInfo.isSimulation || false,
          isDevelopment: matchInfo.isDevelopment || false
        };
      }
    } catch (err) {
      console.error('매치 정보 파싱 오류:', err);
    }
    return { blueTeam: [], redTeam: [], isSimulation: false, isDevelopment: false };
  };

  // 시뮬레이션 매치인지 확인
  const isSimulationMatch = () => {
    const matchPlayerInfo = getMatchPlayerInfo();

    // 1. 저장된 매치 정보에 시뮬레이션 플래그가 있는 경우
    if (matchPlayerInfo.isSimulation || matchPlayerInfo.isDevelopment) {
      return true;
    }

    // 2. 매치 ID 패턴으로 판단
    if (matchId && (matchId.includes('dev_') || matchId.includes('sim_'))) {
      return true;
    }

    return false;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 파일 확장자 검사
    if (!selectedFile.name.toLowerCase().endsWith('.stormreplay')) {
      setError('유효한 .StormReplay 파일만 업로드할 수 있습니다.');
      setFile(null);
      return;
    }

    // 파일 크기 검사 (50MB 제한)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('파일 크기는 50MB를 초과할 수 없습니다.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setMessage('');
    setAnalysisResult(null);
    setShowAnalysisPreview(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];

      // 파일 검증
      if (!droppedFile.name.toLowerCase().endsWith('.stormreplay')) {
        setError('유효한 .StormReplay 파일만 업로드할 수 있습니다.');
        return;
      }

      if (droppedFile.size > 50 * 1024 * 1024) {
        setError('파일 크기는 50MB를 초과할 수 없습니다.');
        return;
      }

      setFile(droppedFile);
      setError('');
      setMessage('');
      setAnalysisResult(null);
      setShowAnalysisPreview(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatGameTime = (seconds) => {
    if (!seconds || seconds <= 0) return '알 수 없음';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '알 수 없음';
    }
  };

  // 게임 버전 객체를 문자열로 변환
  const formatGameVersion = (versionData) => {
    if (!versionData) return '알 수 없음';

    // 이미 문자열인 경우
    if (typeof versionData === 'string') {
      return versionData;
    }

    // 객체인 경우 (hots-parser에서 반환하는 형태)
    if (typeof versionData === 'object' && versionData.m_build) {
      return `${versionData.m_major || 0}.${versionData.m_minor || 0}.${versionData.m_revision || 0}.${versionData.m_build || 0}`;
    }

    return '알 수 없음';
  };

  // 매치 일치성 검사
  const checkMatchConsistency = (analysisResult) => {
    const matchPlayerInfo = getMatchPlayerInfo();
    const issues = [];
    let score = 0;
    const maxScore = 3; // 총 3개 항목 검사: 전장, 플레이어 수, 플레이어 이름

    console.log('[매치 일치성] 검사 시작:', {
      replayMap: analysisResult.basic?.mapName,
      replayBlueCount: analysisResult.teams?.blue?.length || 0,
      replayRedCount: analysisResult.teams?.red?.length || 0,
      matchBlueCount: matchPlayerInfo.blueTeam?.length || 0,
      matchRedCount: matchPlayerInfo.redTeam?.length || 0
    });

    // 1. 전장 일치 검사 (영어 → 한글 변환 후 비교)
    const savedMatchInfo = localStorage.getItem('lastMatchInfo');
    let expectedMap = null;
    let isMapMatch = false;
    try {
      if (savedMatchInfo) {
        const matchInfo = JSON.parse(savedMatchInfo);
        expectedMap = matchInfo.map; // 한글 맵 이름

        if (expectedMap && analysisResult.basic?.mapName) {
          // 리플레이 맵 이름을 한글로 변환
          const translatedReplayMap = translateMap(analysisResult.basic.mapName);

          console.log('[매치 일치성] 전장 비교:', {
            expected: expectedMap,
            replayOriginal: analysisResult.basic.mapName,
            replayTranslated: translatedReplayMap
          });

          // 한글로 변환된 맵 이름과 비교
          isMapMatch = expectedMap === translatedReplayMap;
        }
      }
    } catch (err) {
      console.error('매치 정보 파싱 오류:', err);
    }

    if (isMapMatch) {
      score += 1;
      console.log('[매치 일치성] 전장 일치:', expectedMap);
    } else {
      const translatedReplayMap = translateMap(analysisResult.basic?.mapName);
      issues.push(`전장 불일치: 예상 "${expectedMap}" vs 리플레이 "${translatedReplayMap}" (원본: ${analysisResult.basic?.mapName})`);
      console.log('[매치 일치성] 전장 불일치:', {
        expected: expectedMap,
        replayOriginal: analysisResult.basic?.mapName,
        replayTranslated: translatedReplayMap
      });
    }

    // 2. 플레이어 수 검사 (총 10명이어야 함)
    const replayPlayerCount = (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0);
    const expectedPlayerCount = (matchPlayerInfo.blueTeam?.length || 0) + (matchPlayerInfo.redTeam?.length || 0);

    if (replayPlayerCount === 10 && expectedPlayerCount === 10) {
      score += 1;
      console.log('[매치 일치성] 플레이어 수 일치: 10명');
    } else {
      issues.push(`플레이어 수 불일치: 예상 ${expectedPlayerCount}명 vs 리플레이 ${replayPlayerCount}명`);
      console.log('[매치 일치성] 플레이어 수 불일치:', { expected: expectedPlayerCount, actual: replayPlayerCount });
    }

    // 3. 플레이어 이름 일치 검사
    if (matchPlayerInfo.blueTeam?.length > 0 || matchPlayerInfo.redTeam?.length > 0) {
      // 매치에서 예상되는 모든 플레이어 이름 수집
      const expectedPlayers = [
        ...(matchPlayerInfo.blueTeam || []).map(p => p.battleTag || p.name),
        ...(matchPlayerInfo.redTeam || []).map(p => p.battleTag || p.name)
      ].filter(name => name && name.trim() !== '');

      // 리플레이에서 발견된 모든 플레이어 이름 수집
      const replayPlayers = [
        ...(analysisResult.teams?.blue || []).map(p => p.name),
        ...(analysisResult.teams?.red || []).map(p => p.name)
      ].filter(name => name && name.trim() !== '');

      console.log('[매치 일치성] 플레이어 이름 비교:', {
        expectedPlayers: expectedPlayers,
        replayPlayers: replayPlayers
      });

      if (expectedPlayers.length > 0 && replayPlayers.length > 0) {
        // 이름 일치 개수 계산
        let matchedCount = 0;
        const unmatchedExpected = [];
        const unmatchedReplay = [];

        expectedPlayers.forEach(expectedName => {
          // 정확한 일치 또는 부분 일치 검사
          const found = replayPlayers.some(replayName => {
            // 배틀태그에서 #뒤 제거하여 비교
            const cleanExpected = expectedName.split('#')[0].toLowerCase();
            const cleanReplay = replayName.split('#')[0].toLowerCase();
            return cleanExpected === cleanReplay ||
                   cleanExpected.includes(cleanReplay) ||
                   cleanReplay.includes(cleanExpected);
          });

          if (found) {
            matchedCount++;
          } else {
            unmatchedExpected.push(expectedName);
          }
        });

        // 리플레이에만 있는 플레이어 찾기
        replayPlayers.forEach(replayName => {
          const found = expectedPlayers.some(expectedName => {
            const cleanExpected = expectedName.split('#')[0].toLowerCase();
            const cleanReplay = replayName.split('#')[0].toLowerCase();
            return cleanExpected === cleanReplay ||
                   cleanExpected.includes(cleanReplay) ||
                   cleanReplay.includes(cleanExpected);
          });

          if (!found) {
            unmatchedReplay.push(replayName);
          }
        });

        const matchPercentage = expectedPlayers.length > 0 ? (matchedCount / expectedPlayers.length) : 0;

        if (matchPercentage >= 0.8) { // 80% 이상 일치
          score += 1;
          console.log('[매치 일치성] 플레이어 이름 일치율 양호:', `${Math.round(matchPercentage * 100)}%`);
        } else if (matchPercentage >= 0.5) { // 50% 이상 일치
          score += 0.5;
          issues.push(`플레이어 일치율 낮음: ${matchedCount}/${expectedPlayers.length}명 일치 (${Math.round(matchPercentage * 100)}%)`);
        } else {
          issues.push(`플레이어 대부분 불일치: ${matchedCount}/${expectedPlayers.length}명만 일치 (${Math.round(matchPercentage * 100)}%)`);
        }

        console.log('[매치 일치성] 플레이어 매칭 결과:', {
          matchedCount,
          totalExpected: expectedPlayers.length,
          matchPercentage: Math.round(matchPercentage * 100),
          unmatchedExpected,
          unmatchedReplay
        });
      } else {
        score += 0.5; // 비교할 수 없으면 부분 점수
        console.log('[매치 일치성] 플레이어 정보 부족');
      }
    } else {
      score += 0.5; // 매치 정보가 없으면 부분 점수
      console.log('[매치 일치성] 매치 플레이어 정보 없음');
    }

    const percentage = Math.round((score / maxScore) * 100);

    console.log('[매치 일치성] 최종 결과:', {
      score: `${score}/${maxScore}`,
      percentage: `${percentage}%`,
      issuesCount: issues.length
    });

    return {
      score,
      maxScore,
      percentage,
      issues,
      status: percentage >= 90 ? 'excellent' : percentage >= 70 ? 'good' : percentage >= 50 ? 'warning' : 'error'
    };
  };

  // 리플레이 분석만 수행 (미리보기용) - 관리자 페이지와 완전히 동일한 방식 사용
  const handleAnalyzeReplay = async () => {
    if (!file) {
      setError('업로드할 리플레이 파일을 선택해주세요.');
      return;
    }

    if (!matchId) {
      setError('매치 ID가 필요합니다. 매치 정보 페이지에서만 리플레이를 제출할 수 있습니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);
      setMessage('리플레이 파일을 분석 중입니다...');

      console.log('[리플레이 분석] 시작:', {
        filename: file.name,
        size: `${Math.round(file.size / 1024)}KB`,
        matchId: matchId
      });

      // FormData 객체 생성
      const formData = new FormData();
      formData.append('replayFile', file);

      console.log('[리플레이 분석] 서버 API 요청 전송 중...');

      // 관리자 페이지와 완전히 동일한 서버 엔드포인트 사용 (Vercel API 대신 서버 API)
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullURL = `${baseURL}/api/replay/analyze`;

      console.log('[리플레이 분석] 요청 URL:', fullURL);
      console.log('[리플레이 분석] 환경변수 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
      console.log('[리플레이 분석] 최종 baseURL:', baseURL);

      const analysisResponse = await axios.post(fullURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          console.log(`[리플레이 분석] 업로드 진행률: ${percentCompleted}%`);
        },
        timeout: 30000 // 30초 타임아웃
      });

      setUploadProgress(100);
      console.log('[리플레이 분석] 서버 응답 수신 - 상태코드:', analysisResponse.status);
      console.log('[리플레이 분석] 서버 응답 헤더:', analysisResponse.headers);
      console.log('[리플레이 분석] 서버 응답 데이터 전체:', JSON.stringify(analysisResponse.data, null, 2));

      if (analysisResponse.data.success && analysisResponse.data.analysisResult) {
        const serverResult = analysisResponse.data.analysisResult;

        // 🎮 관리자 페이지와 완전히 동일한 로깅 방식 적용
        console.log('🎮 [업로드 모달] 리플레이 분석 결과:', serverResult);
        console.log('📊 [업로드 모달] 메타데이터:', serverResult?.metadata);
        console.log('👥 [업로드 모달] 팀 데이터:', serverResult?.teams);
        console.log('📈 [업로드 모달] 통계:', serverResult?.statistics);

        // 플레이어 통계 상세 로그 (관리자 페이지와 동일)
        if (serverResult?.teams?.blue?.[0]) {
          console.log('🔵 [업로드 모달] 블루팀 첫 번째 플레이어:', {
            name: serverResult.teams.blue[0].name,
            hero: serverResult.teams.blue[0].hero,
            stats: serverResult.teams.blue[0].stats
          });
        }

        if (serverResult?.teams?.red?.[0]) {
          console.log('🔴 [업로드 모달] 레드팀 첫 번째 플레이어:', {
            name: serverResult.teams.red[0].name,
            hero: serverResult.teams.red[0].hero,
            stats: serverResult.teams.red[0].stats
          });
        }

        console.log('[리플레이 분석] 서버 응답 구조 상세 검증:', {
          hasMetadata: !!serverResult.metadata,
          metadataKeys: serverResult.metadata ? Object.keys(serverResult.metadata) : null,
          hasTeams: !!serverResult.teams,
          teamsKeys: serverResult.teams ? Object.keys(serverResult.teams) : null,
          hasStatistics: !!serverResult.statistics,
          statisticsKeys: serverResult.statistics ? Object.keys(serverResult.statistics) : null,
          hasBlueTeam: !!serverResult.teams?.blue,
          hasRedTeam: !!serverResult.teams?.red,
          blueCount: serverResult.teams?.blue?.length || 0,
          redCount: serverResult.teams?.red?.length || 0,
          totalKills: serverResult.statistics?.totalKills || 0,
          totalDeaths: serverResult.statistics?.totalDeaths || 0
        });

        // 블루팀 첫 번째 플레이어 상세 로그
        if (serverResult.teams?.blue?.[0]) {
          console.log('[리플레이 분석] 블루팀 첫 번째 플레이어 상세:', {
            name: serverResult.teams.blue[0].name,
            hero: serverResult.teams.blue[0].hero,
            hasStats: !!serverResult.teams.blue[0].stats,
            statsKeys: serverResult.teams.blue[0].stats ? Object.keys(serverResult.teams.blue[0].stats) : null,
            statsValues: serverResult.teams.blue[0].stats || null
          });
        }

        // 레드팀 첫 번째 플레이어 상세 로그
        if (serverResult.teams?.red?.[0]) {
          console.log('[리플레이 분석] 레드팀 첫 번째 플레이어 상세:', {
            name: serverResult.teams.red[0].name,
            hero: serverResult.teams.red[0].hero,
            hasStats: !!serverResult.teams.red[0].stats,
            statsKeys: serverResult.teams.red[0].stats ? Object.keys(serverResult.teams.red[0].stats) : null,
            statsValues: serverResult.teams.red[0].stats || null
          });
        }

        // 서버 응답 구조 검증
        if (!serverResult.metadata || !serverResult.teams || !serverResult.teams.blue || !serverResult.teams.red) {
          console.error('[리플레이 분석] 서버 응답 구조 오류:', serverResult);
          throw new Error('리플레이 분석 결과가 불완전합니다. 다른 리플레이 파일을 시도해주세요.');
        }

        if (serverResult.teams.blue.length === 0 && serverResult.teams.red.length === 0) {
          console.error('[리플레이 분석] 플레이어 정보 없음');
          throw new Error('리플레이에서 플레이어 정보를 찾을 수 없습니다.');
        }

        // 관리자 페이지와 완전히 동일한 구조로 결과 처리 (서버 응답을 그대로 사용)
        const result = {
          success: true,
          basic: {
            filename: file.name,
            fileSize: serverResult.metadata.fileSize || file.size,
            gameLength: serverResult.metadata.gameDuration || 0,
            gameDate: serverResult.metadata.date || new Date().toISOString(),
            gameVersion: serverResult.metadata.gameVersion || 'Unknown',
            mapName: serverResult.metadata.mapName || '알 수 없음',
            gameMode: serverResult.metadata.gameMode || 'Storm League',
            winner: serverResult.metadata.winner || 'blue',
            winningTeam: serverResult.metadata.winner === 'blue' ? 0 : 1
          },
          // 서버 응답의 teams 구조를 그대로 사용 (관리자 페이지와 동일)
          teams: {
            blue: serverResult.teams.blue.map(player => ({
              name: player.name || player.battleTag || 'Unknown',
              hero: player.hero || 'Unknown',
              // 서버에서 제공하는 stats 구조를 그대로 사용 (관리자 페이지와 동일)
              stats: player.stats || {}
            })),
            red: serverResult.teams.red.map(player => ({
              name: player.name || player.battleTag || 'Unknown',
              hero: player.hero || 'Unknown',
              // 서버에서 제공하는 stats 구조를 그대로 사용 (관리자 페이지와 동일)
              stats: player.stats || {}
            }))
          },
          // 서버에서 제공하는 statistics를 그대로 사용 (관리자 페이지와 동일)
          statistics: serverResult.statistics || {},
          // 원본 서버 응답도 포함 (디버깅용)
          originalServerResponse: serverResult
        };

        console.log('[리플레이 분석] 최종 결과 구조:', {
          hasBasic: !!result.basic,
          hasTeams: !!result.teams,
          hasStatistics: !!result.statistics,
          blueTeamCount: result.teams.blue.length,
          redTeamCount: result.teams.red.length,
          totalKills: result.statistics.totalKills || 0,
          totalDeaths: result.statistics.totalDeaths || 0,
          sampleBluePlayer: result.teams.blue[0] || null,
          sampleRedPlayer: result.teams.red[0] || null
        });

        // 매치 일치성 검사
        console.log('[리플레이 분석] 매치 일치성 검사 중...');
        const consistency = checkMatchConsistency(result);
        result.consistency = consistency;

        console.log('[리플레이 분석] 일치성 검사 결과:', {
          percentage: consistency.percentage,
          status: consistency.status,
          issues: consistency.issues
        });

        setAnalysisResult(result);
        setShowAnalysisPreview(true);
        setMessage('리플레이 분석이 완료되었습니다! 아래 결과를 확인하고 매치를 완료하세요.');
        toast.success('리플레이 분석 완료!');

        console.log('[리플레이 분석] 성공 완료');
      } else {
        console.error('[리플레이 분석] API 응답 오류:', analysisResponse.data);
        throw new Error(analysisResponse.data.error || '리플레이 분석에 실패했습니다.');
      }

    } catch (err) {
      console.error('[리플레이 분석] 오류 발생:', err);

      // 상세한 오류 메시지 처리
      let errorMessage = '리플레이 분석 중 오류가 발생했습니다.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = '요청 시간이 초과되었습니다. 파일이 너무 크거나 서버가 응답하지 않습니다.';
      } else if (err.response?.status === 413) {
        errorMessage = '파일이 너무 큽니다. 50MB 이하의 파일을 업로드해주세요.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || err.response.data?.message || '잘못된 요청입니다.';
      } else if (err.response?.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (err.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error('[리플레이 분석] 최종 오류 메시지:', errorMessage);

      setError(errorMessage);
      setMessage('');
      setAnalysisResult(null);
      setShowAnalysisPreview(false);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // 매치 완료 처리
  const handleCompleteMatch = async () => {
    if (!analysisResult) {
      setError('먼저 리플레이를 분석해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('매치 결과를 저장하고 게임을 종료합니다...');

      // 시뮬레이션 매치 여부 확인
      const isSimulation = isSimulationMatch();
      const matchPlayerInfo = getMatchPlayerInfo();

      console.log('매치 완료 처리:', {
        matchId,
        isSimulation,
        blueTeamCount: matchPlayerInfo.blueTeam.length,
        redTeamCount: matchPlayerInfo.redTeam.length
      });

      // 리플레이 분석 결과 상세 로깅
      console.log('[매치 완료] 리플레이 분석 결과 전체 구조:', {
        hasTeams: !!analysisResult.teams,
        hasBlueTeam: !!analysisResult.teams?.blue,
        hasRedTeam: !!analysisResult.teams?.red,
        blueTeamLength: analysisResult.teams?.blue?.length || 0,
        redTeamLength: analysisResult.teams?.red?.length || 0,
        analysisResultKeys: Object.keys(analysisResult),
        teamsKeys: analysisResult.teams ? Object.keys(analysisResult.teams) : null
      });

      if (analysisResult.teams?.blue) {
        console.log('[매치 완료] 블루팀 플레이어 상세:', analysisResult.teams.blue.map((player, index) => ({
          index,
          name: player.name,
          hero: player.hero,
          hasStats: !!player.stats,
          statsKeys: player.stats ? Object.keys(player.stats) : null,
          kills: player.stats?.SoloKill || player.kills || 0,
          deaths: player.stats?.Deaths || player.deaths || 0,
          assists: player.stats?.Assists || player.assists || 0,
          heroDamage: player.stats?.HeroDamage || player.heroDamage || 0,
          siegeDamage: player.stats?.SiegeDamage || player.siegeDamage || 0,
          healing: player.stats?.Healing || player.healing || 0,
          experience: player.stats?.ExperienceContribution || player.experience || 0
        })));
      }

      if (analysisResult.teams?.red) {
        console.log('[매치 완료] 레드팀 플레이어 상세:', analysisResult.teams.red.map((player, index) => ({
          index,
          name: player.name,
          hero: player.hero,
          hasStats: !!player.stats,
          statsKeys: player.stats ? Object.keys(player.stats) : null,
          kills: player.stats?.SoloKill || player.kills || 0,
          deaths: player.stats?.Deaths || player.deaths || 0,
          assists: player.stats?.Assists || player.assists || 0,
          heroDamage: player.stats?.HeroDamage || player.heroDamage || 0,
          siegeDamage: player.stats?.SiegeDamage || player.siegeDamage || 0,
          healing: player.stats?.Healing || player.healing || 0,
          experience: player.stats?.ExperienceContribution || player.experience || 0
        })));
      }

      // 승리 팀 결정
      const winningTeam = analysisResult.basic.winner ||
                         (analysisResult.basic.winningTeam === 0 ? 'blue' : 'red');

      // 플레이어 통계 생성 - 관리자 페이지와 동일한 방식
      const playerStats = [];

      // 블루팀 플레이어 추가
      if (analysisResult.teams && analysisResult.teams.blue) {
        analysisResult.teams.blue.forEach((player, index) => {
          // 관리자 페이지와 동일한 방식으로 통계 추출
          const stats = player.stats || {};

          console.log(`[매치 완료] 블루팀 ${player.name} 통계 추출:`, {
            originalStats: stats,
            kills: stats.SoloKill || 0,
            deaths: stats.Deaths || 0,
            assists: stats.Assists || 0,
            heroDamage: stats.HeroDamage || 0,
            siegeDamage: stats.SiegeDamage || 0,
            healing: stats.Healing || 0,
            experience: stats.ExperienceContribution || 0
          });

          playerStats.push({
            userId: `blue_${player.name}`,
            battletag: player.name || 'Unknown',
            playerBattleTag: player.name || 'Unknown', // 리플레이에서 추출된 배틀태그
            team: 'blue',
            hero: player.hero || 'Unknown',
            kills: stats.SoloKill || 0,
            deaths: stats.Deaths || 0,
            assists: stats.Assists || 0,
            heroDamage: stats.HeroDamage || 0,
            siegeDamage: stats.SiegeDamage || 0,
            healing: stats.Healing || 0,
            experienceContribution: stats.ExperienceContribution || 0
          });
        });
      }

      // 레드팀 플레이어 추가
      if (analysisResult.teams && analysisResult.teams.red) {
        analysisResult.teams.red.forEach((player, index) => {
          // 관리자 페이지와 동일한 방식으로 통계 추출
          const stats = player.stats || {};

          console.log(`[매치 완료] 레드팀 ${player.name} 통계 추출:`, {
            originalStats: stats,
            kills: stats.SoloKill || 0,
            deaths: stats.Deaths || 0,
            assists: stats.Assists || 0,
            heroDamage: stats.HeroDamage || 0,
            siegeDamage: stats.SiegeDamage || 0,
            healing: stats.Healing || 0,
            experience: stats.ExperienceContribution || 0
          });

          playerStats.push({
            userId: `red_${player.name}`,
            battletag: player.name || 'Unknown',
            playerBattleTag: player.name || 'Unknown', // 리플레이에서 추출된 배틀태그
            team: 'red',
            hero: player.hero || 'Unknown',
            kills: stats.SoloKill || 0,
            deaths: stats.Deaths || 0,
            assists: stats.Assists || 0,
            heroDamage: stats.HeroDamage || 0,
            siegeDamage: stats.SiegeDamage || 0,
            healing: stats.Healing || 0,
            experienceContribution: stats.ExperienceContribution || 0
          });
        });
      }

      console.log('[매치 완료] 최종 플레이어 통계 생성 완료:', {
        totalPlayers: playerStats.length,
        blueTeamPlayers: playerStats.filter(p => p.team === 'blue').length,
        redTeamPlayers: playerStats.filter(p => p.team === 'red').length,
        playerStatsDetail: playerStats.map(p => ({
          battletag: p.battletag,
          team: p.team,
          hero: p.hero,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          heroDamage: p.heroDamage,
          siegeDamage: p.siegeDamage,
          healing: p.healing,
          experience: p.experienceContribution
        }))
      });

      // 실제 통계가 있는지 확인 (모든 값이 0이 아닌 플레이어가 있는지)
      const hasRealStats = playerStats.some(p =>
        p.kills > 0 || p.deaths > 0 || p.assists > 0 ||
        p.heroDamage > 0 || p.siegeDamage > 0 || p.healing > 0
      );

      console.log('[매치 완료] 실제 통계 존재 여부:', hasRealStats);

      // 플레이어 통계가 비어있거나 모든 값이 0일 경우에만 더미 데이터 생성
      if (playerStats.length === 0 || !hasRealStats) {
        console.log('[매치 완료] 실제 통계가 없음 - 더미 데이터 생성 건너뛰기');
        console.log('[매치 완료] 실제 리플레이 데이터를 그대로 사용합니다.');

        // 더미 데이터 생성하지 않고 실제 데이터 사용
        if (playerStats.length === 0) {
          console.error('[매치 완료] 플레이어 통계가 완전히 비어있음 - 리플레이 분석 실패');
          throw new Error('리플레이에서 플레이어 정보를 추출할 수 없습니다.');
        }
      }

      // 매치 완료 API 호출
      const matchCompleteResponse = await axios.post(`/api/matches/${matchId}/complete`, {
        replayData: {
          ...analysisResult,
          isSimulation: isSimulation
        },
        winningTeam: winningTeam,
        gameLength: analysisResult.basic.gameLength || 0,
        playerStats: playerStats,
        isSimulation: isSimulation
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (matchCompleteResponse.data.success) {
        const successMessage = isSimulation
          ? '✅ 시뮬레이션 매치가 완료되었습니다!\n📊 리플레이 통계가 매치 기록으로 저장되었습니다.\n💡 시뮬레이션 매치는 개인 통계에 반영되지 않습니다.'
          : '✅ 매치가 완료되었습니다!\n📈 개인 통계가 업데이트되고 최근 게임에 기록되었습니다.\n🎉 수고하셨습니다!';

        setMessage(successMessage);
        toast.success('매치가 성공적으로 완료되었습니다!');

        // 매치 상태 정리
        localStorage.removeItem('matchInProgress');
        localStorage.removeItem('currentMatchId');
        localStorage.removeItem('lastMatchInfo');
        localStorage.removeItem('inQueue');

        // 3초 후 매치메이킹 페이지로 이동
        setTimeout(() => {
          onComplete?.(true);
          onClose(true);
        }, 3000);
      } else {
        throw new Error(matchCompleteResponse.data.message || '매치 완료 처리에 실패했습니다.');
      }

    } catch (err) {
      console.error('매치 완료 오류:', err);

      let errorMessage = '매치 완료 중 오류가 발생했습니다.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setMessage('');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setError('');
      setMessage('');
      setUploadProgress(0);
      setAnalysisResult(null);
      setShowAnalysisPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl mx-4 border border-slate-600/30 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">매치 완료 - 리플레이 제출</h3>
            <p className="text-slate-400 text-sm">Heroes of the Storm 리플레이 파일을 업로드하여 매치를 완료합니다</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-blue-900/30 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="whitespace-pre-line">{message}</span>
          </div>
        )}

        {/* 파일 업로드 영역 */}
        <div className="mb-6">
          <label className="block text-white mb-2 font-medium text-sm">
              리플레이 파일 (.StormReplay)
            </label>

          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${
              file
                ? 'border-green-500/50 bg-green-900/10'
                : 'border-slate-600 bg-slate-700/20 hover:border-slate-500 hover:bg-slate-700/30'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".StormReplay"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-medium text-sm">{file.name}</div>
                  <div className="text-slate-400 text-xs">{formatFileSize(file.size)}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 bg-slate-600/50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-white font-medium text-sm mb-1">
                  리플레이 파일 선택
                </div>
                <div className="text-slate-400 text-xs">
                  .StormReplay 파일 (최대 50MB)
                </div>
              </div>
            )}
          </div>

          {/* 업로드 진행률 */}
          {loading && uploadProgress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>업로드 진행률</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 리플레이 분석 결과 미리보기 */}
        {showAnalysisPreview && analysisResult && (
          <div className="mb-6 space-y-4">
            {/* 상단 매치 ID */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-3 border border-slate-600/30">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  리플레이 분석 완료
                </h4>
                <div className="text-right">
                  <div className="text-slate-400 text-xs">매치 ID</div>
                  <div className="text-white font-mono text-sm">{matchId}</div>
                </div>
              </div>
            </div>

            {/* 좌우 2분할 메인 콘텐츠 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 왼쪽: 게임 기본 정보 */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/30">
                <h5 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  게임 정보
                </h5>

                {/* 게임 기본 정보 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400 text-sm">전장</span>
                    <span className="text-white font-medium">{translateMap(analysisResult.basic?.mapName) || '알 수 없음'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400 text-sm">승리 팀</span>
                    <span className={`font-bold ${analysisResult.basic?.winner === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                      {analysisResult.basic?.winner === 'blue' ? '🔵 블루 팀' : '🔴 레드 팀'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400 text-sm">총 플레이어</span>
                    <span className="text-white font-medium">
                      {(analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0)}명
                    </span>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 매치 일치성 검증 - 체크리스트 형태 */}
              <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-slate-600/50">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.586-3.586a2 2 0 112.828 2.828l-8.414 8.414a2 2 0 01-1.414.586H6v-4a2 2 0 01.586-1.414l8.414-8.414z" />
                    </svg>
                    매치 일치성 검증
                  </h5>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
                    analysisResult.consistency?.status === 'excellent' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                    analysisResult.consistency?.status === 'good' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                    analysisResult.consistency?.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                    'bg-red-500/20 text-red-400 border-red-500/50'
                  }`}>
                    {analysisResult.consistency?.percentage || 0}%
                  </div>
                </div>

                {/* 체크리스트 형태의 검증 항목들 */}
                <div className="space-y-3 mb-4">
                  {/* 전장 일치 체크 */}
                  <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {(() => {
                        // 전장 일치 여부 확인
                        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
                        let expectedMap = null;
                        let isMapMatch = false;

                        try {
                          if (savedMatchInfo) {
                            const matchInfo = JSON.parse(savedMatchInfo);
                            expectedMap = matchInfo.map; // 한글 맵 이름

                            if (expectedMap && analysisResult.basic?.mapName) {
                              // 리플레이 맵 이름을 한글로 변환
                              const translatedReplayMap = translateMap(analysisResult.basic.mapName);
                              isMapMatch = expectedMap === translatedReplayMap;
                            }
                          }
                        } catch (err) {
                          console.error('매치 정보 파싱 오류:', err);
                        }

                        return isMapMatch ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        );
                      })()}
                    </div>
                    <span className="text-slate-300 text-sm flex-1">전장 일치</span>
                    <span className={`text-xs ${(() => {
                      const savedMatchInfo = localStorage.getItem('lastMatchInfo');
                      let expectedMap = null;
                      let isMapMatch = false;

                      try {
                        if (savedMatchInfo) {
                          const matchInfo = JSON.parse(savedMatchInfo);
                          expectedMap = matchInfo.map; // 한글 맵 이름

                          if (expectedMap && analysisResult.basic?.mapName) {
                            // 리플레이 맵 이름을 한글로 변환
                            const translatedReplayMap = translateMap(analysisResult.basic.mapName);
                            isMapMatch = expectedMap === translatedReplayMap;
                          }
                        }
                      } catch (err) {
                        console.error('매치 정보 파싱 오류:', err);
                      }

                      return isMapMatch ? 'text-green-400' : 'text-red-400';
                    })()}`}>
                      {(() => {
                        const savedMatchInfo = localStorage.getItem('lastMatchInfo');
                        let expectedMap = null;
                        let isMapMatch = false;

                        try {
                          if (savedMatchInfo) {
                            const matchInfo = JSON.parse(savedMatchInfo);
                            expectedMap = matchInfo.map; // 한글 맵 이름

                            if (expectedMap && analysisResult.basic?.mapName) {
                              // 리플레이 맵 이름을 한글로 변환
                              const translatedReplayMap = translateMap(analysisResult.basic.mapName);
                              isMapMatch = expectedMap === translatedReplayMap;
                            }
                          }
                        } catch (err) {
                          console.error('매치 정보 파싱 오류:', err);
                        }

                        return isMapMatch ? '✓' : '✗';
                      })()}
                    </span>
                  </div>

                  {/* 플레이어 수 체크 */}
                  <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {(() => {
                        const replayPlayerCount = (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0);
                        const isPlayerCountMatch = replayPlayerCount === 10;

                        return isPlayerCountMatch ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        );
                      })()}
                    </div>
                    <span className="text-slate-300 text-sm flex-1">플레이어 수 (10명)</span>
                    <span className={`text-xs ${(() => {
                      const replayPlayerCount = (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0);
                      const isPlayerCountMatch = replayPlayerCount === 10;
                      return isPlayerCountMatch ? 'text-green-400' : 'text-red-400';
                    })()}`}>
                      {(() => {
                        const replayPlayerCount = (analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0);
                        const isPlayerCountMatch = replayPlayerCount === 10;
                        return isPlayerCountMatch ? '✓' : '✗';
                      })()}
                    </span>
                  </div>

                  {/* 플레이어 일치율 체크 */}
                  <div className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {analysisResult.consistency?.percentage >= 80 ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : analysisResult.consistency?.percentage >= 50 ? (
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-slate-300 text-sm flex-1">플레이어 일치율</span>
                    <span className={`text-xs ${
                      analysisResult.consistency?.status === 'excellent' ? 'text-green-400' :
                      analysisResult.consistency?.status === 'good' ? 'text-blue-400' :
                      analysisResult.consistency?.status === 'warning' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {analysisResult.consistency?.percentage >= 80 ? '✓' :
                       analysisResult.consistency?.percentage >= 50 ? '⚠' : '✗'}
                    </span>
                  </div>
                </div>

                {/* 전체 상태 요약 */}
                <div className={`p-3 rounded-lg mb-4 border ${
                  analysisResult.consistency?.status === 'excellent' ? 'bg-green-900/20 border-green-500/30' :
                  analysisResult.consistency?.status === 'good' ? 'bg-blue-900/20 border-blue-500/30' :
                  analysisResult.consistency?.status === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30' :
                  'bg-red-900/20 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-5 h-5 ${
                      analysisResult.consistency?.status === 'excellent' ? 'text-green-400' :
                      analysisResult.consistency?.status === 'good' ? 'text-blue-400' :
                      analysisResult.consistency?.status === 'warning' ? 'text-yellow-400' :
                      'text-red-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {analysisResult.consistency?.status === 'excellent' || analysisResult.consistency?.status === 'good' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      )}
                    </svg>
                    <span className={`font-medium text-sm ${
                      analysisResult.consistency?.status === 'excellent' ? 'text-green-400' :
                      analysisResult.consistency?.status === 'good' ? 'text-blue-400' :
                      analysisResult.consistency?.status === 'warning' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {analysisResult.consistency?.status === 'excellent' ? '완벽한 일치' :
                       analysisResult.consistency?.status === 'good' ? '양호한 일치' :
                       analysisResult.consistency?.status === 'warning' ? '부분적 일치' :
                       '일치하지 않음'}
                    </span>
                  </div>
                </div>

                {/* 검증 로그 */}
                {analysisResult.consistency?.issues && analysisResult.consistency.issues.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-yellow-400 font-medium text-sm">검증 로그</span>
                    </div>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {analysisResult.consistency.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/30 rounded text-xs">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-slate-200 leading-relaxed">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 팀 정보 - 아래쪽으로 분리 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 레드 팀 */}
              <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-medium">레드 팀</span>
                  <span className="text-slate-400 text-sm">({analysisResult.teams?.red?.length || 0}명)</span>
                  {analysisResult.basic?.winner === 'red' && (
                    <span className="text-yellow-400 text-sm">👑 승리</span>
                  )}
                </div>
                <div className="space-y-2">
                  {analysisResult.teams?.red?.map((player, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-1">
                      <span className="text-white truncate">{player.name}</span>
                      <span className="text-red-400 text-sm ml-2">{player.hero}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 블루 팀 */}
              <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-400 font-medium">블루 팀</span>
                  <span className="text-slate-400 text-sm">({analysisResult.teams?.blue?.length || 0}명)</span>
                  {analysisResult.basic?.winner === 'blue' && (
                    <span className="text-yellow-400 text-sm">👑 승리</span>
                  )}
                </div>
                <div className="space-y-2">
                  {analysisResult.teams?.blue?.map((player, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-1">
                      <span className="text-white truncate">{player.name}</span>
                      <span className="text-blue-400 text-sm ml-2">{player.hero}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
            disabled={loading}
          >
            취소
          </button>

          {!showAnalysisPreview ? (
            <button
              onClick={handleAnalyzeReplay}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                loading
                  ? 'bg-blue-600/50 text-white/70 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
              }`}
              disabled={loading || !file}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>분석 중...</span>
                </div>
              ) : (
                '리플레이 분석'
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCompleteMatch}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  loading
                    ? 'bg-green-600/50 text-white/70 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>매치 완료 중...</span>
                  </div>
                ) : (
                  '매치 완료'
                )}
              </button>

              {/* 개발용 통계 정보 아이콘 - 오른쪽에 더 크게 */}
              {analysisResult && (
                <div className="relative group">
                  <div className="w-12 h-12 bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500/50 rounded-full flex items-center justify-center cursor-help transition-colors">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  {/* 상세 통계 툴팁 - 컴팩트하게 수정 */}
                  <div className="absolute bottom-full right-0 mb-3 w-[400px] max-h-[70vh] bg-slate-900 border border-slate-600 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                      {/* 툴팁 헤더 */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-white font-bold text-sm">리플레이 분석 통계</span>
                      </div>

                      {/* 게임 기본 정보 - 컴팩트 */}
                      <div className="mb-3">
                        <h4 className="text-xs font-bold text-slate-300 mb-2">게임 정보</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between p-2 bg-slate-800/50 rounded">
                            <span className="text-slate-400">전장:</span>
                            <span className="text-white font-medium truncate ml-1">{analysisResult.basic?.mapName || analysisResult.metadata?.mapName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-800/50 rounded">
                            <span className="text-slate-400">시간:</span>
                            <span className="text-white font-medium">
                              {(analysisResult.basic?.gameLength || analysisResult.metadata?.gameDuration) ?
                                `${Math.floor((analysisResult.basic?.gameLength || analysisResult.metadata?.gameDuration) / 60)}:${String((analysisResult.basic?.gameLength || analysisResult.metadata?.gameDuration) % 60).padStart(2, '0')}` :
                                'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-800/50 rounded">
                            <span className="text-slate-400">승리:</span>
                            <span className={`font-bold ${(analysisResult.basic?.winner || analysisResult.metadata?.winner) === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                              {(analysisResult.basic?.winner || analysisResult.metadata?.winner) === 'blue' ? '블루' : '레드'}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-slate-800/50 rounded">
                            <span className="text-slate-400">인원:</span>
                            <span className="text-white font-medium">
                              {(analysisResult.teams?.blue?.length || 0) + (analysisResult.teams?.red?.length || 0)}명
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 전체 통계 요약 - 컴팩트 */}
                      {analysisResult.statistics && (
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-slate-300 mb-2">전체 통계</h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex justify-between p-1.5 bg-slate-800/50 rounded">
                              <span className="text-slate-400">킬:</span>
                              <span className="text-white font-medium">{analysisResult.statistics.totalKills || 0}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-slate-800/50 rounded">
                              <span className="text-slate-400">데스:</span>
                              <span className="text-white font-medium">{analysisResult.statistics.totalDeaths || 0}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-slate-800/50 rounded">
                              <span className="text-slate-400">어시:</span>
                              <span className="text-white font-medium">{analysisResult.statistics.totalAssists || 0}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-slate-800/50 rounded">
                              <span className="text-slate-400">영웅딜:</span>
                              <span className="text-white font-medium">{Math.round((analysisResult.statistics.totalHeroDamage || 0) / 1000)}k</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-slate-800/50 rounded">
                              <span className="text-slate-400">공성딜:</span>
                              <span className="text-white font-medium">{Math.round((analysisResult.statistics.totalSiegeDamage || 0) / 1000)}k</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-slate-800/50 rounded">
                              <span className="text-slate-400">힐량:</span>
                              <span className="text-white font-medium">{Math.round((analysisResult.statistics.totalHealing || 0) / 1000)}k</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 팀별 상세 통계 - 간소화 */}
                      <div className="space-y-3">
                        {/* 블루팀 */}
                        {analysisResult.teams?.blue && analysisResult.teams.blue.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              블루팀 ({analysisResult.teams.blue.length}명)
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {analysisResult.teams.blue.map((player, index) => (
                                <div key={index} className="bg-blue-900/20 rounded p-2 border border-blue-500/20">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-white text-xs font-bold truncate max-w-[120px]">{player.name}</span>
                                    <span className="text-blue-400 text-xs">{player.hero}</span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1 text-xs">
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">K</div>
                                      <div className="text-white font-bold">{player.stats?.SoloKill || 0}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">D</div>
                                      <div className="text-white font-bold">{player.stats?.Deaths || 0}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">A</div>
                                      <div className="text-white font-bold">{player.stats?.Assists || 0}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">딜</div>
                                      <div className="text-white font-bold">{Math.round((player.stats?.HeroDamage || 0) / 1000)}k</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">힐</div>
                                      <div className="text-white font-bold">{Math.round((player.stats?.Healing || 0) / 1000)}k</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 레드팀 */}
                        {analysisResult.teams?.red && analysisResult.teams.red.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              레드팀 ({analysisResult.teams.red.length}명)
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {analysisResult.teams.red.map((player, index) => (
                                <div key={index} className="bg-red-900/20 rounded p-2 border border-red-500/20">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-white text-xs font-bold truncate max-w-[120px]">{player.name}</span>
                                    <span className="text-red-400 text-xs">{player.hero}</span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1 text-xs">
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">K</div>
                                      <div className="text-white font-bold">{player.stats?.SoloKill || 0}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">D</div>
                                      <div className="text-white font-bold">{player.stats?.Deaths || 0}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">A</div>
                                      <div className="text-white font-bold">{player.stats?.Assists || 0}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">딜</div>
                                      <div className="text-white font-bold">{Math.round((player.stats?.HeroDamage || 0) / 1000)}k</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-slate-400 text-[10px]">힐</div>
                                      <div className="text-white font-bold">{Math.round((player.stats?.Healing || 0) / 1000)}k</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 스크롤 힌트 */}
                      <div className="text-center mt-2 pt-2 border-t border-slate-700">
                        <span className="text-slate-500 text-[10px]">↕ 스크롤하여 더 보기</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplayUploadModal;
