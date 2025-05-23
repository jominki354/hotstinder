const Parser = require('hots-parser');
const fs = require('fs');
const path = require('path');

/**
 * Heroes of the Storm 리플레이 파일을 분석하는 유틸리티
 */
const replayParser = {
  /**
   * 리플레이 파일을 분석하여 게임 데이터를 추출합니다.
   * @param {string} filePath - 분석할 리플레이 파일의 경로
   * @returns {Object} 분석 결과를 담은 객체
   */
  parseReplay: async (filePath) => {
    try {
      console.log(`리플레이 파일 분석 시작: ${filePath}`);
      
      // 파일 존재 여부 확인
      if (!fs.existsSync(filePath)) {
        throw new Error('리플레이 파일을 찾을 수 없습니다');
      }
      
      // 파일 확장자 확인
      const ext = path.extname(filePath);
      if (ext.toLowerCase() !== '.stormreplay') {
        throw new Error('유효한 .StormReplay 파일이 아닙니다');
      }
      
      // 리플레이 파싱
      const result = Parser.processReplay(filePath, {
        getBMData: false, // 성능 향상을 위해 비필수 데이터는 제외
        overrideVerifiedBuild: true // 최신 빌드 지원
      });
      
      // 파싱 성공 여부 확인
      if (result.result !== Parser.ReplayStatus.OK) {
        const errorMessage = Parser.StatusString[result.result] || '알 수 없는 오류';
        throw new Error(`리플레이 파싱 실패: ${errorMessage}`);
      }
      
      console.log('리플레이 파싱 완료:', result.match.map);
      
      return {
        success: true,
        match: result.match,
        players: result.players
      };
    } catch (error) {
      console.error('리플레이 파싱 오류:', error);
      return {
        success: false,
        error: error.message || '리플레이 파싱 중 오류가 발생했습니다'
      };
    }
  },
  
  /**
   * 파싱된 리플레이 데이터에서 매치 정보를 추출합니다.
   * @param {Object} replayData - 파싱된 리플레이 데이터
   * @returns {Object} 추출된 매치 정보
   */
  extractMatchData: (replayData) => {
    try {
      const { match, players } = replayData;
      
      // 플레이어 목록 가공
      const blueTeam = [];
      const redTeam = [];
      
      // 플레이어 ToonHandle로 팀 구분
      Object.keys(players).forEach(toonHandle => {
        const player = players[toonHandle];
        
        const playerData = {
          toonHandle,
          name: player.name,
          hero: player.hero,
          heroLevel: player.heroLevel,
          talents: player.talents,
          stats: player.gameStats
        };
        
        if (player.team === 0) {
          blueTeam.push(playerData);
        } else {
          redTeam.push(playerData);
        }
      });
      
      // 매치 데이터 구성
      const matchData = {
        mapName: match.map,
        gameMode: match.gameMode,
        gameLength: match.gameLength,
        gameDate: new Date(match.date).toISOString(),
        winner: match.winner, // 0: 블루팀, 1: 레드팀
        blueTeam,
        redTeam
      };
      
      return matchData;
    } catch (error) {
      console.error('매치 데이터 추출 오류:', error);
      throw new Error('매치 데이터 추출 중 오류가 발생했습니다');
    }
  }
};

module.exports = replayParser; 