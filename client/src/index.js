import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import './index.css';

// API 기본 URL 설정
const getApiBaseURL = () => {
  // 환경 변수에서 API URL 가져오기, 없으면 로컬 개발 서버 사용
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// axios 기본 설정
axios.defaults.baseURL = getApiBaseURL();
axios.defaults.withCredentials = true;

// 개발 환경에서 API URL 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', getApiBaseURL());
}

// axios 인터셉터 설정
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// axios 응답 인터셉터 설정
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 오류 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 