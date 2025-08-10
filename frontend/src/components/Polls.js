import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { auth } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get('/polls');
      setPolls(response.data);
    } catch (error) {
      showToast('获取投票失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async (formData) => {
    try {
      await axios.post('/polls', formData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      showToast('投票创建成功！', 'success');
      setShowCreateForm(false);
      fetchPolls();
    } catch (error) {
      showToast(error.response?.data?.error || '创建失败', 'error');
    }
  };

  const votePoll = async (pollId, selectedOptions) => {
    try {
      await axios.post(`/polls/${pollId}/vote`, {
        selected_options: selectedOptions
      }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      showToast('投票成功！', 'success');
      fetchPolls();
    } catch (error) {
      showToast(error.response?.data?.error || '投票失败', 'error');
    }
  };

  const isExpired = (poll) => {
    return new Date(poll.end_time) < new Date();
  };

  const isActive = (poll) => {
    return poll.is_active && !isExpired(poll);
  };

  const getVotePercentage = (poll, optionIndex) => {
    const totalVotes = poll.votes?.length || 0;
    if (totalVotes === 0) return 0;
    
    const optionVotes = poll.votes?.filter(vote => 
      JSON.parse(vote.selected_options).includes(optionIndex)
    ).length || 0;
    
    return Math.round((optionVotes / totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="polls-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="polls-container">
      <div className="polls-header">
        <h2>🗳️ 社区投票</h2>
        {auth?.user && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ 创建投票
          </motion.button>
        )}
      </div>

      {/* 进行中的投票 */}
      <div className="active-polls">
        <h3>📊 进行中的投票 ({polls.filter(isActive).length})</h3>
        <div className="polls-grid">
          <AnimatePresence>
            {polls.filter(isActive).map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={votePoll}
                isActive={true}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 已结束的投票 */}
      <div className="expired-polls">
        <h3>⏰ 已结束的投票 ({polls.filter(isExpired).length})</h3>
        <div className="polls-grid">
          {polls.filter(isExpired).map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={votePoll}
              isActive={false}
            />
          ))}
        </div>
      </div>

      {/* 创建投票表单 */}
      {showCreateForm && (
        <div className="modal-overlay">
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <CreatePollForm
              onSubmit={createPoll}
              onCancel={() => setShowCreateForm(false)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

// 投票卡片组件
const PollCard = ({ poll, onVote, isActive }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const { auth } = useAuth();

  const handleOptionSelect = (optionIndex) => {
    if (poll.poll_type === 'single') {
      setSelectedOptions([optionIndex]);
    } else {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    }
  };

  const handleVote = () => {
    if (selectedOptions.length === 0) return;
    onVote(poll.id, selectedOptions);
    setHasVoted(true);
  };

  const totalVotes = poll.votes?.length || 0;

  return (
    <motion.div
      className={`poll-card ${isActive ? 'active' : 'expired'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="poll-header">
        <h4 className="poll-title">{poll.title}</h4>
        <div className="poll-meta">
          <span className="poll-type">
            {poll.poll_type === 'single' ? '单选' : '多选'}
          </span>
          <span className="poll-votes">
            {totalVotes} 票
          </span>
        </div>
      </div>

      <p className="poll-description">{poll.description}</p>

      <div className="poll-options">
        {poll.options.map((option, index) => {
          const percentage = getVotePercentage(poll, index);
          const isSelected = selectedOptions.includes(index);
          
          return (
            <motion.div
              key={index}
              className={`poll-option ${isSelected ? 'selected' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && !hasVoted ? (
                <label className="option-label">
                  <input
                    type={poll.poll_type === 'single' ? 'radio' : 'checkbox'}
                    name={`poll-${poll.id}`}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(index)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ) : (
                <div className="option-result">
                  <span className="option-text">{option}</span>
                  <div className="option-bar">
                    <div 
                      className="option-progress" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="option-percentage">{percentage}%</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="poll-footer">
        <div className="poll-info">
          <span>结束时间: {new Date(poll.end_time).toLocaleString()}</span>
          {!isActive && <span className="expired-badge">已结束</span>}
        </div>
        
        {isActive && auth?.user && !hasVoted && (
          <motion.button
            className="btn btn-primary"
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            投票
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// 创建投票表单组件
const CreatePollForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    poll_type: 'single',
    options: ['', ''],
    end_time: '',
    is_public: true
  });

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.options.some(option => !option.trim())) {
      alert('请填写所有选项');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-poll-form">
      <h3>创建投票</h3>
      
      <div className="form-group">
        <label>投票标题</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>投票描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>投票类型</label>
          <select
            value={formData.poll_type}
            onChange={(e) => setFormData({...formData, poll_type: e.target.value})}
            className="form-input"
          >
            <option value="single">单选</option>
            <option value="multiple">多选</option>
          </select>
        </div>

        <div className="form-group">
          <label>结束时间</label>
          <input
            type="datetime-local"
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>投票选项</label>
        <div className="options-list">
          {formData.options.map((option, index) => (
            <div key={index} className="option-input-group">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`选项 ${index + 1}`}
                required
                className="form-input"
              />
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="btn btn-danger"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="btn btn-secondary"
        >
          ➕ 添加选项
        </button>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
          />
          公开投票
        </label>
      </div>

      <div className="form-actions">
        <motion.button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          取消
        </motion.button>
        <motion.button
          type="submit"
          className="btn btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          创建
        </motion.button>
      </div>
    </form>
  );
};

export default Polls;
