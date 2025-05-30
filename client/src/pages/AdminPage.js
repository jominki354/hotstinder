import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import { toast } from 'react-toastify';
import { translateHero, translateMap, translateTeam } from '../utils/hotsTranslations';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminPage = () => {
  const { isAuthenticated, user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 기본 탭을 대시보드로 설정
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

  // 디버깅 관련 상태
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugData, setDebugData] = useState({
    endpoints: null,
    database: null,
    models: null,
    testResults: null
  });
  const [debugError, setDebugError] = useState(null);

  const navigate = useNavigate();

  // 디버깅용 로그 추가
  useEffect(() => {
    console.log('🔍 AdminPage - activeTab 변경:', activeTab);
  }, [activeTab]);

  // 페이지 로드 시 기본 탭 확인
  useEffect(() => {
    console.log('🔍 AdminPage - 컴포넌트 마운트, 기본 탭:', activeTab);
    // 강제로 dashboard 탭으로 설정
    if (activeTab !== 'dashboard') {
      console.log('🔧 기본 탭을 dashboard로 강제 설정');
      setActiveTab('dashboard');
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      console.log('🔍 대시보드 데이터 요청 시작');
      console.log('📍 API URL:', axios.defaults.baseURL);
      console.log('🔑 토큰 존재:', !!token);
      console.log('👤 사용자 정보:', user);

      const response = await axios.get('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          t: Date.now() // 캐시 방지용 타임스탬프
        }
      });

      console.log('✅ 대시보드 응답 성공:', response.data);
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('❌ 대시보드 데이터 가져오기 오류:', err);
      console.error('📊 오류 상세:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL
        }
      });
      setError('대시보드 데이터를 가져오는데 실패했습니다.');
      toast.error('대시보드 데이터를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, user, fetchDashboardData]);

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

      // 디버깅을 위한 콘솔 출력
      console.log('🎮 리플레이 분석 결과:', response.data.analysisResult);
      console.log('📊 메타데이터:', response.data.analysisResult?.metadata);
      console.log('👥 팀 데이터:', response.data.analysisResult?.teams);
      console.log('📈 통계:', response.data.analysisResult?.statistics);

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
    return translateMap(mapName);
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

  // 클라이언트 에러를 서버로 전송하는 함수
  const reportClientError = async (error, context = {}) => {
    try {
      await axios.post('/api/debug/client-error', {
        error: error.message || String(error),
        stack: error.stack || 'No stack trace',
        component: 'AdminPage',
        action: context.action || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        context
      });
      console.log('✅ 에러가 서버에 리포팅되었습니다:', error.message);
    } catch (reportError) {
      console.warn('❌ 에러 리포팅 실패:', reportError);
    }
  };

  // React 에러 캐치
  useEffect(() => {
    const handleError = (event) => {
      console.error('🔴 전역 에러 캐치:', event.error);
      reportClientError(event.error, { action: 'global-error', type: 'unhandled-error' });
    };

    const handleRejection = (event) => {
      console.error('🔴 Promise 거부 캐치:', event.reason);
      reportClientError(new Error(event.reason), { action: 'global-error', type: 'unhandled-rejection' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // 안전한 값 렌더링 함수
  const safeRender = (value) => {
    try {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    } catch (error) {
      reportClientError(error, { action: 'safeRender', value: typeof value });
      return 'Error rendering value';
    }
  };

  // 안전한 날짜 렌더링 함수
  const safeRenderDate = (value) => {
    try {
      if (!value) return '없음';
      if (typeof value === 'object') return new Date().toLocaleString();
      return String(value);
    } catch (error) {
      reportClientError(error, { action: 'safeRenderDate', value: typeof value });
      return '날짜 오류';
    }
  };

  // 디버그 데이터 로드 함수
  const loadDebugData = async (type) => {
    setDebugLoading(true);
    setDebugError(null);

    try {
      let response;
      switch (type) {
        case 'endpoints':
          response = await axios.get('/api/debug/endpoints');
          break;
        case 'database':
          response = await axios.get('/api/debug/database');
          break;
        case 'models':
          response = await axios.get('/api/debug/models');
          break;
        case 'test':
          response = await axios.get('/api/debug/test-endpoints');
          break;
        default:
          throw new Error('Unknown data type');
      }

      setDebugData(prev => ({
        ...prev,
        [type === 'test' ? 'testResults' : type]: response.data
      }));
    } catch (err) {
      console.error(`${type} 데이터 로드 오류:`, err);
      setDebugError(`${type} 데이터를 불러오는데 실패했습니다: ${err.message}`);

      // 클라이언트 에러를 서버로 전송
      try {
        await axios.post('/api/debug/client-error', {
          error: err.message,
          stack: err.stack,
          component: 'AdminPage',
          action: `loadDebugData(${type})`,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      } catch (reportError) {
        console.warn('에러 리포팅 실패:', reportError);
      }
    } finally {
      setDebugLoading(false);
    }
  };

  // 탭 변경 시 디버그 데이터 로드
  useEffect(() => {
    if (activeTab.startsWith('debug-')) {
      const debugType = activeTab.replace('debug-', '');
      loadDebugData(debugType === 'test' ? 'test' : debugType);
    } else if (activeTab === 'users') {
      // 사용자 관리 페이지로 이동
      navigate('/admin/users');
    } else if (activeTab === 'matches') {
      // 매치 관리 페이지로 이동
      navigate('/admin/matches');
    }
  }, [activeTab, navigate]);

  // 상태에 따른 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
      case 'connected':
      case true:
        return 'text-green-400';
      case 'error':
      case 'disconnected':
      case false:
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  // HTTP 메서드에 따른 색상 반환
  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-green-600';
      case 'POST':
        return 'bg-blue-600';
      case 'PUT':
        return 'bg-yellow-600';
      case 'DELETE':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  // 엔드포인트 탭 렌더링
  const renderEndpointsTab = () => {
    if (!debugData.endpoints) return null;

    return (
      <div className="space-y-6">
        {/* 요약 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">총 엔드포인트</h3>
            <p className="text-3xl font-bold text-blue-400">{safeRender(debugData.endpoints.totalEndpoints)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">사용 가능</h3>
            <p className="text-3xl font-bold text-green-400">{safeRender(debugData.endpoints.availableEndpoints)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">오류</h3>
            <p className="text-3xl font-bold text-red-400">{safeRender(debugData.endpoints.errorEndpoints)}</p>
          </div>
        </div>

        {/* 엔드포인트 목록 */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">메서드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">경로</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">설명</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">인증 필요</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {debugData.endpoints.endpoints && debugData.endpoints.endpoints.map((endpoint, index) => (
                  <tr key={index} className="hover:bg-slate-700">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getMethodColor(endpoint.method)}`}>
                        {safeRender(endpoint.method)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-mono">{safeRender(endpoint.path)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{safeRender(endpoint.description)}</td>
                    <td className="px-4 py-3 text-center">
                      {endpoint.requiresAuth ? (
                        <span className="text-yellow-400">✓</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${getStatusColor(endpoint.status)}`}>
                        {safeRender(endpoint.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 데이터베이스 탭 렌더링
  const renderDatabaseTab = () => {
    if (!debugData.database) return null;

    return (
      <div className="space-y-6">
        {/* 연결 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">연결 정보</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">상태:</span>
                <span className={`font-medium ${getStatusColor(debugData.database.status)}`}>
                  {debugData.database.status}
                </span>
        </div>
              <div className="flex justify-between">
                <span className="text-gray-400">데이터베이스:</span>
                <span className="text-white">{safeRender(debugData.database.database)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">호스트:</span>
                <span className="text-white">{safeRender(debugData.database.host)}:{safeRender(debugData.database.port)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">사용자:</span>
                <span className="text-white">{safeRender(debugData.database.user)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">통계</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">테이블 수:</span>
                <span className="text-blue-400 font-bold">{safeRender(debugData.database.tablesCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">모델 수:</span>
                <span className="text-green-400 font-bold">{safeRender(debugData.database.modelsCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">오류 수:</span>
                <span className="text-red-400 font-bold">{safeRender(debugData.database.errors?.length || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오류 목록 */}
        {debugData.database.errors && debugData.database.errors.length > 0 && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-2">오류 목록</h3>
            <ul className="space-y-1">
              {debugData.database.errors.map((error, index) => (
                <li key={index} className="text-red-300 text-sm">{safeRender(error)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 테이블 목록 */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">테이블 목록</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {debugData.database.tables && debugData.database.tables.map((table, index) => (
              <div key={index} className="bg-slate-700 p-3 rounded">
                <h4 className="font-medium text-white">{safeRender(table.table_name)}</h4>
                <p className="text-sm text-gray-400">스키마: {safeRender(table.table_schema)}</p>
                {debugData.database.tableDetails && debugData.database.tableDetails[table.table_name] && (
                  <p className="text-xs text-blue-400 mt-1">
                    컬럼 {safeRender(debugData.database.tableDetails[table.table_name].length)}개
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 모델 탭 렌더링
  const renderModelsTab = () => {
    if (!debugData.models) return null;

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">모델 개수</h3>
          <p className="text-3xl font-bold text-blue-400">{safeRender(debugData.models.modelsCount)}</p>
        </div>

        <div className="space-y-4">
          {debugData.models.models && Object.entries(debugData.models.models).map(([modelName, modelInfo]) => (
            <div key={modelName} className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">{safeRender(modelName)}</h3>

              {modelInfo.error ? (
                <div className="text-red-400">오류: {safeRender(modelInfo.error)}</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">테이블명: {safeRender(modelInfo.tableName)}</h4>
                  </div>

                  {/* 속성 목록 */}
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">속성 ({safeRender(modelInfo.attributes?.length || 0)}개)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-2 text-gray-400">속성명</th>
                            <th className="text-left py-2 text-gray-400">DB 필드명</th>
                            <th className="text-left py-2 text-gray-400">타입</th>
                            <th className="text-left py-2 text-gray-400">NULL 허용</th>
                            <th className="text-left py-2 text-gray-400">기본값</th>
                            <th className="text-left py-2 text-gray-400">기타</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modelInfo.attributes && modelInfo.attributes.map((attr, idx) => (
                            <tr key={idx} className="border-b border-slate-700">
                              <td className="py-1 text-white font-mono">{safeRender(attr.name)}</td>
                              <td className="py-1 text-blue-400">{safeRender(attr.field)}</td>
                              <td className="py-1 text-green-400">{safeRender(attr.type)}</td>
                              <td className="py-1 text-gray-300">{attr.allowNull ? 'Yes' : 'No'}</td>
                              <td className="py-1 text-gray-300">{safeRender(attr.defaultValue) || '-'}</td>
                              <td className="py-1 text-yellow-400">
                                {attr.primaryKey && 'PK '}
                                {attr.autoIncrement && 'AI'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 연관관계 */}
                  {modelInfo.associations && modelInfo.associations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">연관관계 ({safeRender(modelInfo.associations.length)}개)</h4>
                      <div className="space-y-2">
                        {modelInfo.associations.map((assoc, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <span className="text-white">{safeRender(assoc.name)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-blue-400">{safeRender(assoc.type)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-400">{safeRender(assoc.target)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 테스트 결과 탭 렌더링
  const renderTestTab = () => {
    if (!debugData.testResults) return null;

    return (
      <div className="space-y-6">
        {/* 요약 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">총 테스트</h3>
            <p className="text-3xl font-bold text-blue-400">{safeRender(debugData.testResults.summary?.total)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">성공</h3>
            <p className="text-3xl font-bold text-green-400">{safeRender(debugData.testResults.summary?.success)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">실패</h3>
            <p className="text-3xl font-bold text-red-400">{safeRender(debugData.testResults.summary?.errors)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">성공률</h3>
            <p className="text-3xl font-bold text-yellow-400">{safeRender(debugData.testResults.summary?.successRate)}</p>
          </div>
        </div>

        {/* 테스트 결과 목록 */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">엔드포인트</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">응답시간</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">성공</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Content-Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">오류</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {debugData.testResults.results && debugData.testResults.results.map((result, index) => (
                  <tr key={index} className="hover:bg-slate-700">
                    <td className="px-4 py-3 text-sm text-white font-mono">{safeRender(result.endpoint)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {safeRender(result.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-300">
                      {result.responseTime ? `${safeRender(result.responseTime)}ms` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${getStatusColor(result.success)}`}>
                        {result.success ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{safeRender(result.contentType) || '-'}</td>
                    <td className="px-4 py-3 text-sm text-red-400">{safeRender(result.error) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">관리자 대시보드</h1>
          <p className="text-gray-400">HotsTinder 서비스 관리 페이지입니다.</p>
        </div>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">
          &larr; 홈으로 돌아가기
        </Link>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
          {[
            { id: 'dashboard', label: '📊 대시보드' },
            { id: 'users', label: '👥 사용자 관리' },
            { id: 'matches', label: '🎮 매치 관리' },
            { id: 'replay', label: '📹 리플레이 분석' },
            { id: 'debug-endpoints', label: '🔧 API 엔드포인트' },
            { id: 'debug-database', label: '🗄️ 데이터베이스' },
            { id: 'debug-models', label: '📋 모델 정보' },
            { id: 'debug-test', label: '🧪 실시간 테스트' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                console.log('🔍 탭 클릭:', tab.id, '현재 탭:', activeTab);
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
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
            {(processing || replayAnalyzing || debugLoading) && (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
            )}
          </div>
        </div>
      )}

      {/* 디버그 에러 메시지 */}
      {debugError && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{safeRender(debugError)}</p>
        </div>
      )}

      {/* 탭 내용 */}
      <div className="min-h-96">
        {/* 디버깅 정보 */}
        <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
          현재 활성 탭: {activeTab}
        </div>

        {activeTab === 'dashboard' && (
          <>
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

            {/* 관리 도구 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 테스트 데이터 생성 도구 */}
              <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">🛠️ 테스트 데이터 생성</h2>
                <p className="text-gray-400 mb-4">개발 및 테스트를 위한 더미 데이터를 생성합니다.</p>

        <div className="space-y-4">
          <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      생성할 테스트 계정 수
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={testAccountCount}
                      onChange={(e) => setTestAccountCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={createTestAccounts}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {processing && lastAction === '계정 생성' ? '생성 중...' : '테스트 계정 생성'}
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      생성할 테스트 매치 수
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={testMatchCount}
                      onChange={(e) => setTestMatchCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={createTestMatches}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {processing && lastAction === '매치 생성' ? '생성 중...' : '테스트 매치 생성'}
                  </button>
                </div>
              </div>

              {/* 빠른 링크 */}
              <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">🔗 빠른 링크</h2>
                <div className="space-y-3">
                  <Link
                    to="/admin/users"
                    className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors"
                  >
                    👥 사용자 관리
                  </Link>
                  <Link
                    to="/admin/matches"
                    className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center transition-colors"
                  >
                    🎮 매치 관리
                  </Link>
                  <button
                    onClick={() => setActiveTab('debug-endpoints')}
                    className="block w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center transition-colors"
                  >
                    🔧 시스템 디버깅
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">👥 사용자 관리</h2>
            <p className="text-gray-400 mb-4">사용자 관리 페이지로 이동 중입니다...</p>
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">🎮 매치 관리</h2>
            <p className="text-gray-400 mb-4">매치 관리 페이지로 이동 중입니다...</p>
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        )}

        {activeTab === 'replay' && (
          <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">🎮 리플레이 분석 도구</h2>
            <p className="text-gray-400 mb-4">Heroes of the Storm 리플레이 파일을 업로드하여 실제 게임 통계를 분석합니다.</p>

            {/* 파일 업로드 섹션 */}
            <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              리플레이 파일 선택 (.StormReplay)
            </label>
            <input
              id="replayFileInput"
              type="file"
              accept=".StormReplay"
              onChange={handleReplayFileChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {replayFile && (
                <p className="mt-2 text-sm text-green-400">
                  선택된 파일: {replayFile.name} ({(replayFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
            )}
          </div>

            {/* 분석 버튼 */}
            <div className="mb-6 flex space-x-4">
            <button
              onClick={analyzeReplay}
              disabled={!replayFile || replayAnalyzing}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                {replayAnalyzing ? '분석 중...' : '리플레이 분석 시작'}
            </button>

              <button
                onClick={clearAnalysis}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                초기화
              </button>
        </div>

            {/* 분석 오류 표시 */}
        {analysisError && (
              <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">분석 오류</h3>
                <p className="text-red-300">{analysisError}</p>

                {/* 오류 로그 표시 */}
            {analysisLogs.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-red-400 mb-2">상세 로그:</h4>
                    <div className="bg-black/30 p-3 rounded text-xs text-gray-300 max-h-40 overflow-y-auto">
                  {analysisLogs.map((log, index) => (
                        <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 분석 결과 표시 */}
        {analysisResult && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">분석 결과</h3>

                {/* 시뮬레이션 매치 경고 */}
                {isSimulationMatch(analysisResult, replayFile) && (
                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-yellow-400 font-medium">시뮬레이션 매치 감지됨</span>
                </div>
                    <p className="text-yellow-300 mt-2">이 리플레이는 시뮬레이션으로 생성된 매치입니다.</p>
                </div>
                )}

                {/* 매치 카드 스타일로 변경 */}
                <div className="bg-slate-900/80 rounded-lg shadow-lg overflow-hidden border border-slate-700">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-xl">🎮</span>
                </div>

                <div>
                        <h3 className="text-lg font-bold text-white">
                          {getKoreanMapName(analysisResult.metadata?.mapName) || '알 수 없음'}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>게임 시간: {analysisResult.metadata?.gameDuration ? formatDuration(analysisResult.metadata.gameDuration) : '알 수 없음'}</p>
                </div>
              </div>
            </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg font-medium ${analysisResult.metadata?.winner === 'red' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}>
                          <span>레드팀</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-slate-500 text-xs">VS</span>
                          {analysisResult.metadata?.winner && (
                            <div className="mt-1 text-xs font-medium text-center">
                              {analysisResult.metadata.winner === 'red' ? (
                                <span className="text-red-400">승리 ←</span>
                              ) : (
                                <span className="text-blue-400">→ 승리</span>
                              )}
                            </div>
                          )}
                  </div>

                        <div className={`px-4 py-2 rounded-lg font-medium ${analysisResult.metadata?.winner === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}>
                          <span>블루팀</span>
                          </div>
                          </div>
                        </div>
                      </div>

                  {/* 매치 상세 정보 */}
                  <div className="p-5 bg-slate-900/50">
                    <div className="space-y-6">
                      {/* 레드 팀 */}
                      <div className={`w-full p-4 rounded-lg ${analysisResult.metadata?.winner === 'red' ? 'bg-red-900/20 border border-red-800/30' : 'bg-slate-800/50 border border-slate-700/30'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-red-300 font-bold">레드 팀</h4>
                          {analysisResult.metadata?.winner === 'red' && <div className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">승리</div>}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-700/50">
                                <th className="text-left py-3 px-3 font-medium text-sm min-w-[120px]">플레이어</th>
                                <th className="text-left py-3 px-3 font-medium text-sm min-w-[100px]">영웅</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">킬</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">데스</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">어시</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">레벨</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="영웅 피해량">영웅딜</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="공성 피해량">공성딜</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="치유량">힐량</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="경험치 기여도">경험치</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResult.teams?.red?.map((player, index) => {
                                // 디버깅을 위한 플레이어 데이터 출력
                                console.log(`🔴 레드팀 플레이어 ${index + 1}:`, {
                                  name: player.name,
                                  hero: player.hero,
                                  stats: player.stats,
                                  heroLevel: player.heroLevel,
                                  level: player.level,
                                  kills: player.kills,
                                  deaths: player.deaths,
                                  assists: player.assists
                                });

                                // 레드팀에서 레벨이 가장 높은 플레이어 확인
                                const isHighestLevel = player.stats?.Level &&
                                  Math.max(...analysisResult.teams.red
                                    .filter(p => p.stats?.Level)
                                    .map(p => p.stats.Level)) === player.stats.Level;

                                return (
                                  <tr key={`red-${index}`} className="border-b border-slate-700/30 hover:bg-red-900/10">
                                    <td className="py-3 px-3 text-white">
                                      <div className="flex items-center">
                                        {isHighestLevel && <span className="text-yellow-400 mr-2 text-sm">👑</span>}
                                        <span className="text-sm whitespace-nowrap" title={player.name || '알 수 없음'}>
                                          {player.name || '알 수 없음'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-red-300 text-sm whitespace-nowrap" title={translateHero(player.hero) || '알 수 없음'}>
                                      {translateHero(player.hero) || '알 수 없음'}
                                    </td>
                                    <td className="py-3 px-3 text-center text-green-400 font-bold text-sm">
                                      {player.stats?.SoloKill || player.kills || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-red-400 font-bold text-sm">
                                      {player.stats?.Deaths || player.deaths || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-yellow-400 font-bold text-sm">
                                      {player.stats?.Assists || player.assists || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-indigo-400 font-bold text-sm">
                                      {player.stats?.Level || player.heroLevel || player.level || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-orange-400 font-semibold text-sm">{(player.stats?.HeroDamage || player.heroDamage || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-cyan-400 font-semibold text-sm">{(player.stats?.SiegeDamage || player.siegeDamage || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-purple-400 font-semibold text-sm">{(player.stats?.Healing || player.healing || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-green-300 font-semibold text-sm">{(player.stats?.ExperienceContribution || player.stats?.Experience || 0).toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                  </div>
                </div>

                {/* 블루 팀 */}
                      <div className={`w-full p-4 rounded-lg ${analysisResult.metadata?.winner === 'blue' ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-slate-800/50 border border-slate-700/30'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-blue-300 font-bold">블루 팀</h4>
                          {analysisResult.metadata?.winner === 'blue' && <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">승리</div>}
                  </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-700/50">
                                <th className="text-left py-3 px-3 font-medium text-sm min-w-[120px]">플레이어</th>
                                <th className="text-left py-3 px-3 font-medium text-sm min-w-[100px]">영웅</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">킬</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">데스</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">어시</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[50px]">레벨</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="영웅 피해량">영웅딜</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="공성 피해량">공성딜</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="치유량">힐량</th>
                                <th className="text-center py-3 px-3 font-medium text-sm min-w-[100px]" title="경험치 기여도">경험치</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResult.teams?.blue?.map((player, index) => {
                                // 디버깅을 위한 플레이어 데이터 출력
                                console.log(`🔵 블루팀 플레이어 ${index + 1}:`, {
                                  name: player.name,
                                  hero: player.hero,
                                  stats: player.stats,
                                  heroLevel: player.heroLevel,
                                  level: player.level,
                                  kills: player.kills,
                                  deaths: player.deaths,
                                  assists: player.assists
                                });

                                // 블루팀에서 레벨이 가장 높은 플레이어 확인
                                const isHighestLevel = player.stats?.Level &&
                                  Math.max(...analysisResult.teams.blue
                                    .filter(p => p.stats?.Level)
                                    .map(p => p.stats.Level)) === player.stats.Level;

                                return (
                                  <tr key={`blue-${index}`} className="border-b border-slate-700/30 hover:bg-blue-900/10">
                                    <td className="py-3 px-3 text-white">
                                      <div className="flex items-center">
                                        {isHighestLevel && <span className="text-yellow-400 mr-2 text-sm">👑</span>}
                                        <span className="text-sm whitespace-nowrap" title={player.name || '알 수 없음'}>
                                          {player.name || '알 수 없음'}
                                        </span>
                          </div>
                                    </td>
                                    <td className="py-3 px-3 text-blue-300 text-sm whitespace-nowrap" title={translateHero(player.hero) || '알 수 없음'}>
                                      {translateHero(player.hero) || '알 수 없음'}
                                    </td>
                                    <td className="py-3 px-3 text-center text-green-400 font-bold text-sm">
                                      {player.stats?.SoloKill || player.kills || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-red-400 font-bold text-sm">
                                      {player.stats?.Deaths || player.deaths || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-yellow-400 font-bold text-sm">
                                      {player.stats?.Assists || player.assists || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-indigo-400 font-bold text-sm">
                                      {player.stats?.Level || player.heroLevel || player.level || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center text-orange-400 font-semibold text-sm">{(player.stats?.HeroDamage || player.heroDamage || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-cyan-400 font-semibold text-sm">{(player.stats?.SiegeDamage || player.siegeDamage || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-purple-400 font-semibold text-sm">{(player.stats?.Healing || player.healing || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-green-300 font-semibold text-sm">{(player.stats?.ExperienceContribution || player.stats?.Experience || 0).toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                </div>
              </div>
                  </div>

                    {/* 게임 통계 요약 */}
                    {analysisResult.statistics && (
                      <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-white font-bold mb-4">📊 게임 통계 요약</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{analysisResult.statistics.totalKills || 0}</div>
                            <div className="text-gray-400">총 킬</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{analysisResult.statistics.totalDeaths || 0}</div>
                            <div className="text-gray-400">총 데스</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{analysisResult.statistics.totalAssists || 0}</div>
                            <div className="text-gray-400">총 어시스트</div>
                        </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                              {analysisResult.statistics?.averageLevel ||
                               (analysisResult.players?.all ?
                                Math.round(analysisResult.players.all.reduce((sum, p) => sum + (p.stats?.Level || p.heroLevel || 0), 0) / analysisResult.players.all.length) :
                                0)}
                      </div>
                            <div className="text-gray-400">평균 레벨</div>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>
          </div>
        )}
      </div>
        )}

        {/* 디버깅 탭들 */}
        {debugLoading && !debugData[activeTab.replace('debug-', '') === 'test' ? 'testResults' : activeTab.replace('debug-', '')] ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {activeTab === 'debug-endpoints' && (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🔧 API 엔드포인트</h2>
                    <p className="text-gray-400">모든 API 엔드포인트의 상태를 확인합니다.</p>
                  </div>
            <button
                    onClick={() => loadDebugData('endpoints')}
                    disabled={debugLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {debugLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">로딩 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
                        새로고침
                      </>
                    )}
            </button>
          </div>
                {renderEndpointsTab()}
      </div>
            )}

            {activeTab === 'debug-database' && (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🗄️ 데이터베이스</h2>
                    <p className="text-gray-400">데이터베이스 연결 상태와 테이블 정보를 확인합니다.</p>
            </div>
            <button
                    onClick={() => loadDebugData('database')}
                    disabled={debugLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {debugLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">로딩 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        새로고침
                      </>
                    )}
            </button>
          </div>
                {renderDatabaseTab()}
        </div>
            )}

            {activeTab === 'debug-models' && (
          <div>
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">📋 모델 정보</h2>
                    <p className="text-gray-400">Sequelize 모델 정보와 필드 매핑을 확인합니다.</p>
            </div>
            <button
                    onClick={() => loadDebugData('models')}
                    disabled={debugLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {debugLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">로딩 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
                        새로고침
                      </>
                    )}
            </button>
          </div>
                {renderModelsTab()}
        </div>
            )}

            {activeTab === 'debug-test' && (
          <div>
                <div className="mb-6 flex justify-between items-center">
          <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🧪 실시간 테스트</h2>
                    <p className="text-gray-400">실제 API 엔드포인트를 테스트하고 응답 시간을 측정합니다.</p>
          </div>
                  <button
                    onClick={() => loadDebugData('test')}
                    disabled={debugLoading}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {debugLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">테스트 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
                        테스트 실행
                      </>
                    )}
                  </button>
          </div>
                {renderTestTab()}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
