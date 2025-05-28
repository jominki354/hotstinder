import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // 사용하지 않는 변수 경고
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      
      // 콘솔 로그 허용 (서버에서는 로깅이 중요)
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
      
      // 변수 선언 전 사용 금지
      'no-use-before-define': ['error', { functions: false }],
      
      // 중복 키 금지
      'no-dupe-keys': 'error',
      
      // 도달할 수 없는 코드 경고
      'no-unreachable': 'warn',
      
      // 비교 연산자 일관성
      'eqeqeq': ['warn', 'always'],
      
      // 중괄호 스타일
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
      
      // 함수 괄호 앞 공백
      'space-before-function-paren': ['warn', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      
      // 키워드 앞뒤 공백
      'keyword-spacing': 'warn',
      
      // 쉼표 뒤 공백
      'comma-spacing': ['warn', { before: false, after: true }],
      
      // 객체 중괄호 내부 공백
      'object-curly-spacing': ['warn', 'always'],
      
      // 배열 대괄호 내부 공백 없음
      'array-bracket-spacing': ['warn', 'never'],
    },
  },
]; 