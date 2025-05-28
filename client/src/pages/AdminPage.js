import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { toast } from 'react-toastify';
import { translateHeroName, translateMapName } from '../utils/heroTranslations';

const AdminPage = () => {
  const { isAuthenticated, user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    activeUsers: 0,
    recentMatches: 0
  });
  const [error, setError] = useState('');
  const [testAccountCount, setTestAccountCount] = useState(10);
  const [testMatchCount, setTestMatchCount] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [lastActionStatus, setLastActionStatus] = useState('');
  const [lastActionMessage, setLastActionMessage] = useState('');

  // 리플레이 분석 관련 상태
  const [replayFile, setReplayFile] = useState(null);
  const [replayAnalyzing, setReplayAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisLogs, setAnalysisLogs] = useState([]);

  useEffect(() => {
    // 관리자 확인
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }

    // 대시보드 통계 가져오기
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard');
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('통계 데이터 가져오기 오류:', err);
        setError('통계 데이터를 가져오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated, user]);

  // 테스트 계정 생성 함수
  const createTestAccounts = async () => {
    if (processing) return;

    try {
      setProcessing(true);
      setLastAction('계정 생성');
      setLastActionStatus('진행 중');
      setLastActionMessage(`${testAccountCount}개의 테스트 계정을 생성 중입니다...`);

      const response = await axios.post('/api/admin/create-test-accounts', { count: testAccountCount });
      toast.success(response.data.message);

      // 통계 업데이트
      const statsResponse = await axios.get('/api/admin/dashboard');
      setStats(statsResponse.data);

      setLastActionStatus('성공');
      setLastActionMessage(response.data.message);
    } catch (err) {
      console.error('테스트 계정 생성 오류:', err);
      const errorMsg = err.response?.data?.error ||
                       err.response?.data?.message ||
                       '테스트 계정 생성 중 오류가 발생했습니다.';
      toast.error(errorMsg);

      setLastActionStatus('실패');
      setLastActionMessage(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // 테스트 매치 생성 함수
  const createTestMatches = async () => {
    if (processing) return;

    try {
      setProcessing(true);
      setLastAction('매치 생성');
      setLastActionStatus('진행 중');
      setLastActionMessage(`${testMatchCount}개의 테스트 매치를 생성 중입니다...`);

      const response = await axios.post('/api/admin/create-test-matches', { count: testMatchCount });
      toast.success(response.data.message);

      // 통계 업데이트
      const statsResponse = await axios.get('/api/admin/dashboard');
      setStats(statsResponse.data);

      setLastActionStatus('성공');
      setLastActionMessage(response.data.message);
    } catch (err) {
      console.error('테스트 매치 생성 오류:', err);
      const errorMsg = err.response?.data?.error ||
                       err.response?.data?.message ||
                       '테스트 매치 생성 중 오류가 발생했습니다.';
      toast.error(errorMsg);

      setLastActionStatus('실패');
      setLastActionMessage(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // 리플레이 파일 선택 핸들러
  const handleReplayFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // .StormReplay 파일인지 확인
      if (!file.name.toLowerCase().endsWith('.stormreplay')) {
        toast.error('Heroes of the Storm 리플레이 파일(.StormReplay)만 업로드 가능합니다.');
        return;
      }
      setReplayFile(file);
      setAnalysisResult(null); // 이전 분석 결과 초기화
    }
  };

  // 리플레이 분석 함수
  const analyzeReplay = async () => {
    if (!replayFile || replayAnalyzing) return;

    try {
      setReplayAnalyzing(true);
      setLastAction('리플레이 분석');
      setLastActionStatus('진행 중');
      setLastActionMessage('리플레이 파일을 분석 중입니다...');

      // 이전 결과 및 오류 초기화
      setAnalysisResult(null);
      setAnalysisError(null);
      setAnalysisLogs([]);

      const formData = new FormData();
      formData.append('replayFile', replayFile);

      const response = await axios.post('/api/replay/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setAnalysisResult(response.data.analysisResult);
      setLastActionStatus('성공');
      setLastActionMessage('리플레이 분석이 완료되었습니다.');
      toast.success('리플레이 분석이 완료되었습니다!');

    } catch (err) {
      console.error('리플레이 분석 오류:', err);
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || '리플레이 분석 중 오류가 발생했습니다.';

      // 오류 정보 설정
      setAnalysisError(errorMsg);

      // 로그 정보가 있다면 설정
      if (errorData?.logs && Array.isArray(errorData.logs)) {
        setAnalysisLogs(errorData.logs);
      } else if (errorData?.error) {
        setAnalysisLogs([errorData.error]);
      }

      setLastActionStatus('실패');
      setLastActionMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setReplayAnalyzing(false);
    }
  };

  // 분석 결과 초기화
  const clearAnalysis = () => {
    setReplayFile(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisLogs([]);
    // 파일 입력 초기화
    const fileInput = document.getElementById('replayFileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // 시간 포맷팅 함수
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  // 전장명 한글 변환 함수
  const getKoreanMapName = (mapName) => {
    return translateMapName(mapName);
  };

  // 시뮬레이션 매치 여부 판별 함수
  const isSimulationMatch = (analysisResult, replayFile) => {
    // 1. 메타데이터에 시뮬레이션 플래그가 있는 경우
    if (analysisResult.metadata?.isSimulation) {
      return true;
    }

    // 2. 플레이어 이름이 시뮬레이션 패턴인 경우 (sim_team_playername)
    const allPlayers = [
      ...(analysisResult.teams?.blue || []),
      ...(analysisResult.teams?.red || [])
    ];

    const hasSimulationPlayers = allPlayers.some(player =>
      player.name && player.name.includes('sim_')
    );

    if (hasSimulationPlayers) {
      return true;
    }

    // 3. 파일명이 시뮬레이션 패턴인 경우
    if (replayFile && replayFile.name) {
      const simulationFilePattern = /simulation|sim_|test_/i;
      if (simulationFilePattern.test(replayFile.name)) {
        return true;
      }
    }

    // 4. localStorage에서 시뮬레이션 관련 정보 확인
    const isSimulating = localStorage.getItem('isSimulationRunning') === 'true';
    const simulatedPlayers = localStorage.getItem('simulatedPlayers');

    if (isSimulating || simulatedPlayers) {
      return true;
    }

    return false;
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // 에러 메시지 표시
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">
          &larr; 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 상태 표시줄 스타일
  const getStatusStyle = (status) => {
    switch (status) {
      case '성공':
        return 'bg-green-900/50 border-green-700 text-green-400';
      case '실패':
        return 'bg-red-900/50 border-red-700 text-red-400';
      case '진행 중':
        return 'bg-blue-900/50 border-blue-700 text-blue-400';
      default:
        return 'bg-slate-800 border-slate-700 text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">관리자 대시보드</h1>
          <p className="text-gray-400">HotsTinder 서비스 관리 페이지입니다.</p>
        </div>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">
          &larr; 홈으로 돌아가기
        </Link>
      </div>

      {/* 최근 작업 상태 표시 */}
      {lastAction && (
        <div className={`border p-4 rounded-lg mb-6 ${getStatusStyle(lastActionStatus)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {lastAction} - {lastActionStatus}
              </h3>
              <p>{lastActionMessage}</p>
            </div>
            {(processing || replayAnalyzing) && (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
            )}
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">총 사용자</h3>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">총 매치</h3>
          <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
        </div>
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">활성 사용자</h3>
          <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          <p className="text-xs text-gray-500">최근 7일 로그인</p>
        </div>
        <div className="bg-indigo-900/30 p-4 rounded-lg shadow-lg">
          <h3 className="text-gray-400 mb-1">최근 매치</h3>
          <p className="text-3xl font-bold text-white">{stats.recentMatches}</p>
          <p className="text-xs text-gray-500">최근 24시간</p>
        </div>
      </div>

      {/* 리플레이 분석 섹션 */}
      <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🎮 리플레이 분석 도구</h2>
        <p className="text-gray-400 mb-4">Heroes of the Storm 리플레이 파일을 업로드하여 실제 게임 통계를 분석합니다.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              리플레이 파일 선택 (.StormReplay)
            </label>
            <input
              id="replayFileInput"
              type="file"
              accept=".StormReplay"
              onChange={handleReplayFileChange}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer"
            />
            {replayFile && (
              <div className="mt-2 text-sm text-gray-400">
                선택된 파일: <span className="text-white">{replayFile.name}</span>
                <span className="ml-2">({(replayFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={analyzeReplay}
              disabled={!replayFile || replayAnalyzing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {replayAnalyzing && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              )}
              <span>{replayAnalyzing ? '분석 중...' : '분석 시작'}</span>
            </button>

            {(replayFile || analysisResult) && (
              <button
                onClick={clearAnalysis}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 분석 오류 및 로그 표시 */}
        {analysisError && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-4">❌ 분석 실패</h3>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-300 mb-2">오류 메시지:</h4>
              <p className="text-red-200 bg-red-900/30 p-3 rounded text-sm">{analysisError}</p>
            </div>

            {analysisLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-300 mb-2">상세 로그:</h4>
                <div className="bg-black/50 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
                  {analysisLogs.map((log, index) => (
                    <div key={index} className={`mb-1 ${
                      log.includes('[ERROR]') ? 'text-red-400' :
                        log.includes('[WARN]') ? 'text-yellow-400' :
                          log.includes('[DEBUG]') ? 'text-blue-400' :
                            'text-gray-300'
                    }`}>
                      {log}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  <p><strong>문제 해결 방법:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>리플레이 파일이 손상되지 않았는지 확인</li>
                    <li>지원되는 게임 버전인지 확인 (최신 패치는 지원 지연 가능)</li>
                    <li>시스템 리소스가 충분한지 확인</li>
                    <li>AI 플레이어가 포함된 게임이 아닌지 확인</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 분석 결과 표시 */}
        {analysisResult && (
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">📊 분석 결과</h3>

            {/* 기본 게임 정보 */}
            <div className="bg-slate-600/50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">전장</h4>
                  <p className="text-white font-semibold text-lg">{getKoreanMapName(analysisResult.basic?.map)}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">게임 시간</h4>
                  <p className="text-white font-semibold text-lg">
                    {analysisResult.basic?.gameLength ? formatDuration(analysisResult.basic.gameLength) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">승리 팀</h4>
                  <p className={`font-semibold text-lg ${analysisResult.basic?.winner === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                    {analysisResult.basic?.winner === 'blue' ? '블루 팀' : '레드 팀'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">매치 유형</h4>
                  <p className={`font-semibold text-lg ${isSimulationMatch(analysisResult, replayFile) ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isSimulationMatch(analysisResult, replayFile) ? '🎮 시뮬레이션' : '⚔️ 실제 매치'}
                  </p>
                </div>
              </div>
            </div>

            {/* 팀별 통계 */}
            {analysisResult.teams && (
              <div className="space-y-6">
                {/* 레드 팀 */}
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold text-lg mb-4">🔴 레드 팀</h4>

                  {/* 헤더 */}
                  <div className="grid grid-cols-9 gap-2 text-sm font-bold text-gray-200 mb-3 px-2 py-2 bg-slate-600/30 rounded">
                    <div className="col-span-2">플레이어 (영웅)</div>
                    <div className="text-center">킬</div>
                    <div className="text-center">데스</div>
                    <div className="text-center">어시스트</div>
                    <div className="text-center">공성 피해</div>
                    <div className="text-center">영웅 피해</div>
                    <div className="text-center">치유량</div>
                    <div className="text-center">경험치 기여도</div>
                  </div>

                  {/* 플레이어 데이터 */}
                  <div className="space-y-2">
                    {(analysisResult.teams.red || []).map((player, index) => (
                      <div key={index} className="grid grid-cols-9 gap-2 text-sm bg-slate-700/40 rounded-lg px-3 py-3 hover:bg-slate-700/60 transition-colors items-center border border-slate-600/30">
                        <div className="col-span-2 text-red-300">
                          <div className="font-bold text-base truncate" title={player.name || `Player${index + 1}`}>
                            {player.name || `Player${index + 1}`}
                          </div>
                          <div className="text-gray-400 text-sm truncate" title={translateHeroName(player.hero) || 'Unknown'}>
                            {translateHeroName(player.hero) || 'Unknown'}
                          </div>
                        </div>
                        <div className="text-center text-green-400 font-bold text-base">{player.stats?.SoloKill || 0}</div>
                        <div className="text-center text-red-400 font-bold text-base">{player.stats?.Deaths || 0}</div>
                        <div className="text-center text-yellow-400 font-bold text-base">{player.stats?.Assists || 0}</div>
                        <div className="text-center text-cyan-400 font-medium text-sm">{(player.stats?.SiegeDamage || 0).toLocaleString()}</div>
                        <div className="text-center text-orange-400 font-medium text-sm">{(player.stats?.HeroDamage || 0).toLocaleString()}</div>
                        <div className="text-center text-green-400 font-medium text-sm">{(player.stats?.Healing || 0).toLocaleString()}</div>
                        <div className="text-center text-purple-400 font-medium text-sm">{(player.stats?.ExperienceContribution || 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 블루 팀 */}
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold text-lg mb-4">🔵 블루 팀</h4>

                  {/* 헤더 */}
                  <div className="grid grid-cols-9 gap-2 text-sm font-bold text-gray-200 mb-3 px-2 py-2 bg-slate-600/30 rounded">
                    <div className="col-span-2">플레이어 (영웅)</div>
                    <div className="text-center">킬</div>
                    <div className="text-center">데스</div>
                    <div className="text-center">어시스트</div>
                    <div className="text-center">공성 피해</div>
                    <div className="text-center">영웅 피해</div>
                    <div className="text-center">치유량</div>
                    <div className="text-center">경험치 기여도</div>
                  </div>

                  {/* 플레이어 데이터 */}
                  <div className="space-y-2">
                    {(analysisResult.teams.blue || []).map((player, index) => (
                      <div key={index} className="grid grid-cols-9 gap-2 text-sm bg-slate-700/40 rounded-lg px-3 py-3 hover:bg-slate-700/60 transition-colors items-center border border-slate-600/30">
                        <div className="col-span-2 text-blue-300">
                          <div className="font-bold text-base truncate" title={player.name || `Player${index + 1}`}>
                            {player.name || `Player${index + 1}`}
                          </div>
                          <div className="text-gray-400 text-sm truncate" title={translateHeroName(player.hero) || 'Unknown'}>
                            {translateHeroName(player.hero) || 'Unknown'}
                          </div>
                        </div>
                        <div className="text-center text-green-400 font-bold text-base">{player.stats?.SoloKill || 0}</div>
                        <div className="text-center text-red-400 font-bold text-base">{player.stats?.Deaths || 0}</div>
                        <div className="text-center text-yellow-400 font-bold text-base">{player.stats?.Assists || 0}</div>
                        <div className="text-center text-cyan-400 font-medium text-sm">{(player.stats?.SiegeDamage || 0).toLocaleString()}</div>
                        <div className="text-center text-orange-400 font-medium text-sm">{(player.stats?.HeroDamage || 0).toLocaleString()}</div>
                        <div className="text-center text-green-400 font-medium text-sm">{(player.stats?.Healing || 0).toLocaleString()}</div>
                        <div className="text-center text-purple-400 font-medium text-sm">{(player.stats?.ExperienceContribution || 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 추가 정보 */}
            <div className="mt-6 bg-slate-600/30 p-3 rounded">
              <h4 className="text-sm text-gray-400 mb-2">파일 정보</h4>
              <div className="text-sm text-gray-300 grid grid-cols-1 md:grid-cols-3 gap-2">
                <span>파일명: {replayFile ? replayFile.name : 'Unknown'}</span>
                <span>분석 시간: {analysisResult.basic?.uploadedAt ? new Date(analysisResult.basic.uploadedAt).toLocaleString('ko-KR') : 'Unknown'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/admin/users" className="block">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg hover:bg-slate-700 transition-colors">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">계정 관리</h2>
            <p className="text-gray-400 mb-4">
              사용자 계정 정보를 조회하고 관리합니다. 프로필 정보 편집, 계정 삭제 및 권한 관리를 수행할 수 있습니다.
            </p>
            <span className="text-indigo-300 inline-flex items-center">
              관리하기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </Link>
        <Link to="/admin/matches" className="block">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg hover:bg-slate-700 transition-colors">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">매치 관리</h2>
            <p className="text-gray-400 mb-4">
              게임 매치 기록을 조회하고 관리합니다. 매치 세부 정보 확인, 결과 수정, 무효화 처리 및 MMR 조정이 가능합니다.
            </p>
            <span className="text-indigo-300 inline-flex items-center">
              관리하기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </Link>
      </div>

      {/* 테스트 데이터 관리 섹션 */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold text-indigo-400 mb-4">테스트 데이터 생성</h2>
        <p className="text-gray-400 mb-6">
          개발 및 테스트를 위한 더미 데이터를 생성합니다. 테스트 계정과 테스트 매치를 자동으로 생성할 수 있습니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 테스트 계정 생성 */}
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-300 mb-3">테스트 계정 생성</h3>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="testAccountCount">
                생성할 계정 수 (1~50):
              </label>
              <input
                type="number"
                id="testAccountCount"
                min="1"
                max="50"
                value={testAccountCount}
                onChange={(e) => setTestAccountCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={processing}
              />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              배틀태그, MMR, 승패, 역할, 영웅 등이 임의로 설정된 테스트 계정을 생성합니다.
            </p>
            <button
              onClick={createTestAccounts}
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {processing && lastAction === '계정 생성' ? '처리 중...' : '테스트 계정 생성'}
            </button>
          </div>

          {/* 테스트 매치 생성 */}
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-300 mb-3">테스트 매치 생성</h3>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="testMatchCount">
                생성할 매치 수 (1~20):
              </label>
              <input
                type="number"
                id="testMatchCount"
                min="1"
                max="20"
                value={testMatchCount}
                onChange={(e) => setTestMatchCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={processing}
              />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              DB에 있는 계정을 사용하여 임의의 매치 기록을 생성합니다. 최소 10명의 계정이 필요합니다.
            </p>
            <button
              onClick={createTestMatches}
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {processing && lastAction === '매치 생성' ? '처리 중...' : '테스트 매치 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* 추가 관리 기능 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/settings" className="bg-slate-700/50 p-4 rounded-lg flex items-center hover:bg-slate-700 transition-colors">
          <div className="bg-indigo-800/50 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">시스템 설정</h3>
            <p className="text-gray-400 text-sm">서비스 환경 설정 관리</p>
          </div>
        </Link>
        <Link to="/admin/logs" className="bg-slate-700/50 p-4 rounded-lg flex items-center hover:bg-slate-700 transition-colors">
          <div className="bg-indigo-800/50 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">시스템 로그</h3>
            <p className="text-gray-400 text-sm">활동 로그 및 오류 기록</p>
          </div>
        </Link>
        <Link to="/admin/stats" className="bg-slate-700/50 p-4 rounded-lg flex items-center hover:bg-slate-700 transition-colors">
          <div className="bg-indigo-800/50 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">통계 분석</h3>
            <p className="text-gray-400 text-sm">서비스 사용 현황 및 통계</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminPage;