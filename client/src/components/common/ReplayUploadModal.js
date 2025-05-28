import React, { useState } from 'react';
import axios from 'axios';

const ReplayUploadModal = ({ isOpen, onClose, matchId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
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
          isSimulation: matchInfo.isSimulation || false // 시뮬레이션 매치 여부
        };
      }
    } catch (err) {
      console.error('매치 정보 파싱 오류:', err);
    }
    return { blueTeam: [], redTeam: [], isSimulation: false };
  };
  
  // 시뮬레이션 매치인지 확인 (매치 ID 패턴으로 판단)
  const isSimulationMatch = () => {
    const matchPlayerInfo = getMatchPlayerInfo();
    
    // 1. 저장된 매치 정보에 isSimulation 플래그가 있는 경우
    if (matchPlayerInfo.isSimulation) {
      return true;
    }
    
    // 2. 매치 ID 패턴으로 판단 (YYYYMMDD-HHMM-XXX 형식)
    const simulationPattern = /^\d{8}-\d{4}-\d{3}$/;
    if (simulationPattern.test(matchId)) {
      return true;
    }
    
    // 3. localStorage에서 시뮬레이션 관련 정보 확인
    const isSimulating = localStorage.getItem('isSimulationRunning') === 'true';
    const simulatedPlayers = localStorage.getItem('simulatedPlayers');
    
    return isSimulating || !!simulatedPlayers;
  };
  
  // 플레이어 이름으로 실제 사용자 정보 매핑 (시뮬레이션 고려)
  const mapReplayPlayerToRealPlayer = (replayPlayerName, team, realPlayers, isSimulation) => {
    // 시뮬레이션 매치의 경우 리플레이 데이터를 그대로 사용 (DB 매칭 시도 안함)
    if (isSimulation) {
      // 리플레이 데이터로 가상 플레이어 생성 (DB 조회 없이)
      return {
        userId: `sim_${team}_${replayPlayerName}`, // 시뮬레이션용 가상 ID
        battletag: replayPlayerName,
        nickname: replayPlayerName.split('#')[0] || replayPlayerName,
        id: `sim_${team}_${replayPlayerName}`,
        mmr: 1500 // 기본 MMR
      };
    }
    
    // 실제 매치의 경우 기존 로직 사용
    // 정확한 배틀태그 매칭 시도
    let matchedPlayer = realPlayers.find(p => 
      p.battletag && p.battletag.toLowerCase() === replayPlayerName.toLowerCase()
    );
    
    // 배틀태그에서 # 앞부분만으로 매칭 시도
    if (!matchedPlayer) {
      const replayNamePart = replayPlayerName.split('#')[0].toLowerCase();
      matchedPlayer = realPlayers.find(p => {
        if (!p.battletag) return false;
        const playerNamePart = p.battletag.split('#')[0].toLowerCase();
        return playerNamePart === replayNamePart;
      });
    }
    
    // 닉네임으로 매칭 시도
    if (!matchedPlayer) {
      matchedPlayer = realPlayers.find(p => 
        p.nickname && p.nickname.toLowerCase() === replayPlayerName.toLowerCase()
      );
    }
    
    return matchedPlayer;
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
    
    // 파일 크기 검사 (20MB 제한)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB를 초과할 수 없습니다.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('업로드할 리플레이 파일을 선택해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setMessage('리플레이 파일을 업로드하고 분석 중입니다...');
      
      // FormData 객체 생성
      const formData = new FormData();
      formData.append('replayFile', file);
      
      // 1단계: 리플레이 파일 분석만 수행 (DB 저장 없이)
      const analysisResponse = await axios.post('/api/replay/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage('리플레이 분석 완료. 매치 결과를 저장 중입니다...');
      
      // 2단계: 분석 결과를 바탕으로 매치 완료 처리
      const analysisResult = analysisResponse.data.analysisResult;
      
      if (analysisResult && analysisResult.basic) {
        // 시뮬레이션 매치 여부 확인
        const isSimulation = isSimulationMatch();
        const matchPlayerInfo = getMatchPlayerInfo();
        
        console.log('매치 정보:', {
          matchId,
          isSimulation,
          blueTeamCount: matchPlayerInfo.blueTeam.length,
          redTeamCount: matchPlayerInfo.redTeam.length
        });
        
        // 승리 팀 결정
        const winningTeam = analysisResult.basic.winner || 
                           (analysisResult.basic.winningTeam === 0 ? 'blue' : 'red');
        
        // 플레이어 통계 생성
        const playerStats = [];
        
        // 블루팀 플레이어 추가
        if (analysisResult.teams && analysisResult.teams.blue) {
          analysisResult.teams.blue.forEach(player => {
            const realPlayer = mapReplayPlayerToRealPlayer(player.name, 'blue', matchPlayerInfo.blueTeam, isSimulation);
            playerStats.push({
              userId: realPlayer?.userId || realPlayer?.id || `blue_${player.name}`,
              battletag: realPlayer?.battletag || realPlayer?.name || player.name || 'Unknown',
              team: 'blue',
              hero: player.hero || 'Unknown',
              kills: player.stats?.SoloKill || 0,
              deaths: player.stats?.Deaths || 0,
              assists: player.stats?.Assists || 0,
              heroDamage: player.stats?.HeroDamage || 0,
              siegeDamage: player.stats?.SiegeDamage || 0,
              healing: player.stats?.Healing || 0,
              experienceContribution: player.stats?.ExperienceContribution || 0
            });
          });
        }
        
        // 레드팀 플레이어 추가
        if (analysisResult.teams && analysisResult.teams.red) {
          analysisResult.teams.red.forEach(player => {
            const realPlayer = mapReplayPlayerToRealPlayer(player.name, 'red', matchPlayerInfo.redTeam, isSimulation);
            playerStats.push({
              userId: realPlayer?.userId || realPlayer?.id || `red_${player.name}`,
              battletag: realPlayer?.battletag || realPlayer?.name || player.name || 'Unknown',
              team: 'red',
              hero: player.hero || 'Unknown',
              kills: player.stats?.SoloKill || 0,
              deaths: player.stats?.Deaths || 0,
              assists: player.stats?.Assists || 0,
              heroDamage: player.stats?.HeroDamage || 0,
              siegeDamage: player.stats?.SiegeDamage || 0,
              healing: player.stats?.Healing || 0,
              experienceContribution: player.stats?.ExperienceContribution || 0
            });
          });
        }
        
        console.log('생성된 플레이어 통계:', playerStats);
        
        // 플레이어 통계 상세 로그
        console.log('\n=== 클라이언트 플레이어 통계 상세 ===');
        playerStats.forEach((player, index) => {
          console.log(`플레이어 ${index + 1}:`, {
            userId: player.userId,
            battletag: player.battletag,
            team: player.team,
            hero: player.hero,
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            heroDamage: player.heroDamage,
            siegeDamage: player.siegeDamage,
            healing: player.healing,
            experienceContribution: player.experienceContribution
          });
        });
        console.log('=== 클라이언트 플레이어 통계 상세 끝 ===\n');
        
        // 매치 완료 API 호출
        const matchCompleteResponse = await axios.post(`/api/matches/${matchId}/submit-replay`, {
          replayData: {
            ...analysisResult,
            isSimulation: isSimulation // 시뮬레이션 플래그 명시적으로 전달
          },
          winningTeam: winningTeam,
          gameLength: analysisResult.basic.gameLength || analysisResult.basic.duration || 0,
          playerStats: playerStats,
          isSimulation: isSimulation // 최상위 레벨에서도 플래그 전달
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (matchCompleteResponse.data.success) {
          const successMessage = isSimulation 
            ? '✅ 시뮬레이션 매치의 리플레이 분석이 완료되었습니다!\n📊 리플레이 통계가 매치 기록으로 저장되었습니다.\n💡 시뮬레이션 매치는 개인 통계에 반영되지 않습니다.'
            : '✅ 리플레이 분석 및 매치 결과가 성공적으로 저장되었습니다!\n📈 개인 통계가 업데이트되었습니다.';
          
          setMessage(successMessage);
          console.log('매치 완료 처리 성공:', matchCompleteResponse.data);
          
          // 3초 후 모달 닫기
          setTimeout(() => {
            onClose(true); // 업로드 성공 상태 전달
          }, 3000);
        } else {
          throw new Error(matchCompleteResponse.data.message || '매치 결과 저장에 실패했습니다.');
        }
      } else {
        throw new Error('리플레이 분석 결과가 올바르지 않습니다.');
      }
      
    } catch (err) {
      console.error('리플레이 업로드 오류:', err);
      
      // 상세한 오류 메시지 처리
      let errorMessage = '리플레이 업로드 중 오류가 발생했습니다.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setMessage('');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">리플레이 파일 업로드</h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-indigo-900/30 border border-indigo-500 text-indigo-200 px-4 py-3 rounded-md mb-4">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">
              리플레이 파일 (.StormReplay)
            </label>
            <input
              type="file"
              accept=".StormReplay"
              onChange={handleFileChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <p className="text-slate-400 text-sm mt-1">
              Heroes of the Storm 리플레이 파일(.StormReplay)만 업로드 가능합니다.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 transition"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={`
                bg-indigo-600 text-white px-4 py-2 rounded transition
                ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700'}
              `}
              disabled={loading}
            >
              {loading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplayUploadModal; 