module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    // 사용하지 않는 변수 경고
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    
    // React Hook 의존성 배열 검사
    'react-hooks/exhaustive-deps': 'warn',
    
    // 콘솔 로그 허용 (개발 중)
    'no-console': 'off',
    
    // 세미콜론 강제
    'semi': ['error', 'always'],
    
    // 따옴표 일관성
    'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
    
    // 들여쓰기 (2칸)
    'indent': ['warn', 2, { SwitchCase: 1 }],
    
    // 줄 끝 공백 제거
    'no-trailing-spaces': 'warn',
    
    // 빈 줄 최대 2개
    'no-multiple-empty-lines': ['warn', { max: 2 }],
    
    // 객체/배열 마지막 쉼표
    'comma-dangle': ['warn', 'only-multiline'],
    
    // JSX에서 따옴표 일관성
    'jsx-quotes': ['warn', 'prefer-double'],
    
    // React 컴포넌트 이름 PascalCase
    'react/jsx-pascal-case': 'warn',
    
    // 사용하지 않는 React import 허용 (React 17+)
    'react/react-in-jsx-scope': 'off',
    
    // prop-types 검사 비활성화 (TypeScript 사용 시)
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 