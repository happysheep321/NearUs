import React from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// 优惠券页面
function Coupons() {
  const [coupons, setCoupons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showClaim, setShowClaim] = React.useState(false);
  const [selectedCoupon, setSelectedCoupon] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // 示例优惠券数据
  const sampleCoupons = [
    {
      id: 1,
      title: '新用户专享券',
      description: '首次注册用户专享，全场商品8折优惠',
      discount_type: 'percentage',
      discount_value: 20,
      min_amount: 50,
      max_discount: 100,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      category: 'new_user',
      is_claimed: false,
      is_used: false,
      business: '社区超市',
      conditions: ['仅限首次使用', '不可与其他优惠叠加']
    },
    {
      id: 2,
      title: '满减优惠券',
      description: '满100减20，满200减50',
      discount_type: 'amount',
      discount_value: 20,
      min_amount: 100,
      max_discount: 50,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
      category: 'discount',
      is_claimed: true,
      is_used: false,
      business: '邻里餐厅',
      conditions: ['仅限堂食', '不可打包']
    },
    {
      id: 3,
      title: '生日特惠券',
      description: '生日当月专享，全场商品9折优惠',
      discount_type: 'percentage',
      discount_value: 10,
      min_amount: 30,
      max_discount: 50,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      category: 'birthday',
      is_claimed: false,
      is_used: false,
      business: '社区咖啡厅',
      conditions: ['需验证生日信息', '仅限本人使用']
    },
    {
      id: 4,
      title: '积分兑换券',
      description: '使用100积分兑换，全场商品7折优惠',
      discount_type: 'percentage',
      discount_value: 30,
      min_amount: 80,
      max_discount: 80,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      category: 'points',
      is_claimed: false,
      is_used: false,
      business: '社区书店',
      conditions: ['需消耗100积分', '不可退款']
    },
    {
      id: 5,
      title: '限时抢购券',
      description: '限时抢购，全场商品6折优惠',
      discount_type: 'percentage',
      discount_value: 40,
      min_amount: 60,
      max_discount: 120,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      category: 'flash',
      is_claimed: true,
      is_used: true,
      business: '社区服装店',
      conditions: ['限时抢购', '库存有限']
    },
    {
      id: 6,
      title: '推荐好友券',
      description: '成功推荐好友注册，获得全场商品5折优惠',
      discount_type: 'percentage',
      discount_value: 50,
      min_amount: 40,
      max_discount: 60,
      expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
      category: 'referral',
      is_claimed: false,
      is_used: false,
      business: '社区便利店',
      conditions: ['需成功推荐好友', '仅限一次使用']
    }
  ];

  React.useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data } = await axios.get('/coupons');
      if (data.length === 0) {
        setCoupons(sampleCoupons);
      } else {
        setCoupons(data);
      }
    } catch (error) {
      console.error('加载优惠券失败:', error);
      setCoupons(sampleCoupons);
    } finally {
      setLoading(false);
    }
  };

  const claimCoupon = async (id) => {
    try {
      await axios.post(`/coupons/${id}/claim`);
      if (window.showToast) {
        window.showToast('优惠券领取成功！', 'success');
      }
      loadCoupons();
    } catch (error) {
      if (window.showToast) {
        window.showToast('领取失败', 'error');
      }
    }
  };

  const useCoupon = async (id) => {
    try {
      await axios.post(`/coupons/${id}/use`);
      if (window.showToast) {
        window.showToast('优惠券使用成功！', 'success');
      }
      loadCoupons();
    } catch (error) {
      if (window.showToast) {
        window.showToast('使用失败', 'error');
      }
    }
  };

  const getCategoryInfo = (category) => {
    const categories = {
      new_user: { label: '新用户', icon: '🎁', color: '#10b981' },
      discount: { label: '满减', icon: '💰', color: '#3b82f6' },
      birthday: { label: '生日', icon: '🎂', color: '#f59e0b' },
      points: { label: '积分', icon: '⭐', color: '#8b5cf6' },
      flash: { label: '限时', icon: '⚡', color: '#ef4444' },
      referral: { label: '推荐', icon: '👥', color: '#06b6d4' }
    };
    return categories[category] || { label: '通用', icon: '🎫', color: '#6b7280' };
  };

  const getStatusInfo = (coupon) => {
    if (coupon.is_used) {
      return { label: '已使用', icon: '✅', color: '#10b981' };
    } else if (coupon.is_claimed) {
      return { label: '已领取', icon: '📦', color: '#3b82f6' };
    } else {
      return { label: '可领取', icon: '🎯', color: '#f59e0b' };
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesFilter = filter === 'all' || coupon.category === filter;
    const matchesSearch = coupon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coupon.business.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStats = () => {
    const total = coupons.length;
    const available = coupons.filter(c => !c.is_claimed && !c.is_used).length;
    const claimed = coupons.filter(c => c.is_claimed && !c.is_used).length;
    const used = coupons.filter(c => c.is_used).length;
    return { total, available, claimed, used };
  };

  const stats = getStats();

  if (loading) return (
    <div className="fade-in">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载优惠券中...</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* 页面头部 */}
      <div className="page-header coupons-header">
        <div className="header-content">
          <h1>🎫 优惠券</h1>
          <p>发现社区商家优惠，享受专属折扣</p>
        </div>
      </div>

      {/* 优惠券统计 */}
      <div className="coupons-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总优惠券</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.available}</div>
          <div className="stat-label">可领取</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.claimed}</div>
          <div className="stat-label">已领取</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.used}</div>
          <div className="stat-label">已使用</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="coupons-filter">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索优惠券或商家..."
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
            <span className="tab-icon">🎫</span>
            <span className="tab-text">全部</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'new_user' ? 'active' : ''}`}
            onClick={() => setFilter('new_user')}
          >
            <span className="tab-icon">🎁</span>
            <span className="tab-text">新用户</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'discount' ? 'active' : ''}`}
            onClick={() => setFilter('discount')}
          >
            <span className="tab-icon">💰</span>
            <span className="tab-text">满减</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'flash' ? 'active' : ''}`}
            onClick={() => setFilter('flash')}
          >
            <span className="tab-icon">⚡</span>
            <span className="tab-text">限时</span>
          </button>
        </div>
      </div>

      {/* 优惠券列表 */}
      <div className="coupons-grid">
        {filteredCoupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h3>暂无优惠券</h3>
            <p>{searchQuery ? '没有找到匹配的优惠券' : '暂时没有可用的优惠券'}</p>
          </div>
        ) : (
          filteredCoupons.map(coupon => {
            const categoryInfo = getCategoryInfo(coupon.category);
            const statusInfo = getStatusInfo(coupon);
            const isExpired = new Date(coupon.expiry_date) < new Date();
            
            return (
              <motion.div 
                key={coupon.id} 
                className={`coupon-card ${isExpired ? 'expired' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="coupon-header">
                  <div className="coupon-discount">
                    <span className="discount-value">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `¥${coupon.discount_value}`}
                    </span>
                    <span className="discount-label">
                      {coupon.discount_type === 'percentage' ? '折扣' : '减免'}
                    </span>
                  </div>
                  <div className="coupon-status">
                    <span className="status-icon">{statusInfo.icon}</span>
                    <span className="status-label">{statusInfo.label}</span>
                  </div>
                </div>
                
                <div className="coupon-body">
                  <div className="coupon-title">{coupon.title}</div>
                  <div className="coupon-description">{coupon.description}</div>
                  
                  <div className="coupon-business">
                    <span className="business-icon">🏪</span>
                    <span className="business-name">{coupon.business}</span>
                  </div>
                  
                  <div className="coupon-conditions">
                    {coupon.conditions.map((condition, index) => (
                      <div key={index} className="condition-item">
                        <span className="condition-icon">📋</span>
                        <span className="condition-text">{condition}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="coupon-category">
                    <span className="category-icon" style={{ color: categoryInfo.color }}>
                      {categoryInfo.icon}
                    </span>
                    <span className="category-label">{categoryInfo.label}</span>
                  </div>
                </div>
                
                <div className="coupon-footer">
                  {coupon.is_used ? (
                    <div className="coupon-disabled">
                      <span className="disabled-icon">✅</span>
                      <span className="disabled-text">已使用</span>
                    </div>
                  ) : coupon.is_claimed ? (
                    <button 
                      className="btn btn-primary use-btn"
                      onClick={() => useCoupon(coupon.id)}
                    >
                      立即使用
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary claim-btn"
                      onClick={() => claimCoupon(coupon.id)}
                    >
                      立即领取
                    </button>
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

export default Coupons;
