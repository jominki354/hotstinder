// 파일은 더 이상 사용되지 않습니다
// 모든 초기화 코드는 index.js로 이동했습니다

/*
// NeDB 데이터베이스 설정 확인 및 플래그 설정
// MongoDB 연결 실패 시 NeDB 사용
try {
  // 항상 NeDB를 사용하도록 설정
  global.useNeDB = true;
  console.log('NeDB 모드로 서버 실행 중');
  
  // NeDB가 초기화되었는지 확인
  if (!global.db) {
    console.log('NeDB 데이터베이스 초기화 중...');
    const Datastore = require('nedb');
    global.db = {
      users: new Datastore({ filename: './data/users.db', autoload: true }),
      matches: new Datastore({ filename: './data/matches.db', autoload: true }),
      matchmaking: new Datastore({ filename: './data/matchmaking.db', autoload: true })
    };
    console.log('NeDB 데이터베이스 초기화 완료');
  }
} catch (err) {
  console.error('데이터베이스 초기화 오류:', err);
} 
*/ 