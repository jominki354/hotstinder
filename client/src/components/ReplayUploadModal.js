import React, { useState } from 'react';
import axios from 'axios';

const ReplayUploadModal = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expectedMap, setExpectedMap] = useState(null);

  const analyzeReplay = async (file) => {
    try {
      setAnalyzing(true);
      setAnalysisResult(null);
      setError(null);

      const formData = new FormData();
      formData.append('replayFile', file);

      console.log('[업로드 모달] 리플레이 분석 시작:', file.name);

      // 관리자 페이지와 동일한 서버 API 사용
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullURL = `${baseURL}/api/replay/analyze`;

      console.log('[업로드 모달] 리플레이 분석 요청 URL:', fullURL);
      console.log('[업로드 모달] 환경변수 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

      const response = await axios.post(fullURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[업로드 모달] 서버 응답:', response.data);

      if (response.data.success && response.data.analysisResult) {
        const result = response.data.analysisResult;

        console.log('[업로드 모달] 분석 결과:', {
          mapName: result.metadata?.mapName,
          gameMode: result.metadata?.gameMode,
          gameDuration: result.metadata?.gameDuration,
          winner: result.metadata?.winner,
          blueTeamCount: result.teams?.blue?.length || 0,
          redTeamCount: result.teams?.red?.length || 0,
          totalPlayers: (result.teams?.blue?.length || 0) + (result.teams?.red?.length || 0)
        });

        // 플레이어 통계 상세 로그
        if (result.teams?.blue?.[0]) {
          console.log('[업로드 모달] 블루팀 첫 번째 플레이어:', {
            name: result.teams.blue[0].name,
            hero: result.teams.blue[0].hero,
            stats: result.teams.blue[0].stats
          });
        }

        if (result.teams?.red?.[0]) {
          console.log('[업로드 모달] 레드팀 첫 번째 플레이어:', {
            name: result.teams.red[0].name,
            hero: result.teams.red[0].hero,
            stats: result.teams.red[0].stats
          });
        }

        setAnalysisResult(result);

        // 전장 일치성 검증
        if (expectedMap) {
          const replayMap = result.metadata?.mapName;
          if (replayMap && replayMap !== expectedMap) {
            setError(`전장 불일치: 예상 "${expectedMap}" vs 리플레이 "${replayMap}"`);
            return;
          }
        }
      } else {
        throw new Error(response.data.message || '리플레이 분석에 실패했습니다');
      }
    } catch (err) {
      console.error('[업로드 모달] 리플레이 분석 오류:', err);
      const errorMessage = err.response?.data?.message || err.message || '리플레이 분석 중 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      {/* 기존의 코드 부분을 유지 */}
    </div>
  );
};

export default ReplayUploadModal;
