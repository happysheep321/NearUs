import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import './index.css';

function useAuth() {
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : null;
  });
  const login = async (username, password) => {
    const { data } = await axios.post('/auth/login', { username, password });
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data.user);
  };
  const register = async (payload) => {
    const { data } = await axios.post('/auth/register', payload);
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
  };
  const token = () => {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    try { return JSON.parse(raw).access_token; } catch { return null; }
  };
  axios.interceptors.request.use((config) => {
    const t = token();
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  });
  return { user, login, register, logout };
}

function Layout({ auth }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/posts', icon: '💬', label: '动态' },
    { path: '/tasks', icon: '✅', label: '任务' },
    { path: '/activities', icon: '🎉', label: '活动' },
    { path: '/leaderboard', icon: '🏆', label: '排行' }
  ];

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <div className="app-logo">邻里APP</div>
          <div className="header-user">
            {auth.user ? (
              <>
                <span style={{ fontWeight: '600' }}>{auth.user.username}</span>
                <div className="points-indicator">{auth.user.credit_points || 0}</div>
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={auth.logout}
                  style={{ 
                    marginLeft: '8px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#dc2626',
                    border: 'none',
                    fontWeight: '600',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.2)',
                    borderRadius: '8px'
                  }}
                >
                  退出
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link 
                  to="/login" 
                  className="btn btn-small"
                  style={{ 
                    color: '#1e40af', 
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    fontSize: '0.85rem',
                    padding: '10px 18px',
                    fontWeight: '600',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  登录
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-small"
                  style={{ 
                    fontSize: '0.85rem',
                    padding: '10px 18px',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    color: '#065f46',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Home auth={auth} />} />
          <Route path="/login" element={<Login auth={auth} />} />
          <Route path="/register" element={<Register auth={auth} />} />
          <Route path="/posts" element={<Posts auth={auth} />} />
          <Route path="/groups" element={<Groups auth={auth} />} />
          <Route path="/activities" element={<Activities auth={auth} />} />
          <Route path="/tasks" element={<Tasks auth={auth} />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* 移动端底部导航 */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Home({ auth }) {
  const [stats, setStats] = React.useState({});
  
  React.useEffect(() => {
    (async () => {
      try {
        const [postsRes, groupsRes, activitiesRes, tasksRes] = await Promise.all([
          axios.get('/posts'),
          axios.get('/groups'),
          axios.get('/activities'),
          axios.get('/tasks')
        ]);
        setStats({
          posts: postsRes.data.length,
          groups: groupsRes.data.length,
          activities: activitiesRes.data.length,
          tasks: tasksRes.data.length
        });
      } catch (err) {
        console.log('获取统计信息失败');
      }
    })();
  }, []);

  return (
    <div className="fade-in">
      {!auth.user ? (
        // 游客模式：简洁的选择页面
        <div className="welcome-hero">
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🏠</div>
          <h1 className="welcome-title">邻里APP</h1>
          <p className="welcome-subtitle">
            连接邻里，共建温暖社区<br/>
            通过积分激励机制，让每一次互助都有价值
          </p>
          
          {/* 登录注册选择区域 */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            maxWidth: '400px',
            margin: '32px auto 0',
            padding: '0 16px'
          }}>
            {/* 登录按钮 */}
            <Link 
              to="/login" 
              className="btn modern-btn"
              style={{
                fontSize: '1.1rem',
                padding: '24px 20px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
                border: 'none',
                color: '#1e40af',
                fontWeight: '700',
                boxShadow: '0 16px 64px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px rgba(0,0,0,0.05)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: '20px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '20px 20px 0 0'
              }}></div>
              <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.3))' }}>🔑</span>
              <span style={{ letterSpacing: '0.5px' }}>登录</span>
            </Link>

            {/* 注册按钮 */}
            <Link 
              to="/register" 
              className="btn modern-btn"
              style={{
                fontSize: '1.1rem',
                padding: '24px 20px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
                border: 'none',
                color: '#065f46',
                fontWeight: '700',
                boxShadow: '0 16px 64px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px rgba(0,0,0,0.05)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: '20px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                borderRadius: '20px 20px 0 0'
              }}></div>
              <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))' }}>🚀</span>
              <span style={{ letterSpacing: '0.5px' }}>注册</span>
            </Link>
          </div>

          {/* Demo体验 */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-muted)', 
              marginBottom: '12px'
            }}>
              或者先体验功能
            </div>
            <button 
              className="btn btn-outline"
              onClick={async () => {
                try {
                  await axios.post('/demo/bootstrap');
                  alert('✅ 演示数据已生成！现在为您展示邻里动态页面');
                  // 跳转到动态页面
                  window.location.href = 'http://localhost:3000/#/posts';
                } catch (err) {
                  alert('🎯 Demo模式：直接为您展示应用功能');
                  // 即使失败也跳转到动态页面
                  window.location.href = 'http://localhost:3000/#/posts';
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '2px solid rgba(156, 163, 175, 0.3)',
                color: '#6b7280',
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: '600',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
            >
              🎯 游客体验
            </button>
          </div>

          {/* 特色介绍 - 简化版 */}
          <div style={{ 
            marginTop: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            maxWidth: '500px',
            margin: '48px auto 0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤝</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>邻里互助</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>任务发布与完成</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>积分激励</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>贡献获得奖励</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>社区活动</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>线上线下聚会</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏆</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>排行榜</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>社区贡献者</p>
            </div>
          </div>
        </div>
      ) : (
        // 已登录状态的首页
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🎉 欢迎回来，{auth.user.username}！</h2>
              <p className="card-subtitle">
                你当前拥有 <strong style={{ color: '#f59e0b' }}>⭐ {auth.user.credit_points || 0}</strong> 积分
              </p>
            </div>
            <div className="card-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <Link to="/tasks" className="btn btn-primary">
                  🔥 完成任务
                </Link>
                <Link to="/posts" className="btn btn-success">
                  💬 发布动态
                </Link>
                <Link to="/activities" className="btn btn-secondary">
                  🎉 参与活动
                </Link>
              </div>
            </div>
          </div>

          {/* 快速统计 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📊 社区数据</h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stats.tasks || 0}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>待完成任务</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stats.posts || 0}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>社区动态</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stats.activities || 0}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>进行中活动</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stats.groups || 0}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>活跃小组</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Login({ auth }) {
  const [username, setU] = React.useState('');
  const [password, setP] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert('请填写完整的登录信息');
      return;
    }
    setLoading(true);
    try {
      await auth.login(username, password);
      
      // 登录成功后跳转到首页
      alert('🎉 登录成功！欢迎回来！');
      window.location.href = 'http://localhost:3000/';
      
    } catch (err) {
      alert('登录失败，请检查用户名和密码');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="form-container">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>登录邻里APP</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>连接你的邻里社区</p>
        </div>
        
        <div className="form-group">
          <label className="form-label">用户名</label>
          <input 
            type="text"
            className="form-input"
            placeholder="请输入用户名" 
            value={username} 
            onChange={e => setU(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">密码</label>
          <input 
            type="password"
            className="form-input"
            placeholder="请输入密码" 
            value={password} 
            onChange={e => setP(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', marginBottom: '24px' }}
        >
          {loading ? <span className="loading-spinner"></span> : '🚀 登录'}
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>还没有账号？</span>
          <Link to="/register" style={{ color: '#6366f1', marginLeft: '8px', fontWeight: '600' }}>
            立即注册
          </Link>
        </div>
        
        <div className="card-footer">
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
            🎯 快速体验
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', textAlign: 'center' }}>
            点击生成演示数据，然后使用以下账号登录：
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            marginBottom: '16px',
            fontSize: '0.85rem'
          }}>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px' }}>
              <div>👑 管理员</div>
              <div style={{ fontWeight: '600' }}>admin / admin123</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px' }}>
              <div>👤 普通用户</div>
              <div style={{ fontWeight: '600' }}>zhangsan / user123</div>
            </div>
          </div>
          <button 
            className="btn btn-success"
            onClick={async () => {
              try {
                await axios.post('/demo/bootstrap');
                alert('✅ 演示数据已生成！\n\n账号信息：\n👑 管理员: admin / admin123\n👤 用户: zhangsan / user123');
              } catch (err) {
                alert('生成演示数据失败');
              }
            }}
            style={{ width: '100%' }}
          >
            🎲 生成演示数据
          </button>
        </div>
      </div>
    </div>
  );
}

function Register({ auth }) {
  const [form, setForm] = React.useState({ 
    username: '', 
    password: '', 
    phone: '', 
    real_name: '',
    interest_tags: []
  });
  const [loading, setLoading] = React.useState(false);

  const interestOptions = [
    '🏃‍♂️ 运动健身', '📚 读书学习', '🍳 美食烹饪', '🎵 音乐艺术', 
    '🌱 园艺种植', '🧘‍♀️ 瑜伽冥想', '🎮 游戏娱乐', '🏠 家居装修',
    '👶 育儿心得', '🐕 宠物交流', '💼 职场分享', '🚗 汽车爱好'
  ];

  const handleRegister = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.phone.trim()) {
      alert('请填写完整的必要信息');
      return;
    }
    if (form.password.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    setLoading(true);
    try {
      // 先尝试注册，但不自动登录
      await axios.post('/auth/register', form);
      
      // 注册成功提示并跳转到登录页面
      alert(`🎉 注册成功！\n\n欢迎加入邻里APP，${form.username}！\n请使用刚注册的账号登录。`);
      
      // 跳转到登录页面
      window.location.href = '#/login';
      
    } catch (err) {
      alert('注册失败，请检查信息是否正确');
    }
    setLoading(false);
  };

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interest_tags: prev.interest_tags.includes(interest)
        ? prev.interest_tags.filter(i => i !== interest)
        : [...prev.interest_tags, interest]
    }));
  };

  return (
    <div className="fade-in">
      <div className="form-container">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌟</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>加入邻里APP</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>开启你的邻里社交之旅</p>
        </div>
        
        <div className="form-group">
          <label className="form-label">用户名 *</label>
          <input 
            type="text"
            className="form-input"
            placeholder="设置一个独特的用户名" 
            value={form.username} 
            onChange={e => setForm({ ...form, username: e.target.value })} 
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">真实姓名</label>
          <input 
            type="text"
            className="form-input"
            placeholder="便于邻里认识你（可选）" 
            value={form.real_name} 
            onChange={e => setForm({ ...form, real_name: e.target.value })} 
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">手机号 *</label>
          <input 
            type="tel"
            className="form-input"
            placeholder="用于实名认证" 
            value={form.phone} 
            onChange={e => setForm({ ...form, phone: e.target.value })} 
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">密码 *</label>
          <input 
            type="password"
            className="form-input"
            placeholder="设置登录密码（至少6位）" 
            value={form.password} 
            onChange={e => setForm({ ...form, password: e.target.value })} 
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">兴趣标签</label>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
            选择你感兴趣的领域，帮助匹配相关的邻里活动
          </p>
          <div className="interest-tags">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                className={`interest-tag ${form.interest_tags.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
          {form.interest_tags.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
              已选择 {form.interest_tags.length} 个兴趣标签
            </p>
          )}
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={handleRegister}
          disabled={loading}
          style={{ width: '100%', marginBottom: '24px' }}
        >
          {loading ? <span className="loading-spinner"></span> : '🚀 立即注册'}
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>已有账号？</span>
          <Link to="/login" style={{ color: '#6366f1', marginLeft: '8px', fontWeight: '600' }}>
            去登录
          </Link>
        </div>
        
        <div className="card-footer">
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
            🎁 注册福利
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: '8px',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⭐</span>
              <span>立即获得 50 积分新人奖励</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span>
              <span>完善个人资料再获得 20 积分</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span>
              <span>加入首个兴趣小组获得 10 积分</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Posts({ auth }) {
  const [items, setItems] = React.useState([]);
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [showComposer, setShowComposer] = React.useState(false);
  
  // 示例头像数据
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
  ];
  
  // 示例邻里动态
  const samplePosts = [
    {
      id: 1,
      content: "今天帮邻居张阿姨买了菜，她做了拿手的红烧肉给我尝，真的太香了！邻里互助让生活更美好 ❤️",
      user_name: "热心小李",
      avatar: sampleAvatars[0],
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      likes: 12,
      comments: 3
    },
    {
      id: 2,
      content: "小区花园的樱花开了！春天真的来了，大家有空可以下来散散步，拍拍照 🌸",
      user_name: "摄影达人",
      avatar: sampleAvatars[1],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      likes: 28,
      comments: 7,
      image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      content: "寻找丢失的小猫咪，橘色短毛，很亲人。如果有看到请联系我，非常感谢！🐱",
      user_name: "爱猫人士",
      avatar: sampleAvatars[2],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      likes: 15,
      comments: 8
    }
  ];
  
  React.useEffect(() => { 
    (async () => {
      try {
        const { data } = await axios.get('/posts');
        // 如果没有真实数据，使用示例数据
        if (data.length === 0) {
          setItems(samplePosts);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.log('获取动态失败，使用示例数据');
        setItems(samplePosts);
      }
    })(); 
  }, []);
  
  const create = async () => {
    if (!content.trim() || !auth?.user) return;
    setLoading(true);
    try {
      await axios.post('/posts', { content });
      setContent('');
      setImagePreview(null);
      setShowComposer(false);
      const { data } = await axios.get('/posts');
      setItems(data.length > 0 ? data : [...samplePosts, {
        id: Date.now(),
        content,
        user_name: auth.user?.username || '游客',
        avatar: sampleAvatars[0],
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0
      }]);
    } catch (err) {
      // 即使失败也添加到本地显示
      setItems(prev => [{
        id: Date.now(),
        content,
        user_name: auth.user?.username || '游客',
        avatar: sampleAvatars[0],
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0
      }, ...prev]);
      setContent('');
      setShowComposer(false);
    }
    setLoading(false);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return time.toLocaleDateString();
  };

  const addSampleImage = () => {
    const images = [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop'
    ];
    setImagePreview(images[Math.floor(Math.random() * images.length)]);
  };

  return (
    <div className="fade-in">
      {/* 未登录提示 */}
      {!auth?.user && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-content" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏠</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>欢迎来到邻里动态</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              登录后即可发布动态，与邻居互动交流
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '#/login'}
            >
              立即登录
            </button>
          </div>
        </div>
      )}
      
      {/* 快速发布按钮 */}
      {auth?.user && !showComposer && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div 
            className="card-content"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setShowComposer(true)}
          >
            <div className="post-avatar">
              {auth.user?.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div 
              style={{ 
                flex: 1,
                background: 'var(--bg-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-muted)',
                fontSize: '0.95rem'
              }}
            >
              分享你的邻里生活...
            </div>
            <button className="btn btn-primary btn-small">
              📝 发布
            </button>
          </div>
        </div>
      )}

      {/* 发布动态编辑器 */}
      {auth?.user && showComposer && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="post-avatar">
                {auth.user?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{auth.user?.username || '游客'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>分享新动态</div>
              </div>
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => setShowComposer(false)}
                style={{ marginLeft: 'auto', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="card-content">
            <textarea 
              className="form-input form-textarea"
              placeholder="分享你的邻里生活、感悟或寻求帮助..."
              value={content} 
              onChange={e => setContent(e.target.value)}
              style={{ 
                minHeight: '120px',
                border: 'none',
                background: 'var(--bg-primary)',
                fontSize: '1rem',
                lineHeight: '1.6',
                resize: 'none'
              }}
              autoFocus
            />
            
            {imagePreview && (
              <div style={{ marginTop: '16px', position: 'relative' }}>
                <img 
                  src={imagePreview} 
                  alt="预览" 
                  style={{ 
                    width: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'cover', 
                    borderRadius: 'var(--radius-md)' 
                  }}
                />
                <button 
                  onClick={() => setImagePreview(null)}
                  className="btn btn-secondary btn-small"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          
          <div className="card-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={addSampleImage}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📷 图片
                </button>
                <button 
                  className="btn btn-secondary btn-small"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📍 位置
                </button>
                <button 
                  className="btn btn-secondary btn-small"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  😊 表情
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  💡 +5 积分
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={create}
                  disabled={loading || !content.trim()}
                  style={{ minWidth: '80px' }}
                >
                  {loading ? <span className="loading-spinner"></span> : '发布'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 动态列表 */}
      <div className="post-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3 className="empty-title">还没有动态</h3>
            <p className="empty-desc">成为第一个分享邻里生活的人吧！</p>
          </div>
        ) : (
          items.map(p => (
            <div key={p.id} className="post-item">
              <div className="post-header">
                <img 
                  src={p.avatar || sampleAvatars[p.id % sampleAvatars.length]}
                  alt={p.user_name || `用户${p.user_id}`}
                  className="post-avatar"
                  style={{ 
                    width: '48px',
                    height: '48px',
                    objectFit: 'cover',
                    background: 'none'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div 
                  className="post-avatar"
                  style={{ display: 'none' }}
                >
                  {(p.user_name || `用户${p.user_id}`).charAt(0)}
                </div>
                <div className="post-meta">
                  <div className="post-author">{p.user_name || `邻里用户 #${p.user_id}`}</div>
                  <div className="post-time">{formatTimeAgo(p.created_at)}</div>
                </div>
                <button 
                  className="btn btn-secondary btn-small"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', marginLeft: 'auto' }}
                >
                  ⋯
                </button>
              </div>
              
              <div className="post-content">
                {p.content}
              </div>
              
              {p.image && (
                <div style={{ marginTop: '16px' }}>
                  <img 
                    src={p.image}
                    alt="动态图片"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                </div>
              )}
              
              <div className="post-actions">
                <div style={{ display: 'flex', gap: '24px' }}>
                  <button 
                    className="btn btn-secondary btn-small"
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    👍 {p.likes || 0}
                  </button>
                  <button 
                    className="btn btn-secondary btn-small"
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    💬 {p.comments || 0}
                  </button>
                  <button 
                    className="btn btn-secondary btn-small"
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    🔗 分享
                  </button>
                </div>
                <div className="badge badge-success">
                  +5 积分
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Groups() {
  const [items, setItems] = React.useState([]);
  const [name, setName] = React.useState('');
  React.useEffect(() => { (async () => {
    const { data } = await axios.get('/groups');
    setItems(data);
  })(); }, []);
  const create = async () => {
    await axios.post('/groups', { name });
    setName('');
    const { data } = await axios.get('/groups');
    setItems(data);
  };
  const join = async (id) => { await axios.post(`/groups/${id}/join`); };
  return (
    <div>
      <h3>兴趣小组</h3>
      <input placeholder="新小组名" value={name} onChange={e => setName(e.target.value)} />
      <button onClick={create}>创建</button>
      <ul>
        {items.map(g => (
          <li key={g.id}>{g.name} <button onClick={() => join(g.id)}>加入</button></li>
        ))}
      </ul>
    </div>
  );
}

function Activities({ auth }) {
  const [items, setItems] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [maxParticipants, setMaxParticipants] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [filter, setFilter] = React.useState('upcoming');

  // 示例活动数据
  const sampleActivities = [
    {
      id: 1,
      title: "🌸 春季花园美化活动",
      description: "大家一起来美化小区花园，种植鲜花，修剪绿植，让我们的家园更加美丽！",
      location: "小区中心花园",
      start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      max_participants: 15,
      current_participants: 8,
      activity_type: "volunteer",
      organizer: "绿化委员会",
      status: "upcoming",
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
      reward_points: 15
    },
    {
      id: 2,
      title: "🎵 邻里音乐分享会",
      description: "喜欢音乐的邻居们聚在一起，分享自己喜欢的歌曲，也可以现场演唱或演奏。",
      location: "活动中心二楼",
      start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      max_participants: 25,
      current_participants: 12,
      activity_type: "social",
      organizer: "音乐爱好者协会",
      status: "upcoming",
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      reward_points: 10
    },
    {
      id: 3,
      title: "🏃‍♀️ 晨跑健身团",
      description: "每周三次的晨跑活动，一起锻炼身体，享受清晨的新鲜空气。适合各个年龄段。",
      location: "小区环形跑道",
      start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      max_participants: 30,
      current_participants: 18,
      activity_type: "sports",
      organizer: "健康生活俱乐部",
      status: "upcoming",
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      reward_points: 8
    },
    {
      id: 4,
      title: "👵👴 老年人智能手机课堂",
      description: "志愿者教老年人使用智能手机，学习微信、支付宝等常用APP的使用方法。",
      location: "社区服务中心",
      start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      max_participants: 12,
      current_participants: 6,
      activity_type: "education",
      organizer: "数字助老服务队",
      status: "upcoming",
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      reward_points: 20
    }
  ];

  React.useEffect(() => { 
    (async () => {
      try {
        const { data } = await axios.get('/activities');
        if (data.length === 0) {
          setItems(sampleActivities);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.log('获取活动失败，使用示例数据');
        setItems(sampleActivities);
      }
    })(); 
  }, []);

  const create = async () => {
    if (!title.trim() || !auth?.user) return;
    setLoading(true);
    try {
      await axios.post('/activities', { 
        title, 
        description, 
        location, 
        start_time: startTime,
        max_participants: maxParticipants 
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setStartTime('');
      setMaxParticipants(20);
      setShowCreateForm(false);
      const { data } = await axios.get('/activities');
      setItems(data.length > 0 ? data : [...sampleActivities, {
        id: Date.now(),
        title,
        description,
        location,
        start_time: startTime,
        max_participants: maxParticipants,
        current_participants: 1,
        activity_type: 'social',
        organizer: auth.user.username,
        status: 'upcoming',
        reward_points: 10
      }]);
    } catch (err) {
      setItems(prev => [{
        id: Date.now(),
        title,
        description,
        location,
        start_time: startTime,
        max_participants: maxParticipants,
        current_participants: 1,
        activity_type: 'social',
        organizer: auth?.user?.username || '组织者',
        status: 'upcoming',
        reward_points: 10
      }, ...prev]);
      setTitle('');
      setDescription('');
      setLocation('');
      setStartTime('');
      setMaxParticipants(20);
      setShowCreateForm(false);
    }
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days < 7) return `${days}天后`;
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  const getActivityTypeInfo = (type) => {
    const types = {
      volunteer: { icon: '🤝', label: '志愿服务', color: '#10b981' },
      social: { icon: '🎉', label: '社交聚会', color: '#8b5cf6' },
      sports: { icon: '🏃‍♀️', label: '运动健身', color: '#f59e0b' },
      education: { icon: '📚', label: '学习教育', color: '#3b82f6' }
    };
    return types[type] || types.social;
  };

  const filteredActivities = filter === 'all' ? items : 
    items.filter(a => a.status === filter);

  return (
    <div className="fade-in">
      {/* 创建活动按钮 */}
      {auth?.user && !showCreateForm && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div 
            className="card-content"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setShowCreateForm(true)}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🎉
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>发起社区活动</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                组织邻里聚会，共建温馨社区
              </div>
            </div>
            <button className="btn btn-primary btn-small">
              创建活动
            </button>
          </div>
        </div>
      )}

      {/* 创建活动表单 */}
      {auth?.user && showCreateForm && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">创建社区活动</h3>
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="card-content">
            <div className="form-group">
              <label className="form-label">活动标题 *</label>
              <input 
                className="form-input"
                placeholder="给你的活动起个有趣的名字" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">活动描述</label>
              <textarea 
                className="form-input form-textarea"
                placeholder="详细介绍活动内容、目的和注意事项" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">活动地点</label>
                <input 
                  className="form-input"
                  placeholder="活动举办地点" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">参与人数</label>
                <input 
                  className="form-input"
                  type="number" 
                  min="5"
                  max="100"
                  value={maxParticipants} 
                  onChange={e => setMaxParticipants(parseInt(e.target.value || '20', 10))}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">开始时间</label>
              <input 
                className="form-input"
                type="datetime-local" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="card-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                💡 组织活动可获得 15-25 积分奖励
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={create}
                  disabled={loading || !title.trim()}
                  style={{ minWidth: '80px' }}
                >
                  {loading ? <span className="loading-spinner"></span> : '发布活动'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 未登录提示 */}
      {!auth?.user && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-content" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>参与社区活动</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              登录后即可参与活动报名，组织自己的社区活动
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '#/login'}
            >
              立即登录
            </button>
          </div>
        </div>
      )}

      {/* 活动筛选 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-content" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            活动筛选
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button 
              className={`btn btn-small ${filter === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('upcoming')}
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: filter === 'upcoming' ? 'white' : 'var(--text-primary)'
              }}
            >
              🔥 即将开始
            </button>
            <button 
              className={`btn btn-small ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: filter === 'all' ? 'white' : 'var(--text-primary)'
              }}
            >
              📅 全部活动
            </button>
          </div>
        </div>
      </div>

      {/* 活动列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <h3 className="empty-title">暂无活动</h3>
            <p className="empty-desc">成为第一个发起社区活动的人吧！</p>
          </div>
        ) : (
          filteredActivities.map(activity => {
            const typeInfo = getActivityTypeInfo(activity.activity_type);
            const participationRate = Math.round((activity.current_participants / activity.max_participants) * 100);
            
            return (
              <div key={activity.id} className="card">
                {activity.image && (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={activity.image}
                      alt={activity.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: typeInfo.color,
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                      {typeInfo.icon} {typeInfo.label}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--warning-gradient)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                      +{activity.reward_points} 积分
                    </div>
                  </div>
                )}
                
                <div className="card-content">
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                  }}>
                    {activity.title}
                  </h3>
                  
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    marginBottom: '16px'
                  }}>
                    {activity.description}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>📍</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {activity.location}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>⏰</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(activity.start_time)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>👥</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {activity.current_participants}/{activity.max_participants} 人
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>👤</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {activity.organizer}
                      </span>
                    </div>
                  </div>
                  
                  {/* 参与进度条 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        报名进度
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: typeInfo.color }}>
                        {participationRate}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${participationRate}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${typeInfo.color}, ${typeInfo.color}dd)`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
                
                <div className="card-footer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="badge badge-info">
                      {activity.status === 'upcoming' ? '即将开始' : '进行中'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-small">
                        💬 详情
                      </button>
                      <button 
                        className="btn btn-primary btn-small"
                        disabled={activity.current_participants >= activity.max_participants}
                      >
                        {activity.current_participants >= activity.max_participants ? '已满员' : '我要参加'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Tasks() {
  const [items, setItems] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [reward, setReward] = React.useState(10);
  const [taskType, setTaskType] = React.useState('help');
  const [loading, setLoading] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => { (async () => {
    try {
      const { data } = await axios.get('/tasks');
      setItems(data);
    } catch (err) {
      console.log('获取任务失败');
    }
  })(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await axios.post('/tasks', { 
        title, 
        description,
        reward_points: reward,
        task_type: taskType
      });
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
      const { data } = await axios.get('/tasks');
      setItems(data);
    } catch (err) {
      alert('发布任务失败');
    }
    setLoading(false);
  };

  const complete = async (id) => {
    try {
      await axios.post(`/tasks/${id}/complete`);
      const { data } = await axios.get('/tasks');
      setItems(data);
      alert('🎉 任务完成！积分已到账');
    } catch (err) {
      alert('完成任务失败');
    }
  };

  const taskTypes = [
    { value: 'help', label: '🤝 邻里互助', color: '#10b981', bgColor: '#ecfdf5' },
    { value: 'delivery', label: '📦 代收快递', color: '#3b82f6', bgColor: '#eff6ff' },
    { value: 'skill', label: '🛠️ 技能分享', color: '#8b5cf6', bgColor: '#f3e8ff' },
    { value: 'care', label: '👵 关爱老人', color: '#f59e0b', bgColor: '#fffbeb' },
    { value: 'pet', label: '🐕 宠物照看', color: '#06b6d4', bgColor: '#ecfeff' },
    { value: 'other', label: '📋 其他任务', color: '#6b7280', bgColor: '#f9fafb' }
  ];

  const pendingTasks = items.filter(t => !t.is_completed);
  const completedTasks = items.filter(t => t.is_completed);
  
  const filteredTasks = filter === 'all' ? pendingTasks : 
    pendingTasks.filter(t => t.task_type === filter);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return time.toLocaleDateString();
  };

  return (
    <div className="fade-in">
      {/* 头部统计 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <h2 className="card-title">✅ 任务中心</h2>
          <p className="card-subtitle">发布或完成邻里互助任务，获得积分奖励</p>
        </div>
        
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0369a1' }}>{pendingTasks.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>待完成</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>{completedTasks.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>已完成</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fefce8', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ca8a04' }}>
                {completedTasks.reduce((sum, t) => sum + (t.reward_points || 0), 0)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>获得积分</div>
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ width: '100%' }}
          >
            {showCreateForm ? '取消发布' : '📝 发布新任务'}
          </button>
        </div>
      </div>

      {/* 创建任务表单 */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <h3 className="card-title">发布新任务</h3>
            <p className="card-subtitle">详细描述你需要的帮助</p>
          </div>
          
          <div className="card-content">
            <div className="form-group">
              <label className="form-label">任务标题 *</label>
              <input 
                className="form-input"
                placeholder="简要描述你需要的帮助" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">任务描述</label>
              <textarea 
                className="form-input form-textarea"
                placeholder="详细说明任务内容、要求、时间地点等" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">任务类型</label>
                <select 
                  className="form-input form-select"
                  value={taskType} 
                  onChange={e => setTaskType(e.target.value)}
                >
                  {taskTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">积分奖励</label>
                <input 
                  className="form-input"
                  type="number" 
                  min="5"
                  max="100"
                  value={reward} 
                  onChange={e => setReward(parseInt(e.target.value || '10', 10))}
                />
              </div>
            </div>
          </div>
          
          <div className="card-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                💡 设置合理的积分奖励
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={create}
                  disabled={loading || !title.trim()}
                >
                  {loading ? <span className="loading-spinner"></span> : '发布任务'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-content" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            任务筛选
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button 
              className={`btn btn-small ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
              style={{
                minWidth: 'fit-content',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: filter === 'all' ? 'white' : 'var(--text-primary)',
                borderColor: filter === 'all' ? 'transparent' : 'rgba(102, 126, 234, 0.3)',
                background: filter === 'all' ? 'var(--primary-gradient)' : 'var(--bg-secondary)',
                boxShadow: filter === 'all' ? '0 4px 16px rgba(102, 126, 234, 0.3)' : 'var(--neu-shadow-light)'
              }}
            >
              全部 ({pendingTasks.length})
            </button>
            {taskTypes.map(type => {
              const count = pendingTasks.filter(t => t.task_type === type.value).length;
              const isActive = filter === type.value;
              return (
                <button 
                  key={type.value}
                  className={`btn btn-small ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilter(type.value)}
                  style={{
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    borderColor: isActive ? 'transparent' : 'rgba(102, 126, 234, 0.3)',
                    background: isActive ? 'var(--primary-gradient)' : 'var(--bg-secondary)',
                    boxShadow: isActive ? '0 4px 16px rgba(102, 126, 234, 0.3)' : 'var(--neu-shadow-light)'
                  }}
                >
                  {type.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="task-grid">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3 className="empty-title">暂无任务</h3>
            <p className="empty-desc">
              {filter === 'all' ? '发布一个任务，让邻里来帮助你吧！' : '这个类型暂无任务'}
            </p>
          </div>
        ) : (
          filteredTasks.map(t => {
            const typeInfo = taskTypes.find(type => type.value === t.task_type) || taskTypes[0];
            return (
              <div key={t.id} className="task-card">
                <div className="task-header">
                  <div 
                    className="task-type"
                    style={{ 
                      background: typeInfo.bgColor,
                      color: typeInfo.color,
                      border: `1px solid ${typeInfo.color}20`
                    }}
                  >
                    {typeInfo.label.split(' ')[0]} {typeInfo.label.split(' ')[1]}
                  </div>
                  <div className="task-reward">
                    ⭐ +{t.reward_points}
                  </div>
                </div>
                
                <div className="task-title">{t.title}</div>
                
                {t.description && (
                  <div className="task-desc">{t.description}</div>
                )}
                
                <div className="task-footer">
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {formatTimeAgo(t.created_at)}
                  </div>
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => complete(t.id)}
                  >
                    接受任务
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 已完成任务 */}
      {completedTasks.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">✅ 已完成任务</h3>
            <p className="card-subtitle">你的贡献记录</p>
          </div>
          <div className="card-content">
            {completedTasks.slice(0, 3).map(t => (
              <div key={t.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="badge badge-success">
                  +{t.reward_points} 积分
                </div>
              </div>
            ))}
            {completedTasks.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button className="btn btn-secondary btn-small">
                  查看更多 ({completedTasks.length - 3})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Announcements() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => { (async () => {
    const { data } = await axios.get('/announcements');
    setItems(data);
  })(); }, []);
  return (
    <div>
      <h3>公告</h3>
      <ul>
        {items.map(a => (
          <li key={a.id}><b>{a.title}</b> - {a.content}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const auth = useAuth();
  return (
    <BrowserRouter>
      <Layout auth={auth} />
    </BrowserRouter>
  );
}

function Leaderboard() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState('all');

  // 示例排行榜数据
  const sampleLeaderboard = [
    { 
      username: '社区志愿者小王', 
      credit_points: 2580, 
      rank: 1, 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      level: '社区之星',
      badge: '👑',
      completed_tasks: 45,
      activities_joined: 12,
      posts_count: 28
    },
    { 
      username: '热心邻居李阿姨', 
      credit_points: 1920, 
      rank: 2, 
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face',
      level: '超级邻居',
      badge: '🏅',
      completed_tasks: 35,
      activities_joined: 8,
      posts_count: 22
    },
    { 
      username: '运动达人张先生', 
      credit_points: 1650, 
      rank: 3, 
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      level: '活跃居民',
      badge: '🥉',
      completed_tasks: 28,
      activities_joined: 15,
      posts_count: 18
    },
    { 
      username: '美食分享者小刘', 
      credit_points: 1320, 
      rank: 4, 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      level: '优秀邻居',
      badge: '⭐',
      completed_tasks: 22,
      activities_joined: 6,
      posts_count: 31
    },
    { 
      username: '花园护理员老陈', 
      credit_points: 1080, 
      rank: 5, 
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      level: '友善邻居',
      badge: '💫',
      completed_tasks: 19,
      activities_joined: 4,
      posts_count: 15
    },
    { 
      username: '学习小组组长', 
      credit_points: 890, 
      rank: 6, 
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
      level: '新晋邻居',
      badge: '🌟',
      completed_tasks: 15,
      activities_joined: 3,
      posts_count: 12
    }
  ];

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/leaderboard');
        if (data.length === 0) {
          setUsers(sampleLeaderboard);
        } else {
          setUsers(data);
        }
      } catch (err) {
        console.log('获取排行榜失败，使用示例数据');
        setUsers(sampleLeaderboard);
      }
      setLoading(false);
    })();
  }, [timeRange]);

  const getRankColor = (rank) => {
    if (rank === 1) return 'linear-gradient(135deg, #ffd700, #ffed4e)';
    if (rank === 2) return 'linear-gradient(135deg, #c0c0c0, #e8e8e8)';
    if (rank === 3) return 'linear-gradient(135deg, #cd7f32, #daa520)';
    return 'var(--bg-secondary)';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  return (
    <div className="fade-in">
      {/* 排行榜头部 */}
      <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
        <div className="card-content" style={{ padding: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏆</div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            marginBottom: '8px',
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            积分排行榜
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            通过完成任务、发布动态、参与活动来提升排名
          </p>
        </div>
      </div>

      {/* 时间范围筛选 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-content" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            排行榜类型
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button 
              className={`btn btn-small ${timeRange === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTimeRange('all')}
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: timeRange === 'all' ? 'white' : 'var(--text-primary)'
              }}
            >
              🏆 总排行
            </button>
            <button 
              className={`btn btn-small ${timeRange === 'month' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTimeRange('month')}
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: timeRange === 'month' ? 'white' : 'var(--text-primary)'
              }}
            >
              📅 本月排行
            </button>
            <button 
              className={`btn btn-small ${timeRange === 'week' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTimeRange('week')}
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: timeRange === 'week' ? 'white' : 'var(--text-primary)'
              }}
            >
              🔥 本周排行
            </button>
          </div>
        </div>
      </div>

      {/* 前三名展示 */}
      {users.length >= 3 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-content" style={{ padding: '24px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '16px',
              alignItems: 'end'
            }}>
              {/* 第二名 */}
              <div style={{ textAlign: 'center', order: 1 }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c0c0c0, #e8e8e8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '2rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={users[1].avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face'}
                    alt={users[1].username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    🥈
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.5rem'
                }}>
                  🥈
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>
                  {users[1].username}
                </h4>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#c0c0c0' }}>
                  {users[1].credit_points}
                </div>
              </div>

              {/* 第一名 */}
              <div style={{ textAlign: 'center', order: 2 }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '2.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '3px solid #ffd700'
                }}>
                  <img 
                    src={users[0].avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                    alt={users[0].username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem'
                  }}>
                    👑
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '2rem'
                }}>
                  👑
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
                  {users[0].username}
                </h4>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffd700' }}>
                  {users[0].credit_points}
                </div>
                <div className="badge badge-warning" style={{ marginTop: '8px' }}>
                  {users[0].level || '社区之星'}
                </div>
              </div>

              {/* 第三名 */}
              <div style={{ textAlign: 'center', order: 3 }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #cd7f32, #daa520)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '2rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={users[2].avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={users[2].username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    🥉
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.5rem'
                }}>
                  🥉
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>
                  {users[2].username}
                </h4>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#cd7f32' }}>
                  {users[2].credit_points}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 完整排行榜 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">完整排行榜</h3>
        </div>
        
        <div className="card-content" style={{ padding: '0' }}>
          {loading ? (
            <div className="loading-container">
              <span className="loading-spinner"></span>
              <p>加载排行榜中...</p>
            </div>
          ) : (
            <div>
              {users.map((user, index) => (
                <div 
                  key={user.username || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 24px',
                    borderBottom: index < users.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    background: index < 3 ? `${getRankColor(user.rank)}20` : 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: getRankColor(user.rank),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: index < 3 ? 'white' : 'var(--text-primary)'
                  }}>
                    {user.rank}
                  </div>
                  
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    marginRight: '16px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img 
                      src={user.avatar || `https://images.unsplash.com/photo-150730321116${index}?w=150&h=150&fit=crop&crop=face`}
                      alt={user.username}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      background: 'var(--primary-gradient)'
                    }}>
                      {getRankIcon(user.rank)}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {user.username}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <span>📋 {user.completed_tasks || 0}个任务</span>
                      <span>🎉 {user.activities_joined || 0}个活动</span>
                      <span>💬 {user.posts_count || 0}条动态</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: index < 3 ? '#ffd700' : 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {user.credit_points}
                    </div>
                    <div className={`badge ${index < 3 ? 'badge-warning' : 'badge-info'}`}>
                      {user.level || (user.credit_points > 1000 ? '活跃邻居' : '新手邻居')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 积分获取指南 */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <h3 className="card-title">🎯 积分获取指南</h3>
        </div>
        
        <div className="card-content">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #4facfe20, #00f2fe20)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(79, 172, 254, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅</div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>完成任务</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+10~50分</p>
            </div>
            
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💬</div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>发布动态</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+5分</p>
            </div>
            
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #fa709a20, #fee14020)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(250, 112, 154, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎉</div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>参与活动</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+8~20分</p>
            </div>
            
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #43e97b20, #38f9d720)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(67, 233, 123, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎁</div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>注册奖励</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+50分</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
