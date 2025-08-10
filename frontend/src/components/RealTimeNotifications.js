import React from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// 实时通知页面
function RealTimeNotifications() {
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [settings, setSettings] = React.useState({
    push_enabled: true,
    sound_enabled: true,
    email_enabled: false
  });

  // 示例通知数据
  const sampleNotifications = [
    {
      id: 1,
      title: '任务挑战完成',
      message: '恭喜你完成了"晨跑健身"挑战，获得15积分奖励！',
      type: 'task',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: 2,
      title: '新活动通知',
      message: '社区读书会将在明天下午2点开始，记得准时参加哦！',
      type: 'activity',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: 3,
      title: '系统消息',
      message: '你的账户已成功升级为VIP会员，享受更多特权服务。',
      type: 'system',
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
    },
    {
      id: 4,
      title: '好友邀请',
      message: '张三邀请你成为好友，点击查看详情。',
      type: 'message',
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
      id: 5,
      title: '积分奖励',
      message: '你获得了"积极参与"徽章，额外奖励10积分！',
      type: 'reward',
      is_read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ];

  React.useEffect(() => {
    loadNotifications();
    // 模拟实时更新
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await axios.get('/real-time-notifications');
      if (data.length === 0) {
        setNotifications(sampleNotifications);
      } else {
        setNotifications(data);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
      setNotifications(sampleNotifications);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/real-time-notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      if (window.showToast) {
        window.showToast('操作失败', 'error');
      }
    }
  };

  const updateSettings = async () => {
    try {
      await axios.put('/real-time-notifications/settings', settings);
      if (window.showToast) {
        window.showToast('设置已保存', 'success');
      }
      setShowSettings(false);
    } catch (error) {
      if (window.showToast) {
        window.showToast('保存设置失败', 'error');
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      task: '🎯',
      activity: '🎉',
      message: '💬',
      system: '🔔',
      reward: '⭐'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      task: '#10b981',
      activity: '#3b82f6',
      message: '#8b5cf6',
      system: '#f59e0b',
      reward: '#fbbf24'
    };
    return colors[type] || '#6b7280';
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter;
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const rewards = notifications.filter(n => n.type === 'reward').length;
    return { total, unread, rewards };
  };

  const stats = getStats();

  if (loading) return (
    <div className="fade-in">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载通知中...</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* 页面头部 */}
      <div className="page-header notifications-header">
        <div className="header-content">
          <h1>🔔 实时通知</h1>
          <p>及时获取社区最新动态和重要消息</p>
        </div>
        <button 
          className="btn btn-outline btn-large notifications-settings-btn"
          onClick={() => setShowSettings(true)}
        >
          <span className="btn-icon">⚙️</span>
          设置
        </button>
      </div>

      {/* 通知统计 */}
      <div className="notifications-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总通知</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.unread}</div>
          <div className="stat-label">未读</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.rewards}</div>
          <div className="stat-label">奖励</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="notifications-filter">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索通知内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">全部</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'task' ? 'active' : ''}`}
            onClick={() => setFilter('task')}
          >
            <span className="tab-icon">🎯</span>
            <span className="tab-text">任务</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'activity' ? 'active' : ''}`}
            onClick={() => setFilter('activity')}
          >
            <span className="tab-icon">🎉</span>
            <span className="tab-text">活动</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'reward' ? 'active' : ''}`}
            onClick={() => setFilter('reward')}
          >
            <span className="tab-icon">⭐</span>
            <span className="tab-text">奖励</span>
          </button>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>暂无通知</h3>
            <p>{searchQuery ? '没有找到匹配的通知' : '有新的社区动态时会在这里显示'}</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <motion.div 
              key={notification.id} 
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="notification-icon"
                style={{ color: getNotificationColor(notification.type) }}
              >
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">
                  {new Date(notification.created_at).toLocaleString()}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button 
                    className="btn btn-small btn-outline mark-read-btn"
                    onClick={() => markAsRead(notification.id)}
                  >
                    标记已读
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="modal-overlay notifications-settings-modal" onClick={() => setShowSettings(false)}>
          <div className="modal-content notifications-settings-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header notifications-settings-header">
              <div className="header-left">
                <h3>⚙️ 通知设置</h3>
                <p>自定义你的通知偏好设置</p>
              </div>
            </div>
            
            <div className="modal-body notifications-settings-body">
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>推送通知</label>
                    <p>接收实时推送消息</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.push_enabled}
                    onChange={(e) => setSettings({...settings, push_enabled: e.target.checked})}
                    className="setting-toggle"
                  />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>声音提醒</label>
                    <p>收到通知时播放声音</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sound_enabled}
                    onChange={(e) => setSettings({...settings, sound_enabled: e.target.checked})}
                    className="setting-toggle"
                  />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>邮件通知</label>
                    <p>重要通知发送到邮箱</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.email_enabled}
                    onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
                    className="setting-toggle"
                  />
                </div>
              </div>
              
              <div className="settings-tips">
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  <span className="tip-text">开启推送通知可以及时收到重要消息</span>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🔊</span>
                  <span className="tip-text">声音提醒适合在安静环境下使用</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer notifications-settings-footer">
              <button className="btn btn-outline" onClick={() => setShowSettings(false)}>取消</button>
              <button 
                className="settings-submit-btn"
                onClick={updateSettings}
              >
                <span className="btn-icon">💾</span>
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeNotifications;
