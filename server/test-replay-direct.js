const path = require('path');
const fs = require('fs');
const { analyzeReplay } = require('./src/utils/replayParser');

async function testReplayDirect() {
  console.log('🎮 리플레이 파서 직접 테스트 시작\n');

  // 테스트용 리플레이 파일 경로
  const replayPath = path.join(__dirname, 'uploads/replays/replay-1748409465778-318841216.StormReplay');

  if (!fs.existsSync(replayPath)) {
    console.error('❌ 테스트용 리플레이 파일을 찾을 수 없습니다:', replayPath);
    return;
  }

  console.log('📁 테스트 파일:', replayPath);
  console.log('📊 파일 크기:', Math.round(fs.statSync(replayPath).size / 1024) + 'KB\n');

  try {
    console.log('🔍 리플레이 파서 직접 호출 중...');
    const result = await analyzeReplay(replayPath);

    console.log('✅ 리플레이 파서 호출 완료');
    console.log('📊 분석 성공:', result.success);

    if (result.success) {
      console.log('\n🎯 분석 결과:');
      console.log('- 맵:', result.metadata?.mapName || 'N/A');
      console.log('- 게임 시간:', result.metadata?.gameDuration || 0, '초');
      console.log('- 승리팀:', result.metadata?.winner || 'N/A');
      console.log('- 블루팀 플레이어:', result.teams?.blue?.length || 0, '명');
      console.log('- 레드팀 플레이어:', result.teams?.red?.length || 0, '명');

      // 통계 정보
      if (result.statistics) {
        console.log('\n📈 전체 통계:');
        console.log('- 총 킬:', result.statistics.totalKills || 0);
        console.log('- 총 데스:', result.statistics.totalDeaths || 0);
        console.log('- 총 어시스트:', result.statistics.totalAssists || 0);
        console.log('- 총 영웅 피해량:', (result.statistics.totalHeroDamage || 0).toLocaleString());
        console.log('- 총 공성 피해량:', (result.statistics.totalSiegeDamage || 0).toLocaleString());
        console.log('- 총 힐량:', (result.statistics.totalHealing || 0).toLocaleString());
      }

      // 첫 번째 플레이어 상세 정보
      if (result.teams?.blue?.[0]) {
        const player = result.teams.blue[0];
        console.log('\n🔵 블루팀 첫 번째 플레이어:');
        console.log('- 이름:', player.name);
        console.log('- 영웅:', player.hero);
        console.log('- 킬:', player.stats?.SoloKill || 0);
        console.log('- 데스:', player.stats?.Deaths || 0);
        console.log('- 어시스트:', player.stats?.Assists || 0);
        console.log('- 영웅 피해량:', (player.stats?.HeroDamage || 0).toLocaleString());
        console.log('- 공성 피해량:', (player.stats?.SiegeDamage || 0).toLocaleString());
        console.log('- 힐량:', (player.stats?.Healing || 0).toLocaleString());
        console.log('- 경험치 기여도:', (player.stats?.ExperienceContribution || 0).toLocaleString());
      }

      if (result.teams?.red?.[0]) {
        const player = result.teams.red[0];
        console.log('\n🔴 레드팀 첫 번째 플레이어:');
        console.log('- 이름:', player.name);
        console.log('- 영웅:', player.hero);
        console.log('- 킬:', player.stats?.SoloKill || 0);
        console.log('- 데스:', player.stats?.Deaths || 0);
        console.log('- 어시스트:', player.stats?.Assists || 0);
        console.log('- 영웅 피해량:', (player.stats?.HeroDamage || 0).toLocaleString());
        console.log('- 공성 피해량:', (player.stats?.SiegeDamage || 0).toLocaleString());
        console.log('- 힐량:', (player.stats?.Healing || 0).toLocaleString());
        console.log('- 경험치 기여도:', (player.stats?.ExperienceContribution || 0).toLocaleString());
      }

      // 실제 통계값이 있는지 확인
      const hasRealStats = (result.teams?.blue || []).concat(result.teams?.red || []).some(p =>
        (p.stats?.SoloKill || 0) > 0 ||
        (p.stats?.Deaths || 0) > 0 ||
        (p.stats?.Assists || 0) > 0 ||
        (p.stats?.HeroDamage || 0) > 0 ||
        (p.stats?.SiegeDamage || 0) > 0 ||
        (p.stats?.Healing || 0) > 0
      );

      console.log('\n🎯 통계값 검증:');
      console.log('- 실제 통계값 존재:', hasRealStats ? '✅ YES' : '❌ NO (모든 값이 0)');

      if (hasRealStats) {
        console.log('\n🎉 결론: 리플레이 파서가 정상적으로 실제 통계값을 추출합니다!');
        console.log('📝 관리자 페이지와 업로드 모달 모두 이 파서를 사용하므로 동일한 결과를 얻을 수 있습니다.');
      } else {
        console.log('\n⚠️ 결론: 통계값이 모두 0으로 나옵니다.');
        console.log('🔍 가능한 원인:');
        console.log('  1. hots-parser 라이브러리 문제');
        console.log('  2. 리플레이 파일 버전 호환성 문제');
        console.log('  3. 통계 데이터 추출 로직 문제');
      }

      // 모든 플레이어의 통계 요약
      console.log('\n📊 모든 플레이어 통계 요약:');
      const allPlayers = (result.teams?.blue || []).concat(result.teams?.red || []);
      allPlayers.forEach((player, index) => {
        console.log(`${index + 1}. ${player.name} (${player.hero}): K${player.stats?.SoloKill || 0}/D${player.stats?.Deaths || 0}/A${player.stats?.Assists || 0}, 딜${Math.round((player.stats?.HeroDamage || 0) / 1000)}k, 힐${Math.round((player.stats?.Healing || 0) / 1000)}k`);
      });

    } else {
      console.error('❌ 리플레이 분석 실패:', result.error);
    }

  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error.message);
    console.error('스택 트레이스:', error.stack);
  }
}

// 테스트 실행
testReplayDirect().then(() => {
  console.log('\n🎉 직접 테스트 완료!');
  process.exit(0);
}).catch(error => {
  console.error('💥 테스트 실행 오류:', error);
  process.exit(1);
});
