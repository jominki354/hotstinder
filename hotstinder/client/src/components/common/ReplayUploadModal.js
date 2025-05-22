import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ReplayUploadModal = ({ isOpen, onClose, matchId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  if (!isOpen) return null;
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // 파일 확장자 검사
    if (!selectedFile.name.toLowerCase().endsWith('.stormreplay')) {
      setError('유효한 .StormReplay 파일만 업로드할 수 있습니다.');
      setFile(null);
      return;
    }
    
    // 파일 크기 검사 (20MB 제한)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB를 초과할 수 없습니다.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('업로드할 리플레이 파일을 선택해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setMessage('리플레이 파일을 업로드하고 분석 중입니다...');
      
      // FormData 객체 생성
      const formData = new FormData();
      formData.append('replayFile', file);
      formData.append('matchId', matchId);
      
      // API 요청
      const response = await axios.post('/api/replay/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 성공 메시지
      setMessage('리플레이 파일이 성공적으로 업로드되었습니다.');
      toast.success('리플레이 파일이 성공적으로 분석되었습니다.');
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose(true); // 업로드 성공 상태 전달
      }, 3000);
      
    } catch (err) {
      console.error('리플레이 업로드 오류:', err);
      setError(err.response?.data?.message || '리플레이 업로드 중 오류가 발생했습니다.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">리플레이 파일 업로드</h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-indigo-900/30 border border-indigo-500 text-indigo-200 px-4 py-3 rounded-md mb-4">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">
              리플레이 파일 (.StormReplay)
            </label>
            <input
              type="file"
              accept=".StormReplay"
              onChange={handleFileChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <p className="text-slate-400 text-sm mt-1">
              Heroes of the Storm 리플레이 파일(.StormReplay)만 업로드 가능합니다.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 transition"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className={`
                bg-indigo-600 text-white px-4 py-2 rounded transition
                ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700'}
              `}
              disabled={loading}
            >
              {loading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplayUploadModal; 