const Parser = require('hots-parser');
const path = require('path');
const fs = require('fs');

async function testParserOptions() {
  console.log('🔧 hots-parser 옵션 테스트 시작\\n');

  // 테스트용 리플레이 파일 경로
  const replayPath = path.join(__dirname, 'uploads/replays/replay-1748409465778-318841216.StormReplay');

  if (!fs.existsSync(replayPath)) {
    console.error('❌ 테스트용 리플레이 파일을 찾을 수 없습니다:', replayPath);
    return;
  }

  console.log('📁 테스트 파일:', replayPath);
  console.log('📊 파일 크기:', Math.round(fs.statSync(replayPath).size / 1024) + 'KB\\n');

  // 다양한 옵션 조합들을 테스트
  const optionSets = [
    {
      name: '기본 설정',
      options: {}
    },
    {
      name: '모든 데이터 추출',
      options: {
        getBMData: true,
        useAttributeName: true,
        overrideVerifiedBuild: true,
        ignoreErrors: true
      }
    },
    {
      name: '상세 통계 추출',
      options: {
        getBMData: true,
        useAttributeName: true,
        overrideVerifiedBuild: true,
        ignoreErrors: true,
        detailed: true,
        legacyTalentKeys: true
      }
    }
  ];

  for (let i = 0; i < optionSets.length; i++) {
    const { name, options } = optionSets[i];
    console.log('\\n' + '='.repeat(60));
    console.log('🧪 테스트', i + 1, ':', name);
    console.log('⚙️ 옵션:', JSON.stringify(options, null, 2));
    console.log('='.repeat(60) + '\\n');

    try {
      const result = Parser.processReplay(replayPath, options);

      console.log('✅ 파싱 성공');
      console.log('📊 상태:', result?.status);
      console.log('🔑 결과 키들:', result ? Object.keys(result) : 'null');

      if (result && result.players) {
        console.log('👥 플레이어 수:', Object.keys(result.players).length);

        // 첫 번째 플레이어의 데이터 구조 분석
        const firstPlayerKey = Object.keys(result.players)[0];
        const firstPlayer = result.players[firstPlayerKey];

        console.log('\\n🔍 첫 번째 플레이어 데이터 구조:');
        console.log('- 이름:', firstPlayer.name);
        console.log('- 영웅:', firstPlayer.hero);
        console.log('- 팀:', firstPlayer.team);
        console.log('- 데이터 키들:', Object.keys(firstPlayer));

        // 통계 관련 데이터 확인
        if (firstPlayer.stats) {
          console.log('📈 stats 객체:', Object.keys(firstPlayer.stats));
          console.log('📈 stats 값들:', firstPlayer.stats);
        } else {
          console.log('❌ stats 객체 없음');
        }

        if (firstPlayer.scoreResult) {
          console.log('🏆 scoreResult 객체:', Object.keys(firstPlayer.scoreResult));
          console.log('🏆 scoreResult 값들:', firstPlayer.scoreResult);
        } else {
          console.log('❌ scoreResult 객체 없음');
        }

        if (firstPlayer.score) {
          console.log('🎯 score 객체:', Object.keys(firstPlayer.score));
          console.log('🎯 score 값들:', firstPlayer.score);
        } else {
          console.log('❌ score 객체 없음');
        }

        // 다른 가능한 통계 필드들 확인
        const possibleStatFields = [
          'heroDamage', 'siegeDamage', 'healing', 'damageDone', 'structureDamage',
          'healingDone', 'experienceContribution', 'experience', 'takedowns',
          'deaths', 'assists', 'soloKills', 'level', 'heroLevel'
        ];

        console.log('\\n🔍 가능한 통계 필드들:');
        possibleStatFields.forEach(field => {
          if (firstPlayer[field] !== undefined) {
            const value = firstPlayer[field];
            if (Array.isArray(value)) {
              console.log('✅', field + ':', '배열 (길이:', value.length + ')');
            } else {
              console.log('✅', field + ':', value);
            }
          } else {
            console.log('❌', field + ':', 'undefined');
          }
        });

      } else {
        console.log('❌ 플레이어 데이터 없음');
      }

    } catch (error) {
      console.error('❌ 파싱 실패:', error.message);
    }
  }
}

// 테스트 실행
testParserOptions().then(() => {
  console.log('\\n🎉 옵션 테스트 완료!');
  process.exit(0);
}).catch(error => {
  console.error('💥 테스트 실행 오류:', error);
  process.exit(1);
});
