import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const notificationRef = useRef(null);

  useEffect(() => {
    // 初始化Socket连接
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Socket事件监听
    newSocket.on('connect', () => {
      console.log('已连接到通知服务器');
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('user_online', (user) => {
      setOnlineUsers(prev => [...prev, user]);
    });

    newSocket.on('user_offline', (userId) => {
      setOnlineUsers(prev => prev.filter(user => user.id !== userId));
    });

    // 获取历史通知
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // 点击外部关闭通知面板
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
      setLoading(false);
    } catch (error) {
      console.error('获取通知失败:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      message: '💬',
      activity: '🎉',
      reminder: '⏰',
      achievement: '🏆',
      system: '🔔',
      business: '🏪',
      event: '📅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      message: 'bg-blue-100 border-blue-200',
      activity: 'bg-green-100 border-green-200',
      reminder: 'bg-yellow-100 border-yellow-200',
      achievement: 'bg-purple-100 border-purple-200',
      system: 'bg-gray-100 border-gray-200',
      business: 'bg-indigo-100 border-indigo-200',
      event: 'bg-pink-100 border-pink-200',
      warning: 'bg-orange-100 border-orange-200',
      error: 'bg-red-100 border-red-200'
    };
    return colors[type] || 'bg-gray-100 border-gray-200';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return time.toLocaleDateString();
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">实时通知系统</h1>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {notifications.length}
            </div>
            <div className="text-sm text-gray-600">总通知</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {unreadCount}
            </div>
            <div className="text-sm text-gray-600">未读通知</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {onlineUsers.length}
            </div>
            <div className="text-sm text-gray-600">在线用户</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {socket?.connected ? '🟢' : '🔴'}
            </div>
            <div className="text-sm text-gray-600">连接状态</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 通知列表 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">通知列表</h2>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    全部已读
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  设置
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTime(notification.created_at)}</span>
                          <div className="flex space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                标记已读
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {notifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无通知
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 在线用户 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">在线用户</h2>
            <div className="space-y-3">
              {onlineUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="font-semibold text-green-800">{user.username}</div>
                    <div className="text-sm text-green-600">{user.role}</div>
                  </div>
                  <div className="text-xs text-green-500">
                    {formatTime(user.last_seen)}
                  </div>
                </motion.div>
              ))}
              
              {onlineUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无在线用户
                </div>
              )}
            </div>
          </div>

          {/* 通知设置 */}
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 mt-6"
            >
              <h3 className="text-lg font-semibold mb-4">通知设置</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>消息通知</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>活动提醒</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>成就通知</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>系统通知</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>声音提醒</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeNotifications;
