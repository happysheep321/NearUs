import React from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// 投票页面
function Polls() {
  const [polls, setPolls] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // 示例投票数据
  const samplePolls = [
    {
      id: 1,
      title: '社区活动投票',
      description: '下个月社区活动选择，请投票选出您最感兴趣的活动',
      options: [
        { id: 1, text: '社区烧烤派对', votes: 15, percentage: 30 },
        { id: 2, text: '邻里读书会', votes: 12, percentage: 24 },
        { id: 3, text: '晨跑健身团', votes: 18, percentage: 36 },
        { id: 4, text: '手工DIY工作坊', votes: 5, percentage: 10 }
      ],
      total_votes: 50,
      status: 'active',
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      creator: { username: '社区管理员' },
      category: 'activity',
      is_voted: false,
      voted_option: null
    },
    {
      id: 2,
      title: '社区设施改进建议',
      description: '您希望社区优先改进哪些设施？',
      options: [
        { id: 1, text: '增加健身器材', votes: 25, percentage: 35 },
        { id: 2, text: '扩建儿童游乐场', votes: 20, percentage: 28 },
        { id: 3, text: '增设休息座椅', votes: 15, percentage: 21 },
        { id: 4, text: '改善照明设施', votes: 10, percentage: 16 }
      ],
      total_votes: 70,
      status: 'active',
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      creator: { username: '物业公司' },
      category: 'facility',
      is_voted: true,
      voted_option: 1
    },
    {
      id: 3,
      title: '社区规则修订',
      description: '关于社区宠物管理规则的修订意见征集',
      options: [
        { id: 1, text: '允许养宠物，但需要登记', votes: 30, percentage: 50 },
        { id: 2, text: '禁止养宠物', votes: 15, percentage: 25 },
        { id: 3, text: '允许养小型宠物', votes: 15, percentage: 25 }
      ],
      total_votes: 60,
      status: 'expired',
      end_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      creator: { username: '业委会' },
      category: 'rule',
      is_voted: false,
      voted_option: null
    },
    {
      id: 4,
      title: '社区节日庆祝方式',
      description: '今年春节社区庆祝活动形式选择',
      options: [
        { id: 1, text: '传统庙会', votes: 22, percentage: 44 },
        { id: 2, text: '现代晚会', votes: 18, percentage: 36 },
        { id: 3, text: '美食节', votes: 10, percentage: 20 }
      ],
      total_votes: 50,
      status: 'active',
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      creator: { username: '节日筹备组' },
      category: 'festival',
      is_voted: true,
      voted_option: 2
    }
  ];

  React.useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const { data } = await axios.get('/polls');
      if (data.length === 0) {
        setPolls(samplePolls);
      } else {
        setPolls(data);
      }
    } catch (error) {
      console.error('加载投票失败:', error);
      setPolls(samplePolls);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (pollId, optionId) => {
    try {
      await axios.post(`/polls/${pollId}/vote`, { option_id: optionId });
      if (window.showToast) {
        window.showToast('投票成功！', 'success');
      }
      loadPolls();
    } catch (error) {
      if (window.showToast) {
        window.showToast('投票失败', 'error');
      }
    }
  };

  const getCategoryInfo = (category) => {
    const categories = {
      activity: { label: '活动', icon: '🎉', color: '#3b82f6' },
      facility: { label: '设施', icon: '🏗️', color: '#10b981' },
      rule: { label: '规则', icon: '📋', color: '#f59e0b' },
      festival: { label: '节日', icon: '🎊', color: '#8b5cf6' }
    };
    return categories[category] || { label: '其他', icon: '📊', color: '#6b7280' };
  };

  const getStatusInfo = (poll) => {
    const isExpired = new Date(poll.end_date) < new Date();
    if (isExpired) {
      return { label: '已结束', icon: '⏰', color: '#6b7280' };
    } else {
      return { label: '进行中', icon: '🔄', color: '#10b981' };
    }
  };

  const filteredPolls = polls.filter(poll => {
    const matchesFilter = filter === 'all' || poll.category === filter;
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         poll.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStats = () => {
    const total = polls.length;
    const active = polls.filter(p => new Date(p.end_date) > new Date()).length;
    const expired = polls.filter(p => new Date(p.end_date) <= new Date()).length;
    const voted = polls.filter(p => p.is_voted).length;
    return { total, active, expired, voted };
  };

  const stats = getStats();

  if (loading) return (
    <div className="fade-in">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载投票中...</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* 页面头部 */}
      <div className="page-header polls-header">
        <div className="header-content">
          <h1>📊 投票</h1>
          <p>参与社区决策，表达您的意见</p>
        </div>
        <button 
          className="btn btn-primary btn-large polls-create-btn"
          onClick={() => setShowCreate(true)}
        >
          <span className="btn-icon">➕</span>
          创建投票
        </button>
      </div>

      {/* 投票统计 */}
      <div className="polls-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总投票</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.expired}</div>
          <div className="stat-label">已结束</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.voted}</div>
          <div className="stat-label">已参与</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="polls-filter">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索投票内容..."
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
            <span className="tab-icon">📊</span>
            <span className="tab-text">全部</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'activity' ? 'active' : ''}`}
            onClick={() => setFilter('activity')}
          >
            <span className="tab-icon">🎉</span>
            <span className="tab-text">活动</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'facility' ? 'active' : ''}`}
            onClick={() => setFilter('facility')}
          >
            <span className="tab-icon">🏗️</span>
            <span className="tab-text">设施</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'rule' ? 'active' : ''}`}
            onClick={() => setFilter('rule')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">规则</span>
          </button>
        </div>
      </div>

      {/* 投票列表 */}
      <div className="polls-grid">
        {filteredPolls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>暂无投票</h3>
            <p>{searchQuery ? '没有找到匹配的投票' : '暂时没有可参与的投票'}</p>
          </div>
        ) : (
          filteredPolls.map(poll => {
            const categoryInfo = getCategoryInfo(poll.category);
            const statusInfo = getStatusInfo(poll);
            const isExpired = new Date(poll.end_date) < new Date();
            
            return (
              <motion.div 
                key={poll.id} 
                className={`poll-card ${isExpired ? 'expired' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="poll-header">
                  <div className="poll-title">{poll.title}</div>
                  <div className="poll-status">
                    <span className="status-icon">{statusInfo.icon}</span>
                    <span className="status-label">{statusInfo.label}</span>
                  </div>
                </div>
                
                <div className="poll-description">{poll.description}</div>
                
                <div className="poll-meta">
                  <div className="meta-item">
                    <span className="meta-icon">👤</span>
                    <span className="meta-text">{poll.creator.username}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span className="meta-text">
                      {new Date(poll.end_date).toLocaleDateString()}结束
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🗳️</span>
                    <span className="meta-text">{poll.total_votes}票</span>
                  </div>
                </div>
                
                <div className="poll-category">
                  <span className="category-icon" style={{ color: categoryInfo.color }}>
                    {categoryInfo.icon}
                  </span>
                  <span className="category-label">{categoryInfo.label}</span>
                </div>
                
                <div className="poll-options">
                  {poll.options.map(option => (
                    <div key={option.id} className="poll-option">
                      <div className="option-content">
                        <button 
                          className={`option-button ${poll.is_voted && poll.voted_option === option.id ? 'voted' : ''} ${isExpired ? 'disabled' : ''}`}
                          onClick={() => !isExpired && !poll.is_voted && vote(poll.id, option.id)}
                          disabled={isExpired || poll.is_voted}
                        >
                          <span className="option-text">{option.text}</span>
                          {poll.is_voted && poll.voted_option === option.id && (
                            <span className="voted-icon">✅</span>
                          )}
                        </button>
                        <div className="option-stats">
                          <span className="vote-count">{option.votes}票</span>
                          <span className="vote-percentage">{option.percentage}%</span>
                        </div>
                      </div>
                      <div className="vote-bar">
                        <div 
                          className="vote-progress" 
                          style={{ width: `${option.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="poll-footer">
                  {poll.is_voted && (
                    <div className="voted-notice">
                      <span className="notice-icon">✅</span>
                      <span className="notice-text">您已参与此投票</span>
                    </div>
                  )}
                  {!poll.is_voted && !isExpired && (
                    <div className="vote-notice">
                      <span className="notice-icon">🗳️</span>
                      <span className="notice-text">请选择您的选项</span>
                    </div>
                  )}
                  {isExpired && (
                    <div className="expired-notice">
                      <span className="notice-icon">⏰</span>
                      <span className="notice-text">投票已结束</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Polls;
