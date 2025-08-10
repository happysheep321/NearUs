import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const Quest = () => {
  const [quests, setQuests] = useState([]);
  const [userQuests, setUserQuests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
    fetchUserQuests();
  }, [selectedCategory]);

  const fetchQuests = async () => {
    try {
      const response = await axios.get(`/api/quests?category=${selectedCategory}`);
      setQuests(response.data);
    } catch (error) {
      console.error('获取任务失败:', error);
    }
  };

  const fetchUserQuests = async () => {
    try {
      const response = await axios.get('/api/user/quests');
      setUserQuests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取用户任务失败:', error);
      setLoading(false);
    }
  };

  const acceptQuest = async (questId) => {
    try {
      await axios.post(`/api/quests/${questId}/accept`);
      fetchUserQuests();
      fetchQuests();
    } catch (error) {
      console.error('接受任务失败:', error);
    }
  };

  const completeQuest = async (questId) => {
    try {
      await axios.post(`/api/quests/${questId}/complete`);
      fetchUserQuests();
      fetchQuests();
    } catch (error) {
      console.error('完成任务失败:', error);
    }
  };

  const getQuestIcon = (type) => {
    const icons = {
      daily: '📅',
      weekly: '📆',
      achievement: '🏆',
      challenge: '🎯',
      social: '👥',
      business: '🏪',
      event: '🎉'
    };
    return icons[type] || '📋';
  };

  const getQuestStatus = (quest) => {
    const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
    if (!userQuest) return 'available';
    if (userQuest.completed) return 'completed';
    if (userQuest.progress >= quest.target) return 'ready';
    return 'in_progress';
  };

  const getProgressPercentage = (quest) => {
    const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
    if (!userQuest) return 0;
    return Math.min(100, (userQuest.progress / quest.target) * 100);
  };

  const categories = [
    { id: 'all', name: '全部', color: 'bg-gray-500' },
    { id: 'daily', name: '日常任务', color: 'bg-blue-500' },
    { id: 'weekly', name: '周常任务', color: 'bg-green-500' },
    { id: 'achievement', name: '成就任务', color: 'bg-yellow-500' },
    { id: 'challenge', name: '挑战任务', color: 'bg-red-500' },
    { id: 'social', name: '社交任务', color: 'bg-purple-500' },
    { id: 'business', name: '商业任务', color: 'bg-indigo-500' },
    { id: 'event', name: '活动任务', color: 'bg-pink-500' }
  ];

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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">任务挑战系统</h1>
        
        {/* 任务统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {userQuests.filter(q => q.completed).length}
            </div>
            <div className="text-sm text-gray-600">已完成</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {userQuests.filter(q => !q.completed && q.progress > 0).length}
            </div>
            <div className="text-sm text-gray-600">进行中</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {userQuests.filter(q => !q.completed && q.progress >= q.target).length}
            </div>
            <div className="text-sm text-gray-600">可完成</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {userQuests.reduce((sum, q) => sum + (q.reward || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">总奖励积分</div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? `${category.color} text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 可用任务 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">可用任务</h2>
          <div className="space-y-4">
            {quests.filter(quest => getQuestStatus(quest) === 'available').map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{getQuestIcon(quest.type)}</span>
                      <h3 className="font-semibold">{quest.title}</h3>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        quest.type === 'daily' ? 'bg-blue-100 text-blue-800' :
                        quest.type === 'weekly' ? 'bg-green-100 text-green-800' :
                        quest.type === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quest.type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{quest.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">目标: {quest.target}</span>
                      <span className="text-green-600 font-semibold">奖励: {quest.reward} 积分</span>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptQuest(quest.id)}
                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    接受任务
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 进行中的任务 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">进行中的任务</h2>
          <div className="space-y-4">
            {userQuests.filter(userQuest => !userQuest.completed).map((userQuest, index) => {
              const quest = quests.find(q => q.id === userQuest.quest_id);
              if (!quest) return null;
              
              const progress = getProgressPercentage(quest);
              const status = getQuestStatus(quest);
              
              return (
                <motion.div
                  key={userQuest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 ${
                    status === 'ready' ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getQuestIcon(quest.type)}</span>
                        <h3 className="font-semibold">{quest.title}</h3>
                        {status === 'ready' && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            可完成
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{quest.description}</p>
                      
                      {/* 进度条 */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>进度: {userQuest.progress} / {quest.target}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              status === 'ready' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">奖励: {quest.reward} 积分</span>
                        {status === 'ready' && (
                          <button
                            onClick={() => completeQuest(quest.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            完成任务
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 已完成的任务 */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">已完成的任务</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userQuests.filter(userQuest => userQuest.completed).map((userQuest, index) => {
            const quest = quests.find(q => q.id === userQuest.quest_id);
            if (!quest) return null;
            
            return (
              <motion.div
                key={userQuest.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">✅</span>
                  <h3 className="font-semibold text-green-800">{quest.title}</h3>
                </div>
                <p className="text-green-700 text-sm mb-2">{quest.description}</p>
                <div className="text-sm text-green-600">
                  完成时间: {new Date(userQuest.completed_at).toLocaleDateString()}
                </div>
                <div className="text-sm font-semibold text-green-800 mt-1">
                  获得奖励: {quest.reward} 积分
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Quest;
