import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AboutPage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              About HotsTinder
            </h1>
            <p className="text-xl text-gray-300">
              HotsTinder에 대해 알아보세요
            </p>
          </div>

          {/* Features Section */}
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                왜 <span className="text-blue-400">HotsTinder</span>인가?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                최첨단 매치메이킹 시스템으로 완벽한 게임 경험을 제공합니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group">
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">공정한 매칭</h3>
                  <p className="text-gray-300 leading-relaxed">
                    MMR 기반 정교한 알고리즘으로 실력이 비슷한 플레이어들과 매칭됩니다. 모든 경기가 치열하고 공정합니다.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group">
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">빠른 매칭</h3>
                  <p className="text-gray-300 leading-relaxed">
                    최적화된 매치메이킹 시스템으로 대기시간을 최소화합니다. 원하는 역할로 빠르게 게임을 시작하세요.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group">
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full hover:border-pink-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-pink-500/25 transition-all">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">상세한 통계</h3>
                  <p className="text-gray-300 leading-relaxed">
                    모든 경기 데이터를 분석하여 개인 성과와 성장 과정을 추적합니다. 데이터로 실력을 향상시키세요.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section>
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/30 rounded-3xl p-12">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  지금 바로 시작하세요!
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Heroes of the Storm의 새로운 차원을 경험해보세요.
                  완벽한 매치메이킹이 당신을 기다리고 있습니다.
                </p>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    무료로 시작하기
                  </Link>
                )}
                {isAuthenticated && (
                  <Link
                    to="/matchmaking"
                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    매치 찾기
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
