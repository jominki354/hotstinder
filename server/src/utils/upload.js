const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 확인 및 생성
const uploadDir = path.join(__dirname, '../../uploads/replays');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 고유한 파일명 생성
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'replay-' + uniqueSuffix + ext);
  }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
  // .StormReplay 파일만 허용
  if (file.originalname.toLowerCase().endsWith('.stormreplay')) {
    return cb(null, true);
  }

  // 그 외 파일 타입 거부
  cb(new Error('지원되지 않는 파일 형식입니다. .StormReplay 파일만 업로드 가능합니다.'), false);
};

// multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 최대 20MB
  }
});

module.exports = upload;