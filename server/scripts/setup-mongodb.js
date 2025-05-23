require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB 연결 URI (환경변수에서 가져오거나 기본값 사용)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotstinder';

// 더미 데이터
const dummyUsers = [
  {
    bnetId: 'dummy1',
    battletag: '호덤이#3518',
    nickname: '호덤이',
    mmr: 2000,
    wins: 10,
    losses: 5,
    preferredRoles: ['원거리 암살자'],
    isDummy: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    bnetId: 'dummy2',
    battletag: '리슈#1234',
    nickname: '리슈',
    mmr: 1800,
    wins: 8,
    losses: 7,
    preferredRoles: ['서포터'],
    isDummy: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    bnetId: 'dummy3',
    battletag: '아기호랑이#5678',
    nickname: '아기호랑이',
    mmr: 2200,
    wins: 15,
    losses: 3,
    preferredRoles: ['탱커'],
    isDummy: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 데이터베이스 초기화 및 더미 데이터 삽입
async function setupMongoDB() {
  console.log('MongoDB 설정을 시작합니다...');
  
  try {
    // MongoDB 클라이언트 객체 생성
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    // MongoDB 연결
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    // 데이터베이스 및 컬렉션 참조
    const dbName = MONGODB_URI.split('/').pop().split('?')[0]; // URI에서 데이터베이스 이름 추출
    const db = client.db(dbName);
    
    // 기존 컬렉션 확인
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // 사용자 컬렉션 생성 또는 초기화
    if (!collectionNames.includes('users')) {
      console.log('사용자 컬렉션을 생성합니다...');
      await db.createCollection('users');
      
      // 인덱스 생성
      const usersCollection = db.collection('users');
      await usersCollection.createIndex({ bnetId: 1 }, { unique: true });
      await usersCollection.createIndex({ battletag: 1 });
      await usersCollection.createIndex({ nickname: 1 });
      await usersCollection.createIndex({ mmr: -1 }); // MMR 내림차순 정렬을 위한 인덱스
      
      console.log('사용자 컬렉션 및 인덱스가 생성되었습니다.');
    } else {
      console.log('사용자 컬렉션이 이미 존재합니다.');
    }
    
    // 매치 컬렉션 생성 또는 초기화
    if (!collectionNames.includes('matches')) {
      console.log('매치 컬렉션을 생성합니다...');
      await db.createCollection('matches');
      
      // 인덱스 생성
      const matchesCollection = db.collection('matches');
      await matchesCollection.createIndex({ createdAt: -1 });
      await matchesCollection.createIndex({ status: 1 });
      await matchesCollection.createIndex({ 'teams.blue.players.userId': 1 });
      await matchesCollection.createIndex({ 'teams.red.players.userId': 1 });
      
      console.log('매치 컬렉션 및 인덱스가 생성되었습니다.');
    } else {
      console.log('매치 컬렉션이 이미 존재합니다.');
    }
    
    // 더미 사용자 데이터 추가
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    
    if (userCount === 0) {
      console.log('더미 사용자 데이터를 추가합니다...');
      
      try {
        const result = await usersCollection.insertMany(dummyUsers);
        console.log(`${result.insertedCount}개의 더미 사용자가 추가되었습니다.`);
      } catch (insertErr) {
        console.error('더미 사용자 추가 중 오류:', insertErr);
        
        // 중복 키 오류인 경우 개별적으로 시도
        if (insertErr.code === 11000) {
          console.log('개별적으로 더미 사용자 추가를 시도합니다...');
          
          for (const user of dummyUsers) {
            try {
              await usersCollection.updateOne(
                { bnetId: user.bnetId },
                { $set: user },
                { upsert: true }
              );
              console.log(`사용자 업데이트됨: ${user.nickname}`);
            } catch (updateErr) {
              console.error(`사용자 업데이트 실패 (${user.nickname}):`, updateErr);
            }
          }
        }
      }
    } else {
      console.log(`이미 ${userCount}명의 사용자가 등록되어 있습니다.`);
    }
    
    // 연결 종료
    await client.close();
    console.log('MongoDB 연결이 종료되었습니다.');
    console.log('MongoDB 설정이 완료되었습니다!');
    
  } catch (error) {
    console.error('MongoDB 설정 중 오류가 발생했습니다:', error);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n** MongoDB 서버에 연결할 수 없습니다 **');
      console.error('다음 사항을 확인해주세요:');
      console.error('1. MongoDB가 설치되어 있고 실행 중인지 확인하세요.');
      console.error('2. MongoDB가 27017 포트에서 수신 대기 중인지 확인하세요.');
      console.error('3. .env 파일의 MONGODB_URI 설정이 올바른지 확인하세요.\n');
      
      // MongoDB 설치 방법 안내
      console.log('\n=== MongoDB 설치 방법 ===');
      console.log('Windows:');
      console.log('1. https://www.mongodb.com/try/download/community 에서 MongoDB Community Server를 다운로드');
      console.log('2. 다운로드된 설치 파일을 실행하고 지시에 따라 설치');
      console.log('\nDocker 사용:');
      console.log('docker run --name mongodb -d -p 27017:27017 mongo:latest');
    }
    
    process.exit(1);
  }
}

// 스크립트 실행
setupMongoDB(); 