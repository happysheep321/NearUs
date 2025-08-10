import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchAchievements();
    fetchUserStats();
  }, [selectedPeriod]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`/api/leaderboard?period=${selectedPeriod}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('获取排行榜失败:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await axios.get('/api/achievements');
      setAchievements(response.data);
    } catch (error) {
      console.error('获取成就失败:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/user/stats');
      setUserStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取用户统计失败:', error);
      setLoading(false);
    }
  };

  const getLevelInfo = (points) => {
    const levels = [
      { level: 1, name: '新手', minPoints: 0, maxPoints: 100 },
      { level: 2, name: '活跃用户', minPoints: 101, maxPoints: 500 },
      { level: 3, name: '社区达人', minPoints: 501, maxPoints: 1000 },
      { level: 4, name: '邻里专家', minPoints: 1001, maxPoints: 2000 },
      { level: 5, name: '社区领袖', minPoints: 2001, maxPoints: 5000 },
      { level: 6, name: '传奇人物', minPoints: 5001, maxPoints: 10000 },
      { level: 7, name: '社区传奇', minPoints: 10001, maxPoints: Infinity }
    ];
    
    return levels.find(l => points >= l.minPoints && points <= l.maxPoints);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const chartData = {
    labels: leaderboard.slice(0, 10).map(user => user.username),
    datasets: [
      {
        label: '积分',
        data: leaderboard.slice(0, 10).map(user => user.points),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">积分排行榜</h1>
        
        {/* 用户统计卡片 */}
        {userStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats.points}</div>
                <div className="text-sm opacity-90">总积分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getLevelInfo(userStats.points)?.level}</div>
                <div className="text-sm opacity-90">当前等级</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats.rank}</div>
                <div className="text-sm opacity-90">排名</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats.achievements}</div>
                <div className="text-sm opacity-90">成就数量</div>
              </div>
            </div>
            
            {/* 等级进度条 */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{getLevelInfo(userStats.points)?.name}</span>
                <span>下一级: {getLevelInfo(userStats.points + 1)?.name}</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, ((userStats.points - getLevelInfo(userStats.points)?.minPoints) / 
                    (getLevelInfo(userStats.points)?.maxPoints - getLevelInfo(userStats.points)?.minPoints)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 时间筛选 */}
        <div className="flex space-x-2 mb-6">
          {['all', 'week', 'month'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period === 'all' ? '全部时间' : period === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 排行榜 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">排行榜</h2>
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center p-4 rounded-lg transition-colors ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-2xl font-bold mr-4 w-8 text-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{user.username}</div>
                    <div className="text-sm text-gray-600">
                      {getLevelInfo(user.points)?.name} • {user.points} 积分
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">#{user.rank}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 图表 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">积分分布</h2>
            <Bar data={chartData} options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }} />
          </div>
        </div>

        {/* 成就系统 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">成就系统</h2>
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">
                      {achievement.unlocked ? '🏆' : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{achievement.name}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        奖励: {achievement.points} 积分
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
