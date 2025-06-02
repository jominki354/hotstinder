const Parser = require('hots-parser');
const path = require('path');
const fs = require('fs');

async function testGameStats() {
  console.log('🎮 gameStats 필드 분석 시작\n');

  // 테스트용 리플레이 파일 경로
  const replayPath = path.join(__dirname, 'uploads/replays/replay-1748409465778-318841216.StormReplay');

  if (!fs.existsSync(replayPath)) {
    console.error('❌ 테스트용 리플레이 파일을 찾을 수 없습니다:', replayPath);
    return;
  }

  console.log('📁 테스트 파일:', replayPath);

  try {
    const result = Parser.processReplay(replayPath, {
      getBMData: true,
      useAttributeName: true,
      overrideVerifiedBuild: true,
      ignoreErrors: true
    });

    if (result && result.players) {
      console.log('👥 플레이어 수:', Object.keys(result.players).length);

      Object.keys(result.players).forEach((playerKey, index) => {
        const player = result.players[playerKey];

        console.log(`\n${'='.repeat(50)}`);
        console.log(`🔍 플레이어 ${index + 1}: ${player.name} (${player.hero})`);
        console.log(`${'='.repeat(50)}`);

        // gameStats 필드 상세 분석
        if (player.gameStats) {
          console.log('📊 gameStats 타입:', typeof player.gameStats);
          console.log('📊 gameStats 키들:', Object.keys(player.gameStats));
          console.log('📊 gameStats 전체 내용:');
          console.log(JSON.stringify(player.gameStats, null, 2));

          // 가능한 통계 필드들 확인
          const statFields = [
            'SoloKill', 'Assists', 'Deaths', 'HeroDamage', 'SiegeDamage',
            'StructureDamage', 'MinionDamage', 'CreepDamage', 'SummonDamage',
            'Healing', 'SelfHealing', 'DamageTaken', 'ExperienceContribution',
            'TownKills', 'TimeSpentDead', 'MercCampCaptures', 'WatchTowerCaptures',
            'MetaExperience', 'Level', 'TimeCCdEnemyHeroes', 'ProtectionGivenToAllies',
            'TimeSilencingEnemyHeroes', 'TimeRootingEnemyHeroes', 'TimeStunningEnemyHeroes',
            'ClutchHealsPerformed', 'EscapesPerformed', 'VengeancesPerformed',
            'OutnumberedDeaths', 'TeamfightEscapesPerformed', 'TeamfightHealingDone',
            'TeamfightDamageTaken', 'TeamfightHeroDamage', 'Multikill', 'PhysicalDamage',
            'SpellDamage', 'RegenGlobes', 'FirstAid'
          ];

          console.log('\n🔍 통계 필드 분석:');
          statFields.forEach(field => {
            if (player.gameStats[field] !== undefined) {
              console.log(`✅ ${field}: ${player.gameStats[field]}`);
            }
          });

        } else {
          console.log('❌ gameStats 필드 없음');
        }

        // 기본 킬/데스 정보
        const kills = Array.isArray(player.takedowns) ? player.takedowns.length : 0;
        const deaths = Array.isArray(player.deaths) ? player.deaths.length : 0;
        console.log(`\n📈 기본 통계: K${kills}/D${deaths}, 레벨${player.heroLevel}`);
      });

      // 전체 요약
      console.log(`\n${'='.repeat(60)}`);
      console.log('📊 전체 플레이어 통계 요약');
      console.log(`${'='.repeat(60)}`);

      Object.keys(result.players).forEach((playerKey, index) => {
        const player = result.players[playerKey];
        const kills = Array.isArray(player.takedowns) ? player.takedowns.length : 0;
        const deaths = Array.isArray(player.deaths) ? player.deaths.length : 0;

        // gameStats에서 통계 추출
        let heroDamage = 0;
        let healing = 0;
        let assists = 0;
        let siegeDamage = 0;
        let experience = 0;

        if (player.gameStats) {
          heroDamage = player.gameStats.HeroDamage || 0;
          healing = player.gameStats.Healing || 0;
          assists = player.gameStats.Assists || 0;
          siegeDamage = player.gameStats.SiegeDamage || player.gameStats.StructureDamage || 0;
          experience = player.gameStats.ExperienceContribution || 0;
        }

        console.log(`${index + 1}. ${player.name} (${player.hero}): K${kills}/D${deaths}/A${assists}, 딜${Math.round(heroDamage / 1000)}k, 힐${Math.round(healing / 1000)}k, 공성${Math.round(siegeDamage / 1000)}k, 경험${Math.round(experience / 1000)}k`);
      });

    } else {
      console.log('❌ 플레이어 데이터 없음');
    }

  } catch (error) {
    console.error('❌ 파싱 실패:', error.message);
  }
}

// 테스트 실행
testGameStats().then(() => {
  console.log('\n🎉 gameStats 분석 완료!');
  process.exit(0);
}).catch(error => {
  console.error('💥 테스트 실행 오류:', error);
  process.exit(1);
});
