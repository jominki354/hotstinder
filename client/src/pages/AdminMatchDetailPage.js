import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const AdminMatchDetailPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    status: '',
    winner: '',
    notes: ''
  });
  
  // 관리자 확인
  useEffect(() => {
    if (!isAuthenticated || !user.isAdmin) {
      setError('관리자 권한이 필요합니다');
      setLoading(false);
      return;
    }
    
    fetchMatchData();
  }, [isAuthenticated, user, matchId]);
  
  // 매치 데이터 가져오기
  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/matches/${matchId}`);
      setMatchData(response.data);
      setEditedData({
        status: response.data.status || '',
        winner: response.data.winner || '',
        notes: response.data.notes || ''
      });
      setSelectedWinner(response.data.winner || '');
      setLoading(false);
    } catch (err) {
      console.error('매치 데이터 가져오기 오류:', err);
      setError('매치 데이터를 가져오는데 실패했습니다.');
      setLoading(false);
    }
  };
  
  // 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({
      ...editedData,
      [name]: value
    });
  };
  
  // 승자 선택 처리
  const handleWinnerChange = (winner) => {
    setSelectedWinner(winner);
    setEditedData({
      ...editedData,
      winner
    });
  };
  
  // 매치 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // 편집 모드 진입 시 현재 데이터로 초기화
      setEditedData({
        status: matchData.status || '',
        winner: matchData.winner || '',
        notes: matchData.notes || ''
      });
      setSelectedWinner(matchData.winner || '');
    }
  };
  
  // 확인 창 표시
  const showConfirmDialog = (type) => {
    setConfirmType(type);
    setShowConfirm(true);
  };
  
  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(`/api/admin/matches/${matchId}`, editedData);
      setMatchData(response.data);
      setIsEditing(false);
      alert('매치 정보가 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error('매치 업데이트 오류:', err);
      alert(`매치 업데이트에 실패했습니다: ${err.response?.data?.message || err.message}`);
    }
  };
  
  // 매치 무효화
  const invalidateMatch = async () => {
    try {
      const response = await axios.post(`/api/admin/matches/${matchId}/invalidate`);
      setMatchData(response.data);
      alert('매치가 성공적으로 무효화되었습니다.');
    } catch (err) {
      console.error('매치 무효화 오류:', err);
      alert('매치 무효화에 실패했습니다.');
    } finally {
      setShowConfirm(false);
    }
  };
  
  // 매치 삭제
  const deleteMatch = async () => {
    try {
      await axios.delete(`/api/admin/matches/${matchId}`);
      alert('매치가 성공적으로 삭제되었습니다.');
      navigate('/admin/matches');
    } catch (err) {
      console.error('매치 삭제 오류:', err);
      alert('매치 삭제에 실패했습니다.');
    } finally {
      setShowConfirm(false);
    }
  };
  
  // 확인 대화상자 실행
  const executeConfirmAction = () => {
    if (confirmType === 'invalidate') {
      invalidateMatch();
    } else if (confirmType === 'delete') {
      deleteMatch();
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
        <Link to="/admin/matches" className="text-indigo-400 hover:text-indigo-300">
          &larr; 매치 목록으로 돌아가기
        </Link>
      </div>
    );
  }
  
  // 매치 데이터가 없는 경우
  if (!matchData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded mb-6">
          매치 정보를 찾을 수 없습니다.
        </div>
        <Link to="/admin/matches" className="text-indigo-400 hover:text-indigo-300">
          &larr; 매치 목록으로 돌아가기
        </Link>
      </div>
    );
  }
  
  // 매치 상태에 따른 스타일
  const getStatusStyle = (status) => {
    switch (status) {
      case '완료':
        return 'bg-green-900/50 text-green-400';
      case '진행 중':
        return 'bg-blue-900/50 text-blue-400';
      case '취소됨':
        return 'bg-red-900/50 text-red-400';
      case '무효':
        return 'bg-yellow-900/50 text-yellow-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">매치 상세 정보</h1>
          <p className="text-gray-400">매치 ID: <span className="font-mono">{matchData.matchId}</span></p>
        </div>
        <Link to="/admin/matches" className="text-indigo-400 hover:text-indigo-300">
          &larr; 매치 목록으로 돌아가기
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 매치 정보 및 편집 */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">매치 정보</h2>
              {!isEditing ? (
                <button
                  onClick={toggleEditMode}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition"
                >
                  편집
                </button>
              ) : (
                <button
                  onClick={toggleEditMode}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm transition"
                >
                  취소
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-1">상태</label>
                    <select
                      name="status"
                      value={editedData.status}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="진행 중">진행 중</option>
                      <option value="완료">완료</option>
                      <option value="취소됨">취소됨</option>
                      <option value="무효">무효</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">전장</label>
                    <div className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600">
                      {matchData.map}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-400 mb-1">승자 선택</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-3 rounded border-2 cursor-pointer transition ${
                        selectedWinner === 'red'
                          ? 'bg-red-900/30 border-red-500'
                          : 'bg-slate-700 border-slate-600 hover:border-red-500'
                      }`}
                      onClick={() => handleWinnerChange('red')}
                    >
                      <div className="font-medium text-red-400 mb-1">레드 팀</div>
                      <div className="text-sm text-gray-300">평균 MMR: {matchData.redTeamAvgMmr}</div>
                    </div>
                    <div
                      className={`p-3 rounded border-2 cursor-pointer transition ${
                        selectedWinner === 'blue'
                          ? 'bg-blue-900/30 border-blue-500'
                          : 'bg-slate-700 border-slate-600 hover:border-blue-500'
                      }`}
                      onClick={() => handleWinnerChange('blue')}
                    >
                      <div className="font-medium text-blue-400 mb-1">블루 팀</div>
                      <div className="text-sm text-gray-300">평균 MMR: {matchData.blueTeamAvgMmr}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-400 mb-1">관리자 메모</label>
                  <textarea
                    name="notes"
                    value={editedData.notes}
                    onChange={handleInputChange}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    rows="3"
                    placeholder="매치에 대한 메모를 입력하세요..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                  >
                    변경사항 저장
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 mb-1">상태</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusStyle(matchData.status)}`}>
                      {matchData.status || '미정'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">전장</div>
                    <div className="text-white">{matchData.map}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">승자</div>
                    <div>
                      {matchData.winner || matchData.result?.winner ? (
                        <span className={(matchData.winner || matchData.result?.winner) === 'blue' ? 'text-blue-400' : 'text-red-400'}>
                          {(matchData.winner || matchData.result?.winner) === 'blue' ? '블루 팀' : (matchData.winner || matchData.result?.winner) === 'red' ? '레드 팀' : (matchData.winner || matchData.result?.winner)}
                        </span>
                      ) : (
                        <span className="text-gray-500">미정</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">생성 일시</div>
                    <div className="text-white">
                      {new Date(matchData.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {matchData.notes && (
                  <div>
                    <div className="text-gray-400 mb-1">관리자 메모</div>
                    <div className="bg-slate-700/50 p-3 rounded text-white">
                      {matchData.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 팀 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-800 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-400">레드 팀</h3>
                <div className="text-red-300">평균 MMR: <span className="font-bold">{matchData.redTeamAvgMmr}</span></div>
              </div>
              <ul className="space-y-2">
                {matchData.redTeam?.map((player, index) => (
                  <li key={index} className="bg-red-900/30 p-2 rounded flex justify-between items-center">
                    <div className="flex items-center">
                      <div>
                        <Link 
                          to={`/admin/users/${player.userId}`} 
                          className="text-white font-medium hover:text-indigo-300 transition"
                        >
                          {player.battletag || player.nickname}
                        </Link>
                        <span className="text-red-300 text-sm ml-2">({player.role || '미정'})</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                    <div className="text-red-200 font-semibold">{player.mmr}</div>
                      {player.mmrChange && (
                        <span className={`text-xs ml-1 ${player.mmrChange > 0 ? 'text-green-400' : player.mmrChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {player.mmrChange > 0 ? `+${player.mmrChange}` : player.mmrChange}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {(!matchData.redTeam || matchData.redTeam.length === 0) && (
                  <li className="text-center text-gray-400 py-2">플레이어 정보가 없습니다.</li>
                )}
              </ul>
            </div>
            
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-400">블루 팀</h3>
                <div className="text-blue-300">평균 MMR: <span className="font-bold">{matchData.blueTeamAvgMmr}</span></div>
              </div>
              <ul className="space-y-2">
                {matchData.blueTeam?.map((player, index) => (
                  <li key={index} className="bg-blue-900/30 p-2 rounded flex justify-between items-center">
                    <div className="flex items-center">
                      <div>
                        <Link 
                          to={`/admin/users/${player.userId}`} 
                          className="text-white font-medium hover:text-indigo-300 transition"
                        >
                          {player.battletag || player.nickname}
                        </Link>
                        <span className="text-blue-300 text-sm ml-2">({player.role || '미정'})</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                    <div className="text-blue-200 font-semibold">{player.mmr}</div>
                      {player.mmrChange && (
                        <span className={`text-xs ml-1 ${player.mmrChange > 0 ? 'text-green-400' : player.mmrChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {player.mmrChange > 0 ? `+${player.mmrChange}` : player.mmrChange}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {(!matchData.blueTeam || matchData.blueTeam.length === 0) && (
                  <li className="text-center text-gray-400 py-2">플레이어 정보가 없습니다.</li>
                )}
              </ul>
            </div>
          </div>
          
          {/* 추가 정보 및 이벤트 로그 */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">이벤트 로그</h2>
            {matchData.eventLog && matchData.eventLog.length > 0 ? (
              <ul className="space-y-2">
                {matchData.eventLog.map((event, index) => (
                  <li key={index} className="border-l-2 border-indigo-500 pl-3 py-1">
                    <div className="text-white">{event.description}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleString()} | {event.type}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">이벤트 로그가 없습니다.</p>
            )}
          </div>
        </div>
        
        {/* 사이드바: 관리 작업 */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">관리 작업</h2>
            <div className="space-y-3">
              <button
                onClick={() => showConfirmDialog('invalidate')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded flex items-center justify-center transition"
                disabled={matchData.status === '무효'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                매치 무효화
              </button>
              <button
                onClick={() => showConfirmDialog('delete')}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center justify-center transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                매치 삭제
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">빠른 링크</h2>
            <div className="space-y-2">
              {matchData.createdBy && (
                <Link
                  to={`/admin/users/${matchData.createdBy}`}
                  className="block text-indigo-400 hover:text-indigo-300 transition"
                >
                  &rarr; 매치 생성자 보기
                </Link>
              )}
              <Link
                to="/admin/matches"
                className="block text-indigo-400 hover:text-indigo-300 transition"
              >
                &rarr; 모든 매치 보기
              </Link>
              <Link
                to="/admin"
                className="block text-indigo-400 hover:text-indigo-300 transition"
              >
                &rarr; 관리자 대시보드
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {confirmType === 'invalidate' ? '매치 무효화 확인' : '매치 삭제 확인'}
            </h3>
            <p className="text-gray-300 mb-6">
              {confirmType === 'invalidate'
                ? '이 매치를 무효화하시겠습니까? 무효화된 매치는 MMR 계산에서 제외됩니다.'
                : '이 매치를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition"
              >
                취소
              </button>
              <button
                onClick={executeConfirmAction}
                className={confirmType === 'invalidate'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition'
                  : 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition'
                }
              >
                {confirmType === 'invalidate' ? '무효화' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatchDetailPage; 