const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 테스트용 JWT 토큰 (관리자 계정)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXRlc3QiLCJyb2xlIjoiYWRtaW4iLCJiYXR0bGVUYWciOiJUZXN0QWRtaW4jMTIzNCIsImlhdCI6MTc0ODg1OTg4MCwiZXhwIjoxNzQ4OTQ2MjgwfQ.bu1RYBuEBOoTRXtEhHh5R64P4IniA1FJKZECHqVpn5o';

async function testReplayAnalysis() {
  console.log('🎮 리플레이 분석 테스트 시작\n');

  // 테스트용 리플레이 파일 경로
  const replayPath = path.join(__dirname, 'uploads/replays/replay-1748409465778-318841216.StormReplay');

  if (!fs.existsSync(replayPath)) {
    console.error('❌ 테스트용 리플레이 파일을 찾을 수 없습니다:', replayPath);
    return;
  }

  console.log('📁 테스트 파일:', replayPath);
  console.log('📊 파일 크기:', Math.round(fs.statSync(replayPath).size / 1024) + 'KB\n');

  try {
    // 1. 서버 API 테스트 (관리자 페이지 방식)
    console.log('=== 1. 서버 API 테스트 (관리자 페이지 방식) ===');
    await testServerAPI(replayPath);

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Vercel API 테스트 (업로드 모달 방식) - 현재는 서버 API 사용
    console.log('=== 2. 업로드 모달 방식 테스트 (현재 서버 API 사용) ===');
    await testUploadModalAPI(replayPath);

  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error.message);
  }
}

async function testServerAPI(replayPath) {
  try {
    const formData = new FormData();
    formData.append('replayFile', fs.createReadStream(replayPath));

    console.log('📤 서버 API 요청 전송 중...');
    const response = await axios.post('http://localhost:5000/api/replay/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      timeout: 30000
    });

    console.log('✅ 서버 API 응답 성공');
    console.log('📊 응답 상태:', response.status);

    if (response.data.success && response.data.analysisResult) {
      const result = response.data.analysisResult;

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

    } else {
      console.error('❌ 서버 API 분석 실패:', response.data.error || response.data.message);
    }

  } catch (error) {
    console.error('❌ 서버 API 테스트 실패:', error.message);
    if (error.response) {
      console.error('- 상태 코드:', error.response.status);
      console.error('- 응답 데이터:', error.response.data);
    }
  }
}

async function testUploadModalAPI(replayPath) {
  try {
    // 업로드 모달도 현재 서버 API를 사용하므로 동일한 테스트
    console.log('📝 업로드 모달은 현재 서버 API를 사용하도록 수정되었습니다.');
    console.log('📤 동일한 서버 API 엔드포인트 테스트...');

    const formData = new FormData();
    formData.append('replayFile', fs.createReadStream(replayPath));

    const response = await axios.post('http://localhost:5000/api/replay/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      timeout: 30000
    });

    console.log('✅ 업로드 모달 방식 테스트 성공');
    console.log('📊 응답 상태:', response.status);

    if (response.data.success && response.data.analysisResult) {
      const result = response.data.analysisResult;

      console.log('\n🎯 분석 결과 (업로드 모달 방식):');
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

      console.log('\n🔍 결론:');
      if (hasRealStats) {
        console.log('✅ 관리자 페이지와 업로드 모달 모두 정상적으로 실제 통계값을 추출합니다!');
      } else {
        console.log('❌ 통계값이 모두 0으로 나옵니다. hots-parser 문제일 수 있습니다.');
      }

    } else {
      console.error('❌ 업로드 모달 방식 분석 실패:', response.data.error || response.data.message);
    }

  } catch (error) {
    console.error('❌ 업로드 모달 방식 테스트 실패:', error.message);
    if (error.response) {
      console.error('- 상태 코드:', error.response.status);
      console.error('- 응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testReplayAnalysis().then(() => {
  console.log('\n🎉 테스트 완료!');
  process.exit(0);
}).catch(error => {
  console.error('💥 테스트 실행 오류:', error);
  process.exit(1);
});
