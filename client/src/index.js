import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import './index.css';

// API 기본 URL 설정
const getApiBaseURL = () => {
  // 로컬 개발 환경
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// axios 기본 설정
axios.defaults.baseURL = getApiBaseURL();
axios.defaults.withCredentials = true;

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 