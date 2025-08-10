import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import './index.css';

// 导入上下文提供者
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';

// 导入新功能组件
import Notifications from './components/Notifications';
import BusinessMap from './components/BusinessMap';
import Coupons from './components/Coupons';
import Polls from './components/Polls';

import Quest from './components/Quest';
import RealTimeNotifications from './components/RealTimeNotifications';
import ImageWall from './components/ImageWall';

// 简洁的页面内弹窗组件
function Toast({ message, type = 'info', onClose }) {
  const [isVisible, setIsVisible] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // 等待动画完成后调用onClose
      setTimeout(() => {
        onClose();
      }, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

    const getToastStyle = () => {
    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768;
    
    const baseStyle = {
      position: 'fixed',
      bottom: isMobile ? '120px' : '40px', // 移动端距离底部更远，避免被底部导航遮挡
      left: '50%',
      transform: `translateX(-50%) ${isVisible ? 'translateY(0)' : 'translateY(100%)'}`,
      padding: isMobile ? '14px 24px' : '12px 20px',
      borderRadius: '12px',
      color: 'white',
      fontSize: isMobile ? '1rem' : '0.9rem',
      fontWeight: '500',
      zIndex: 9999,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      maxWidth: isMobile ? '320px' : '280px',
      minWidth: isMobile ? '240px' : '200px',
      wordBreak: 'break-word',
      textAlign: 'center',
      opacity: isVisible ? 1 : 0
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, background: 'linear-gradient(135deg, #10b981, #059669)' };
      case 'error':
        return { ...baseStyle, background: 'linear-gradient(135deg, #ef4444, #dc2626)' };
      case 'warning':
        return { ...baseStyle, background: 'linear-gradient(135deg, #f59e0b, #d97706)' };
      default:
        return { ...baseStyle, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' };
    }
  };

  return (
    <div style={getToastStyle()}>
      {message}
    </div>
  );
}



function Layout({ auth }) {
  const location = useLocation();
  
  // 根据用户角色生成导航菜单
  const getNavItems = () => {
    const baseItems = [
      { path: '/', icon: '🏠', label: '首页' },
      { path: '/posts', icon: '💬', label: '动态' },
      { path: '/tasks', icon: '✅', label: '任务' },
      { path: '/activities', icon: '🎉', label: '活动' },
      { path: '/chat', icon: '💬', label: '聊天' },
      { path: '/friends', icon: '👤', label: '好友' },
      { path: '/leaderboard', icon: '🏆', label: '排行' },
      { path: '/notifications', icon: '📢', label: '通知' }
    ];
    
    // 管理员和版主可以访问公告管理
    if (auth.user && (hasRole(auth.user, ROLES.ADMIN) || hasRole(auth.user, ROLES.MODERATOR))) {
      baseItems.push({ path: '/announcements', icon: '📢', label: '公告' });
    }
    
    // 商家可以访问商店
    if (auth.user && hasRole(auth.user, ROLES.MERCHANT)) {
      baseItems.push({ path: '/store', icon: '🏪', label: '商店' });
    }
    
    // 管理员可以访问系统管理
    if (auth.user && hasRole(auth.user, ROLES.ADMIN)) {
      baseItems.push({ path: '/admin', icon: '⚙️', label: '管理' });
    }
    
    return baseItems;
  };
  
  const navItems = getNavItems();

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <div className="app-logo">邻里APP</div>
          <div className="header-user">
            {auth.user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{auth.user.username}</span>
                  <div className="points-indicator">{auth.user.credit_points || 0}</div>
                  {/* 角色标签 */}
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    background: getRoleColor(auth.user.user_type)
                  }}>
                    {getRoleLabel(auth.user.user_type)}
                  </div>
                </div>
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
          
          {/* 基础功能 - 所有登录用户可访问 */}
          <Route path="/posts" element={<ProtectedRoute><Posts auth={auth} /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups auth={auth} /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><Activities auth={auth} /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks auth={auth} /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          
          {/* 新功能路由 */}
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/business-map" element={<ProtectedRoute><BusinessMap /></ProtectedRoute>} />
          <Route path="/coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
          <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
          
          {/* 游戏化功能路由 */}
          <Route path="/quests" element={<ProtectedRoute><Quest /></ProtectedRoute>} />
          <Route path="/image-wall" element={<ProtectedRoute><ImageWall /></ProtectedRoute>} />
          <Route path="/real-time-notifications" element={<ProtectedRoute><RealTimeNotifications /></ProtectedRoute>} />
          
          {/* 管理功能 - 需要特定权限 */}
          <Route path="/announcements" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_ANNOUNCEMENTS}>
              <Announcements />
            </ProtectedRoute>
          } />
          
          {/* 商家功能 - 仅商家可访问 */}
          <Route path="/store" element={
            <ProtectedRoute requiredRole={ROLES.MERCHANT}>
              <Store />
            </ProtectedRoute>
          } />
          
          {/* 系统管理 - 仅管理员可访问 */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          
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
  const { showToast } = useToast();
  
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
                  const response = await axios.post('/demo/bootstrap');
                  showToast('✅ 演示数据已生成！', 'success');
                  // 延迟跳转，让用户看到成功提示
                  setTimeout(() => {
                    window.location.href = 'http://localhost:3000/#/posts';
                  }, 1000);
                } catch (err) {
                  showToast('🎯 直接进入Demo模式', 'info');
                  // 延迟跳转
                  setTimeout(() => {
                    window.location.href = 'http://localhost:3000/#/posts';
                  }, 1000);
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

          {/* 更多功能 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔧 更多功能</h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <Link to="/groups" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  👥 群组
                </Link>
                <Link to="/quests" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  🎯 任务挑战
                </Link>
                <Link to="/image-wall" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  📷 图片墙
                </Link>
                <Link to="/real-time-notifications" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  🔔 实时通知
                </Link>
                <Link to="/business-map" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  🗺️ 商家地图
                </Link>
                <Link to="/coupons" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  🎫 优惠券
                </Link>
                <Link to="/polls" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                  🗳️ 投票
                </Link>
                {auth.user && (hasRole(auth.user, ROLES.ADMIN) || hasRole(auth.user, ROLES.MODERATOR)) && (
                  <Link to="/announcements" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                    📢 公告管理
                  </Link>
                )}
                {auth.user && hasRole(auth.user, ROLES.MERCHANT) && (
                  <Link to="/store" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                    🏪 商店
                  </Link>
                )}
                {auth.user && hasRole(auth.user, ROLES.ADMIN) && (
                  <Link to="/admin" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '12px 8px' }}>
                    ⚙️ 系统管理
                  </Link>
                )}
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
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showToast('请填写完整的登录信息', 'warning');
      return;
    }
    setLoading(true);
    try {
      await auth.login(username, password);
      showToast('✅ 登录成功！', 'success');
      // 登录成功后跳转到首页
      setTimeout(() => {
        window.location.href = 'http://localhost:3000/';
      }, 1000);
      
    } catch (err) {
      showToast('❌ 登录失败，请检查用户名和密码', 'error');
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
            gap: '8px', 
            marginBottom: '16px',
            fontSize: '0.8rem'
          }}>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div>👑 管理员</div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>admin / admin123</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div>🛡️ 版主</div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>moderator / mod123</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div>🏪 商家</div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>merchant / mer123</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div>⭐ VIP用户</div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>vipuser / vip123</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', gridColumn: '1 / -1' }}>
              <div>👤 普通用户</div>
              <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>zhangsan / user123</div>
            </div>
          </div>
          <button 
            className="btn btn-success"
            onClick={async () => {
              try {
                const response = await axios.post('/demo/bootstrap');
                showToast('✅ 演示数据生成成功！', 'success');
              } catch (err) {
                showToast('❌ 演示数据生成失败', 'error');
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
  const { showToast } = useToast();

  const interestOptions = [
    '🏃‍♂️ 运动健身', '📚 读书学习', '🍳 美食烹饪', '🎵 音乐艺术', 
    '🌱 园艺种植', '🧘‍♀️ 瑜伽冥想', '🎮 游戏娱乐', '🏠 家居装修',
    '👶 育儿心得', '🐕 宠物交流', '💼 职场分享', '🚗 汽车爱好'
  ];

  const handleRegister = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.phone.trim()) {
      showToast('请填写完整的必要信息', 'warning');
      return;
    }
    if (form.password.length < 6) {
      showToast('密码长度至少6位', 'warning');
      return;
    }
    setLoading(true);
    try {
      // 先尝试注册，但不自动登录
      await axios.post('/auth/register', form);
      
      showToast('🎉 注册成功！请登录', 'success');
      // 注册成功后直接跳转到登录页面
      setTimeout(() => {
        window.location.href = '#/login';
      }, 1000);
      
    } catch (err) {
      showToast('❌ 注册失败，请检查信息是否正确', 'error');
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
  const { showToast } = useToast();

  React.useEffect(() => { (async () => {
    try {
      const { data } = await axios.get('/tasks');
      setItems(data);
    } catch (err) {
      console.log('获取任务失败');
    }
  })(); }, []);

  const create = async () => {
    if (!title.trim()) {
      showToast('请填写任务标题', 'warning');
      return;
    }
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
      showToast('✅ 任务发布成功！', 'success');
    } catch (err) {
      showToast('❌ 发布任务失败', 'error');
    }
    setLoading(false);
  };

  const complete = async (id) => {
    try {
      await axios.post(`/tasks/${id}/complete`);
      const { data } = await axios.get('/tasks');
      setItems(data);
      showToast('🎉 任务完成！积分已到账', 'success');
    } catch (err) {
      showToast('❌ 完成任务失败', 'error');
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

// 角色权限系统
const ROLES = {
  ADMIN: 'admin',           // 管理员 - 系统管理
  MODERATOR: 'moderator',   // 版主 - 内容管理
  MERCHANT: 'merchant',     // 商家 - 商业功能
  VIP_USER: 'vip_user',     // VIP用户 - 高级功能
  USER: 'user'              // 普通用户 - 基础功能
};

const PERMISSIONS = {
  // 用户管理
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // 内容管理
  MANAGE_POSTS: 'manage_posts',
  DELETE_POSTS: 'delete_posts',
  PIN_POSTS: 'pin_posts',
  
  // 群组管理
  MANAGE_GROUPS: 'manage_groups',
  DELETE_GROUPS: 'delete_groups',
  
  // 活动管理
  MANAGE_ACTIVITIES: 'manage_activities',
  APPROVE_ACTIVITIES: 'approve_activities',
  
  // 任务管理
  MANAGE_TASKS: 'manage_tasks',
  VERIFY_TASKS: 'verify_tasks',
  
  // 公告管理
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  
  // 积分管理
  MANAGE_POINTS: 'manage_points',
  TRANSFER_POINTS: 'transfer_points',
  
  // 商家功能
  MANAGE_STORE: 'manage_store',
  PUBLISH_PRODUCTS: 'publish_products',
  
  // 系统管理
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_LOGS: 'view_logs'
};

// 角色权限映射
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_POSTS,
    PERMISSIONS.DELETE_POSTS,
    PERMISSIONS.PIN_POSTS,
    PERMISSIONS.MANAGE_GROUPS,
    PERMISSIONS.DELETE_GROUPS,
    PERMISSIONS.MANAGE_ACTIVITIES,
    PERMISSIONS.APPROVE_ACTIVITIES,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VERIFY_TASKS,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_POINTS,
    PERMISSIONS.TRANSFER_POINTS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_LOGS
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_POSTS,
    PERMISSIONS.DELETE_POSTS,
    PERMISSIONS.PIN_POSTS,
    PERMISSIONS.MANAGE_GROUPS,
    PERMISSIONS.MANAGE_ACTIVITIES,
    PERMISSIONS.APPROVE_ACTIVITIES,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VERIFY_TASKS,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS
  ],
  [ROLES.MERCHANT]: [
    PERMISSIONS.MANAGE_STORE,
    PERMISSIONS.PUBLISH_PRODUCTS,
    PERMISSIONS.TRANSFER_POINTS
  ],
  [ROLES.VIP_USER]: [
    PERMISSIONS.TRANSFER_POINTS
  ],
  [ROLES.USER]: []
};

// 权限检查函数
function hasPermission(user, permission) {
  if (!user || !user.user_type) return false;
  const userPermissions = ROLE_PERMISSIONS[user.user_type] || [];
  return userPermissions.includes(permission);
}

// 角色检查函数
function hasRole(user, role) {
  return user && user.user_type === role;
}

// 获取角色标签
function getRoleLabel(userType) {
  const roleLabels = {
    [ROLES.ADMIN]: '管理员',
    [ROLES.MODERATOR]: '版主',
    [ROLES.MERCHANT]: '商家',
    [ROLES.VIP_USER]: 'VIP',
    [ROLES.USER]: '用户'
  };
  return roleLabels[userType] || '用户';
}

// 获取角色颜色
function getRoleColor(userType) {
  const roleColors = {
    [ROLES.ADMIN]: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    [ROLES.MODERATOR]: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    [ROLES.MERCHANT]: 'linear-gradient(135deg, #059669, #047857)',
    [ROLES.VIP_USER]: 'linear-gradient(135deg, #d97706, #b45309)',
    [ROLES.USER]: 'linear-gradient(135deg, #6b7280, #4b5563)'
  };
  return roleColors[userType] || 'linear-gradient(135deg, #6b7280, #4b5563)';
}

// 权限路由守卫组件
function ProtectedRoute({ children, requiredPermission, requiredRole, fallback = null }) {
  const auth = useAuth();
  
  if (!auth.user) {
    return fallback || <Navigate to="/login" />;
  }
  
  if (requiredPermission && !hasPermission(auth.user, requiredPermission)) {
    return fallback || <div>权限不足</div>;
  }
  
  if (requiredRole && !hasRole(auth.user, requiredRole)) {
    return fallback || <div>角色不符</div>;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const auth = useAuth();
  return <Layout auth={auth} />;
}

// 商家商店组件
function Store() {
  const { showToast } = useToast();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    price: '',
    category: 'food'
  });

  React.useEffect(() => {
    // 这里应该调用商家商品API
    setProducts([
      { id: 1, name: '新鲜水果', description: '当季新鲜水果', price: 25, category: 'food' },
      { id: 2, name: '家政服务', description: '专业家政清洁', price: 80, category: 'service' }
    ]);
  }, []);

  const createProduct = async () => {
    if (!form.name.trim() || !form.price) {
      showToast('请填写完整信息', 'warning');
      return;
    }
    setLoading(true);
    try {
      // 这里应该调用创建商品API
      const newProduct = { id: Date.now(), ...form, price: parseFloat(form.price) };
      setProducts(prev => [newProduct, ...prev]);
      setForm({ name: '', description: '', price: '', category: 'food' });
      setShowCreateForm(false);
      showToast('✅ 商品发布成功！', 'success');
    } catch (err) {
      showToast('❌ 发布失败', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🏪 商家商店</h2>
          <p className="card-subtitle">管理您的商品和服务</p>
        </div>
        
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0369a1' }}>{products.length}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>在售商品</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
                ¥{products.reduce((sum, p) => sum + p.price, 0)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>总价值</div>
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ width: '100%' }}
          >
            {showCreateForm ? '取消发布' : '📝 发布商品'}
          </button>
        </div>
      </div>

      {/* 发布商品表单 */}
      {showCreateForm && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <h3 className="card-title">发布新商品</h3>
          </div>
          
          <div className="card-content">
            <div className="form-group">
              <label className="form-label">商品名称</label>
              <input 
                type="text"
                className="form-input"
                placeholder="输入商品名称"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">商品描述</label>
              <textarea 
                className="form-textarea"
                placeholder="详细描述您的商品"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">价格 (元)</label>
              <input 
                type="number"
                className="form-input"
                placeholder="0.00"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">分类</label>
              <select 
                className="form-select"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="food">食品</option>
                <option value="service">服务</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          
          <div className="card-footer">
            <button 
              className="btn btn-primary"
              onClick={createProduct}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? <span className="loading-spinner"></span> : '发布商品'}
            </button>
          </div>
        </div>
      )}

      {/* 商品列表 */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <h3 className="card-title">我的商品</h3>
        </div>
        
        <div className="card-content">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-title">暂无商品</div>
              <div className="empty-desc">发布您的第一个商品吧！</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {products.map(product => (
                <div key={product.id} style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                        {product.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        分类: {product.category === 'food' ? '食品' : product.category === 'service' ? '服务' : '其他'}
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>
                      ¥{product.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 系统管理面板组件
function AdminPanel() {
  const { showToast } = useToast();
  const [stats, setStats] = React.useState({
    users: 0,
    posts: 0,
    tasks: 0,
    activities: 0
  });

  React.useEffect(() => {
    // 这里应该调用管理员统计API
    setStats({
      users: 156,
      posts: 89,
      tasks: 34,
      activities: 12
    });
  }, []);

  const adminActions = [
    { icon: '👥', label: '用户管理', action: () => showToast('用户管理功能开发中', 'info') },
    { icon: '📊', label: '数据统计', action: () => showToast('数据统计功能开发中', 'info') },
    { icon: '⚙️', label: '系统设置', action: () => showToast('系统设置功能开发中', 'info') },
    { icon: '📝', label: '日志查看', action: () => showToast('日志查看功能开发中', 'info') }
  ];

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">⚙️ 系统管理</h2>
          <p className="card-subtitle">管理员专用功能</p>
        </div>
        
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{stats.users}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>注册用户</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0369a1' }}>{stats.posts}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>社区动态</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>{stats.tasks}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>活跃任务</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fffbeb', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{stats.activities}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>进行中活动</div>
            </div>
          </div>
        </div>
      </div>

      {/* 管理功能 */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <h3 className="card-title">管理功能</h3>
        </div>
        
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {adminActions.map((action, index) => (
              <button
                key={index}
                className="btn btn-secondary"
                onClick={action.action}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px',
                  fontSize: '0.9rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage() {
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
        const { data } = await axios.get('/api/leaderboard');
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

// 聊天功能组件
function Chat() {
  const { showToast } = useToast();
  const [rooms, setRooms] = React.useState([]);
  const [currentRoom, setCurrentRoom] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [showCreateRoom, setShowCreateRoom] = React.useState(false);
  const [createRoomForm, setCreateRoomForm] = React.useState({
    name: "",
    description: "",
    room_type: "group"
  });

  React.useEffect(() => {
    loadChatRooms();
  }, []);

  React.useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom.id);
      // 定期刷新消息
      const interval = setInterval(() => {
        loadMessages(currentRoom.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  const loadChatRooms = async () => {
    try {
      const response = await axios.get("/chat/rooms");
      setRooms(response.data);
    } catch (err) {
      showToast("❌ 加载聊天室失败", "error");
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await axios.get(`/chat/rooms/${roomId}/messages`);
      setMessages(response.data);
    } catch (err) {
      showToast("❌ 加载消息失败", "error");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom) return;
    
    try {
      await axios.post(`/chat/rooms/${currentRoom.id}/messages`, {
        content: newMessage,
        message_type: "text"
      });
      setNewMessage("");
      loadMessages(currentRoom.id);
    } catch (err) {
      showToast("❌ 发送消息失败", "error");
    }
  };

  const createRoom = async () => {
    if (!createRoomForm.name.trim()) {
      showToast("请填写聊天室名称", "warning");
      return;
    }

    try {
      await axios.post("/chat/rooms", createRoomForm);
      setCreateRoomForm({ name: "", description: "", room_type: "group" });
      setShowCreateRoom(false);
      loadChatRooms();
      showToast("✅ 聊天室创建成功！", "success");
    } catch (err) {
      showToast("❌ 创建聊天室失败", "error");
    }
  };

  const joinRoom = async (roomId) => {
    try {
      await axios.post(`/chat/rooms/${roomId}/join`);
      loadChatRooms();
      showToast("✅ 成功加入聊天室！", "success");
    } catch (err) {
      showToast("❌ 加入聊天室失败", "error");
    }
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">💬 聊天室</h2>
          <p className="card-subtitle">与邻居实时交流</p>
        </div>
        
        <div className="card-content">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", height: "600px" }}>
            {/* 聊天室列表 */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>聊天室</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateRoom(!showCreateRoom)}
                  style={{ 
                    fontSize: "0.85rem", 
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontWeight: "600"
                  }}
                >
                  {showCreateRoom ? "取消" : "+ 创建"}
                </button>
              </div>
              
              {showCreateRoom && (
                <div style={{ marginBottom: "16px", padding: "16px", background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "#374151" }}>创建新聊天室</h4>
                  <input
                    type="text"
                    placeholder="聊天室名称"
                    value={createRoomForm.name}
                    onChange={e => setCreateRoomForm({ ...createRoomForm, name: e.target.value })}
                    style={{ width: "100%", marginBottom: "8px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                  />
                  <textarea
                    placeholder="聊天室描述（可选）"
                    value={createRoomForm.description}
                    onChange={e => setCreateRoomForm({ ...createRoomForm, description: e.target.value })}
                    style={{ width: "100%", marginBottom: "12px", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", resize: "vertical", fontSize: "0.9rem" }}
                    rows="2"
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateRoom(false)}
                      style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                    >
                      取消
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={createRoom}
                      style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                    >
                      创建
                    </button>
                  </div>
                </div>
              )}
              
              <div style={{ maxHeight: "450px", overflowY: "auto" }}>
                {rooms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💬</div>
                    <div style={{ fontSize: "0.9rem" }}>暂无聊天室</div>
                    <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>点击上方按钮创建</div>
                  </div>
                ) : (
                  rooms.map(room => (
                    <div
                      key={room.id}
                      onClick={() => setCurrentRoom(room)}
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        background: currentRoom?.id === room.id ? "#3b82f6" : "white",
                        color: currentRoom?.id === room.id ? "white" : "inherit",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: currentRoom?.id === room.id ? "1px solid #3b82f6" : "1px solid #e5e7eb",
                        boxShadow: currentRoom?.id === room.id ? "0 2px 8px rgba(59, 130, 246, 0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "4px", fontSize: "0.95rem" }}>{room.name}</div>
                      <div style={{ fontSize: "0.8rem", opacity: currentRoom?.id === room.id ? 0.9 : 0.7, marginBottom: "6px" }}>{room.description}</div>
                      <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                        {room.user_role === "owner" ? "👑 群主" : "👤 成员"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* 聊天消息区域 */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", display: "flex", flexDirection: "column", background: "white" }}>
              {currentRoom ? (
                <>
                  {/* 聊天室标题 */}
                  <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1f2937" }}>{currentRoom.name}</h3>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "4px" }}>{currentRoom.description}</div>
                  </div>
                  
                  {/* 消息列表 */}
                  <div style={{ flex: 1, padding: "16px", overflowY: "auto", maxHeight: "350px" }}>
                    {messages.map(message => (
                      <div key={message.id} style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px" }}>
                          {message.sender_id === 1 ? "管理员" : 
                           message.sender_id === 2 ? "张三" :
                           message.sender_id === 3 ? "李版主" :
                           message.sender_id === 4 ? "王商家" :
                           message.sender_id === 5 ? "赵VIP" : "用户"}
                          {message.message_type === "system" && " (系统消息)"}
                        </div>
                        <div style={{
                          padding: "8px 12px",
                          background: message.message_type === "system" ? "#fef3c7" : "#f3f4f6",
                          borderRadius: "12px",
                          display: "inline-block",
                          maxWidth: "80%"
                        }}>
                          {message.content}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                          {new Date(message.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 发送消息 */}
                  <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="输入消息..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && sendMessage()}
                        style={{ 
                          flex: 1, 
                          padding: "10px 12px", 
                          borderRadius: "8px", 
                          border: "1px solid #d1d5db",
                          fontSize: "0.9rem",
                          outline: "none"
                        }}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        style={{ 
                          padding: "10px 16px", 
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: "600"
                        }}
                      >
                        发送
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <div style={{ textAlign: "center", color: "#6b7280" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💬</div>
                    <div>选择一个聊天室开始聊天</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 好友功能组件
function Friends() {
  const { showToast } = useToast();
  const [friends, setFriends] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await axios.get("/friends");
      setFriends(response.data);
    } catch (err) {
      showToast("❌ 加载好友列表失败", "error");
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await axios.get("/friends/requests");
      setRequests(response.data);
    } catch (err) {
      showToast("❌ 加载好友请求失败", "error");
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      showToast("❌ 搜索用户失败", "error");
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      await axios.post("/friends/request", { friend_id: friendId });
      showToast("✅ 好友请求已发送！", "success");
      searchUsers(); // 刷新搜索结果
    } catch (err) {
      showToast("❌ 发送好友请求失败", "error");
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`/friends/request/${requestId}/accept`);
      showToast("✅ 好友请求已接受！", "success");
      loadFriends();
      loadFriendRequests();
    } catch (err) {
      showToast("❌ 接受好友请求失败", "error");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await axios.post(`/friends/request/${requestId}/reject`);
      showToast("✅ 好友请求已拒绝", "success");
      loadFriendRequests();
    } catch (err) {
      showToast("❌ 拒绝好友请求失败", "error");
    }
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">👥 好友</h2>
          <p className="card-subtitle">管理好友关系</p>
        </div>
        
        <div className="card-content">
          {/* 搜索用户 */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "12px" }}>搜索用户</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="输入用户名搜索..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === "Enter" && searchUsers()}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
              <button className="btn btn-primary" onClick={searchUsers}>
                搜索
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <h4 style={{ marginBottom: "8px" }}>搜索结果</h4>
                {searchResults.map(user => (
                  <div key={user.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    marginBottom: "8px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600" }}>{user.username}</div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        {user.real_name} • {user.user_type}
                      </div>
                    </div>
                    <div>
                      {user.friendship_status === "none" && (
                        <button 
                          className="btn btn-small"
                          onClick={() => sendFriendRequest(user.id)}
                        >
                          添加好友
                        </button>
                      )}
                      {user.friendship_status === "pending" && (
                        <span style={{ color: "#f59e0b", fontSize: "0.85rem" }}>请求已发送</span>
                      )}
                      {user.friendship_status === "accepted" && (
                        <span style={{ color: "#10b981", fontSize: "0.85rem" }}>已是好友</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 好友请求 */}
          {requests.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ marginBottom: "12px" }}>好友请求 ({requests.length})</h3>
              {requests.map(request => (
                <div key={request.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#fef3c7",
                  borderRadius: "8px",
                  marginBottom: "8px"
                }}>
                  <div>
                    <div style={{ fontWeight: "600" }}>{request.username}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      {request.real_name} • {request.user_type}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      className="btn btn-small btn-primary"
                      onClick={() => acceptFriendRequest(request.id)}
                    >
                      接受
                    </button>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 好友列表 */}
          <div>
            <h3 style={{ marginBottom: "12px" }}>我的好友 ({friends.length})</h3>
            {friends.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>👥</div>
                <div>暂无好友，搜索用户添加好友吧！</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {friends.map(friend => (
                  <div key={friend.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div>
                      <div style={{ fontWeight: "600" }}>{friend.username}</div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        {friend.real_name} • {friend.user_type}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#10b981" }}>
                      ✓ 好友
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
