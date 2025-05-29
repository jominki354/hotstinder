import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Axios 기본 설정
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DebugPage = () => {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    endpoints: null,
    database: null,
    models: null,
    testResults: null
  });
  const [error, setError] = useState(null);

  // 데이터 로드 함수
  const loadData = async (type) => {
    setLoading(true);
    setError(null);

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

      setData(prev => ({
        ...prev,
        [type === 'test' ? 'testResults' : type]: response.data
      }));
    } catch (err) {
      console.error(`${type} 데이터 로드 오류:`, err);
      setError(`${type} 데이터를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    loadData(activeTab === 'test' ? 'test' : activeTab);
  }, [activeTab]);

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
    if (!data.endpoints) return null;

    return (
      <div className="space-y-6">
        {/* 요약 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">총 엔드포인트</h3>
            <p className="text-3xl font-bold text-blue-400">{data.endpoints.totalEndpoints}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">사용 가능</h3>
            <p className="text-3xl font-bold text-green-400">{data.endpoints.availableEndpoints}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">오류</h3>
            <p className="text-3xl font-bold text-red-400">{data.endpoints.errorEndpoints}</p>
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
                {data.endpoints.endpoints.map((endpoint, index) => (
                  <tr key={index} className="hover:bg-slate-700">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-mono">{endpoint.path}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{endpoint.description}</td>
                    <td className="px-4 py-3 text-center">
                      {endpoint.requiresAuth ? (
                        <span className="text-yellow-400">✓</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status}
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
    if (!data.database) return null;

    return (
      <div className="space-y-6">
        {/* 연결 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">연결 정보</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">상태:</span>
                <span className={`font-medium ${getStatusColor(data.database.status)}`}>
                  {data.database.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">데이터베이스:</span>
                <span className="text-white">{data.database.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">호스트:</span>
                <span className="text-white">{data.database.host}:{data.database.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">사용자:</span>
                <span className="text-white">{data.database.user}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">통계</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">테이블 수:</span>
                <span className="text-blue-400 font-bold">{data.database.tablesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">모델 수:</span>
                <span className="text-green-400 font-bold">{data.database.modelsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">오류 수:</span>
                <span className="text-red-400 font-bold">{data.database.errors.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오류 목록 */}
        {data.database.errors.length > 0 && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-2">오류 목록</h3>
            <ul className="space-y-1">
              {data.database.errors.map((error, index) => (
                <li key={index} className="text-red-300 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 테이블 목록 */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">테이블 목록</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.database.tables.map((table, index) => (
              <div key={index} className="bg-slate-700 p-3 rounded">
                <h4 className="font-medium text-white">{table.table_name}</h4>
                <p className="text-sm text-gray-400">스키마: {table.table_schema}</p>
                {data.database.tableDetails[table.table_name] && (
                  <p className="text-xs text-blue-400 mt-1">
                    컬럼 {data.database.tableDetails[table.table_name].length}개
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 테이블 상세 정보 */}
        {Object.keys(data.database.tableDetails).length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">테이블 상세 정보</h3>
            <div className="space-y-4">
              {Object.entries(data.database.tableDetails).map(([tableName, columns]) => (
                <div key={tableName} className="border border-slate-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">{tableName}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-2 text-gray-400">컬럼명</th>
                          <th className="text-left py-2 text-gray-400">타입</th>
                          <th className="text-left py-2 text-gray-400">NULL 허용</th>
                          <th className="text-left py-2 text-gray-400">기본값</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((column, idx) => (
                          <tr key={idx} className="border-b border-slate-700">
                            <td className="py-1 text-white font-mono">{column.column_name}</td>
                            <td className="py-1 text-blue-400">{column.data_type}</td>
                            <td className="py-1 text-gray-300">{column.is_nullable}</td>
                            <td className="py-1 text-gray-300">{column.column_default || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 모델 탭 렌더링
  const renderModelsTab = () => {
    if (!data.models) return null;

    return (
      <div className="space-y-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">모델 개수</h3>
          <p className="text-3xl font-bold text-blue-400">{data.models.modelsCount}</p>
        </div>

        <div className="space-y-4">
          {Object.entries(data.models.models).map(([modelName, modelInfo]) => (
            <div key={modelName} className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">{modelName}</h3>

              {modelInfo.error ? (
                <div className="text-red-400">오류: {modelInfo.error}</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">테이블명: {modelInfo.tableName}</h4>
                  </div>

                  {/* 속성 목록 */}
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">속성 ({modelInfo.attributes.length}개)</h4>
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
                          {modelInfo.attributes.map((attr, idx) => (
                            <tr key={idx} className="border-b border-slate-700">
                              <td className="py-1 text-white font-mono">{attr.name}</td>
                              <td className="py-1 text-blue-400">{attr.field}</td>
                              <td className="py-1 text-green-400">{attr.type}</td>
                              <td className="py-1 text-gray-300">{attr.allowNull ? 'Yes' : 'No'}</td>
                              <td className="py-1 text-gray-300">{attr.defaultValue || '-'}</td>
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
                  {modelInfo.associations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">연관관계 ({modelInfo.associations.length}개)</h4>
                      <div className="space-y-2">
                        {modelInfo.associations.map((assoc, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <span className="text-white">{assoc.name}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-blue-400">{assoc.type}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-400">{assoc.target}</span>
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
    if (!data.testResults) return null;

    return (
      <div className="space-y-6">
        {/* 요약 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">총 테스트</h3>
            <p className="text-3xl font-bold text-blue-400">{data.testResults.summary.total}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">성공</h3>
            <p className="text-3xl font-bold text-green-400">{data.testResults.summary.success}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">실패</h3>
            <p className="text-3xl font-bold text-red-400">{data.testResults.summary.errors}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">성공률</h3>
            <p className="text-3xl font-bold text-yellow-400">{data.testResults.summary.successRate}</p>
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
                {data.testResults.results.map((result, index) => (
                  <tr key={index} className="hover:bg-slate-700">
                    <td className="px-4 py-3 text-sm text-white font-mono">{result.endpoint}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-300">
                      {result.responseTime ? `${result.responseTime}ms` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${getStatusColor(result.success)}`}>
                        {result.success ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{result.contentType || '-'}</td>
                    <td className="px-4 py-3 text-sm text-red-400">{result.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">시스템 디버깅</h1>
        <p className="text-gray-400">API 엔드포인트, 데이터베이스 상태, 모델 정보를 확인할 수 있습니다.</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
          {[
            { id: 'endpoints', label: 'API 엔드포인트' },
            { id: 'database', label: '데이터베이스' },
            { id: 'models', label: '모델 정보' },
            { id: 'test', label: '실시간 테스트' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 새로고침 버튼 */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          마지막 업데이트: {data[activeTab === 'test' ? 'testResults' : activeTab]?.lastChecked || data[activeTab === 'test' ? 'testResults' : activeTab]?.lastUpdated || data[activeTab === 'test' ? 'testResults' : activeTab]?.lastTested || '없음'}
        </div>
        <button
          onClick={() => loadData(activeTab === 'test' ? 'test' : activeTab)}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
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

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* 탭 내용 */}
      <div className="min-h-96">
        {loading && !data[activeTab === 'test' ? 'testResults' : activeTab] ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {activeTab === 'endpoints' && renderEndpointsTab()}
            {activeTab === 'database' && renderDatabaseTab()}
            {activeTab === 'models' && renderModelsTab()}
            {activeTab === 'test' && renderTestTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default DebugPage;
