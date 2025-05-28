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
      const response = await axios.get(`/api/admin/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('매치 데이터 응답:', response.data);

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
      console.error('에러 응답:', err.response?.data);

      const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류가 발생했습니다.';
      setError(`매치 데이터를 가져오는데 실패했습니다: ${errorMessage}`);
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

    console.log('매치 업데이트 요청 데이터:', editedData);

    try {
      const response = await axios.put(`/api/admin/matches/${matchId}`, editedData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('매치 업데이트 응답:', response.data);

      setMatchData(response.data);
      setIsEditing(false);
      alert('매치 정보가 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error('매치 업데이트 오류:', err);
      console.error('에러 응답:', err.response?.data);

      const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류가 발생했습니다.';
      alert(`매치 업데이트에 실패했습니다: ${errorMessage}`);
    }
  };

  // 매치 무효화
  const invalidateMatch = async () => {
    try {
      const response = await axios.post(`/api/admin/matches/${matchId}/invalidate`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('매치 무효화 응답:', response.data);

      // 매치 데이터 다시 가져오기
      await fetchMatchData();

      alert('매치가 성공적으로 무효화되었습니다.');
    } catch (err) {
      console.error('매치 무효화 오류:', err);
      console.error('에러 응답:', err.response?.data);

      const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류가 발생했습니다.';
      alert(`매치 무효화에 실패했습니다: ${errorMessage}`);
    } finally {
      setShowConfirm(false);
    }
  };

  // 매치 삭제
  const deleteMatch = async () => {
    try {
      await axios.delete(`/api/admin/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('매치가 성공적으로 삭제되었습니다.');
      navigate('/admin/matches');
    } catch (err) {
      console.error('매치 삭제 오류:', err);
      console.error('에러 응답:', err.response?.data);

      const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류가 발생했습니다.';
      alert(`매치 삭제에 실패했습니다: ${errorMessage}`);
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

  // 게임 시간 포맷팅
  const formatGameTime = (seconds) => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  // 매치 상태에 따른 스타일
  const getStatusStyle = (status) => {
    switch (status) {
      case '완료':
        return 'bg-green-900/50 text-green-400 border-green-700';
      case '진행 중':
        return 'bg-blue-900/50 text-blue-400 border-blue-700';
      case '취소됨':
        return 'bg-red-900/50 text-red-400 border-red-700';
      case '무효':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
      default:
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  // 승리팀 표시
  const getWinnerDisplay = (winner) => {
    if (!winner) return { text: '미정', color: 'text-gray-400' };
    if (winner === 'blue') return { text: '블루팀 승리', color: 'text-blue-400' };
    if (winner === 'red') return { text: '레드팀 승리', color: 'text-red-400' };
    return { text: winner, color: 'text-gray-400' };
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

  const winnerInfo = getWinnerDisplay(matchData.winner || matchData.result?.winner);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">매치 분석</h1>
          <div className="flex items-center space-x-4 text-gray-400">
            <span>매치 ID: <span className="font-mono text-indigo-400">{matchData.matchId}</span></span>
            <span>•</span>
            <span>{new Date(matchData.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/matches"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
          >
            &larr; 매치 목록
          </Link>
          <button
            onClick={toggleEditMode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
          >
            {isEditing ? '편집 취소' : '매치 편집'}
          </button>
        </div>
      </div>

      {/* 매치 개요 */}
      <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">전장</div>
            <div className="text-xl font-semibold text-white">{matchData.map || '미정'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">게임 시간</div>
            <div className="text-xl font-semibold text-white">
              {formatGameTime(matchData.result?.gameLength || matchData.gameLength)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">승리팀</div>
            <div className={`text-xl font-semibold ${winnerInfo.color}`}>
              {winnerInfo.text}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">상태</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusStyle(matchData.status)}`}>
              {matchData.status || '미정'}
            </div>
          </div>
        </div>
      </div>

      {/* 편집 모드 */}
      {isEditing && (
        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">매치 정보 편집</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 mb-2">상태</label>
                <select
                  name="status"
                  value={editedData.status}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="진행 중">진행 중</option>
                  <option value="완료">완료</option>
                  <option value="취소됨">취소됨</option>
                  <option value="무효">무효</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">승자</label>
                <select
                  name="winner"
                  value={editedData.winner}
                  onChange={handleInputChange}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">미정</option>
                  <option value="blue">블루팀</option>
                  <option value="red">레드팀</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">관리자 메모</label>
              <textarea
                name="notes"
                value={editedData.notes}
                onChange={handleInputChange}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                rows="3"
                placeholder="매치에 대한 메모를 입력하세요..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => showConfirmDialog('invalidate')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
              >
                매치 무효화
              </button>
              <button
                type="button"
                onClick={() => showConfirmDialog('delete')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                매치 삭제
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
              >
                변경사항 저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 팀 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 레드팀 */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl border border-red-800/50">
          <div className="bg-red-900/30 px-6 py-4 rounded-t-xl border-b border-red-800/50">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-red-400">레드팀</h3>
              <div className="text-red-300">
                평균 MMR: <span className="font-bold text-white">{matchData.redTeamAvgMmr || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {matchData.redTeam?.map((player, index) => (
                <div key={index} className="bg-red-900/20 rounded-lg p-4 border border-red-800/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        to={`/admin/users/${player.userId}`}
                        className="text-white font-semibold hover:text-red-300 transition"
                      >
                        {player.battletag || player.nickname}
                      </Link>
                      <div className="text-red-300 text-sm">
                        {player.hero || '영웅 미정'} • {player.role || '역할 미정'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{player.mmr || 'N/A'}</div>
                      {player.mmrChange && (
                        <div className={`text-sm ${player.mmrChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {player.mmrChange > 0 ? '+' : ''}{player.mmrChange}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 플레이어 통계 */}
                  {player.stats && (
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-300 mt-3 pt-3 border-t border-red-800/30">
                      <div className="text-center">
                        <div className="text-green-400 font-semibold">{player.stats.kills || 0}</div>
                        <div>킬</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-semibold">{player.stats.deaths || 0}</div>
                        <div>데스</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-semibold">{player.stats.assists || 0}</div>
                        <div>어시스트</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-semibold">
                          {player.stats.heroDamage ? formatNumber(player.stats.heroDamage) : 0}
                        </div>
                        <div>영웅 피해</div>
                      </div>
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-center text-gray-400 py-8">
                  플레이어 정보가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 블루팀 */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl border border-blue-800/50">
          <div className="bg-blue-900/30 px-6 py-4 rounded-t-xl border-b border-blue-800/50">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-400">블루팀</h3>
              <div className="text-blue-300">
                평균 MMR: <span className="font-bold text-white">{matchData.blueTeamAvgMmr || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {matchData.blueTeam?.map((player, index) => (
                <div key={index} className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        to={`/admin/users/${player.userId}`}
                        className="text-white font-semibold hover:text-blue-300 transition"
                      >
                        {player.battletag || player.nickname}
                      </Link>
                      <div className="text-blue-300 text-sm">
                        {player.hero || '영웅 미정'} • {player.role || '역할 미정'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{player.mmr || 'N/A'}</div>
                      {player.mmrChange && (
                        <div className={`text-sm ${player.mmrChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {player.mmrChange > 0 ? '+' : ''}{player.mmrChange}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 플레이어 통계 */}
                  {player.stats && (
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-300 mt-3 pt-3 border-t border-blue-800/30">
                      <div className="text-center">
                        <div className="text-green-400 font-semibold">{player.stats.kills || 0}</div>
                        <div>킬</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-semibold">{player.stats.deaths || 0}</div>
                        <div>데스</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-semibold">{player.stats.assists || 0}</div>
                        <div>어시스트</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-semibold">
                          {player.stats.heroDamage ? formatNumber(player.stats.heroDamage) : 0}
                        </div>
                        <div>영웅 피해</div>
                      </div>
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-center text-gray-400 py-8">
                  플레이어 정보가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 통계 테이블 */}
      {(matchData.redTeam?.some(p => p.stats) || matchData.blueTeam?.some(p => p.stats)) && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
          <div className="px-6 py-4 bg-slate-700 border-b border-slate-600">
            <h3 className="text-xl font-semibold text-white">상세 통계</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">플레이어</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">영웅</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">K</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">D</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">A</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">공성 피해</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">영웅 피해</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">치유량</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-medium">경험치</th>
                </tr>
              </thead>
              <tbody>
                {/* 레드팀 */}
                {matchData.redTeam?.filter(p => p.stats).map((player, index) => (
                  <tr key={`red-${index}`} className="border-b border-slate-700 bg-red-900/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <Link
                          to={`/admin/users/${player.userId}`}
                          className="text-white hover:text-red-300 transition"
                        >
                          {player.battletag || player.nickname}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{player.hero || '-'}</td>
                    <td className="px-4 py-3 text-center text-green-400 font-semibold">{player.stats.kills || 0}</td>
                    <td className="px-4 py-3 text-center text-red-400 font-semibold">{player.stats.deaths || 0}</td>
                    <td className="px-4 py-3 text-center text-blue-400 font-semibold">{player.stats.assists || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{formatNumber(player.stats.siegeDamage || 0)}</td>
                    <td className="px-4 py-3 text-center text-yellow-400 font-semibold">{formatNumber(player.stats.heroDamage || 0)}</td>
                    <td className="px-4 py-3 text-center text-green-300">{formatNumber(player.stats.healing || 0)}</td>
                    <td className="px-4 py-3 text-center text-purple-400">{formatNumber(player.stats.experience || 0)}</td>
                  </tr>
                ))}
                {/* 블루팀 */}
                {matchData.blueTeam?.filter(p => p.stats).map((player, index) => (
                  <tr key={`blue-${index}`} className="border-b border-slate-700 bg-blue-900/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <Link
                          to={`/admin/users/${player.userId}`}
                          className="text-white hover:text-blue-300 transition"
                        >
                          {player.battletag || player.nickname}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{player.hero || '-'}</td>
                    <td className="px-4 py-3 text-center text-green-400 font-semibold">{player.stats.kills || 0}</td>
                    <td className="px-4 py-3 text-center text-red-400 font-semibold">{player.stats.deaths || 0}</td>
                    <td className="px-4 py-3 text-center text-blue-400 font-semibold">{player.stats.assists || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{formatNumber(player.stats.siegeDamage || 0)}</td>
                    <td className="px-4 py-3 text-center text-yellow-400 font-semibold">{formatNumber(player.stats.heroDamage || 0)}</td>
                    <td className="px-4 py-3 text-center text-green-300">{formatNumber(player.stats.healing || 0)}</td>
                    <td className="px-4 py-3 text-center text-purple-400">{formatNumber(player.stats.experience || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 관리자 메모 */}
      {matchData.notes && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">관리자 메모</h3>
          <div className="bg-slate-700/50 p-4 rounded-lg text-gray-300">
            {matchData.notes}
          </div>
        </div>
      )}

      {/* 확인 대화상자 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {confirmType === 'invalidate' ? '매치 무효화' : '매치 삭제'}
            </h3>
            <p className="text-gray-300 mb-6">
              {confirmType === 'invalidate'
                ? '이 매치를 무효화하시겠습니까? 이 작업은 되돌릴 수 있습니다.'
                : '이 매치를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
              }
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
                className={`px-4 py-2 rounded transition text-white ${
                  confirmType === 'invalidate'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
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