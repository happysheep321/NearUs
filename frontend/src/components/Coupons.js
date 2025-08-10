import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const { auth } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (auth?.user) {
      fetchCoupons();
    }
  }, [auth?.user]);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get('/coupons', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      showToast('获取优惠券失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const claimCoupon = async (code) => {
    try {
      const response = await axios.post(`/coupons/${code}/claim`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      showToast('优惠券领取成功！', 'success');
      setClaimCode('');
      fetchCoupons();
    } catch (error) {
      showToast(error.response?.data?.error || '领取失败', 'error');
    }
  };

  const createCoupon = async (formData) => {
    try {
      await axios.post('/coupons', formData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      showToast('优惠券创建成功！', 'success');
      setShowCreateForm(false);
      fetchCoupons();
    } catch (error) {
      showToast(error.response?.data?.error || '创建失败', 'error');
    }
  };

  const getDiscountText = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% 折扣`;
    } else {
      return `¥${coupon.discount_value} 减免`;
    }
  };

  const isExpired = (coupon) => {
    return new Date(coupon.valid_until) < new Date();
  };

  const isAvailable = (coupon) => {
    const now = new Date();
    return (
      coupon.is_active &&
      new Date(coupon.valid_from) <= now &&
      new Date(coupon.valid_until) >= now &&
      coupon.used_count < coupon.usage_limit
    );
  };

  if (loading) {
    return (
      <div className="coupons-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="coupons-container">
      <div className="coupons-header">
        <h2>🎫 优惠券中心</h2>
        {auth?.user?.user_type === 'merchant' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ 创建优惠券
          </motion.button>
        )}
      </div>

      {/* 领取优惠券 */}
      <div className="claim-section">
        <h3>🎁 领取优惠券</h3>
        <div className="claim-form">
          <input
            type="text"
            placeholder="输入优惠券代码"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            className="form-input"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            onClick={() => claimCoupon(claimCode)}
            disabled={!claimCode.trim()}
          >
            领取
          </motion.button>
        </div>
      </div>

      {/* 可用优惠券 */}
      <div className="available-coupons">
        <h3>📋 可用优惠券 ({coupons.filter(isAvailable).length})</h3>
        <div className="coupons-grid">
          <AnimatePresence>
            {coupons.filter(isAvailable).map((coupon) => (
              <motion.div
                key={coupon.id}
                className="coupon-card available"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="coupon-header">
                  <div className="coupon-icon">🎫</div>
                  <div className="coupon-code">{coupon.code}</div>
                </div>
                <div className="coupon-content">
                  <h4 className="coupon-title">{coupon.title}</h4>
                  <p className="coupon-description">{coupon.description}</p>
                  <div className="coupon-discount">
                    <span className="discount-amount">{getDiscountText(coupon)}</span>
                    {coupon.min_amount > 0 && (
                      <span className="min-amount">满¥{coupon.min_amount}可用</span>
                    )}
                  </div>
                  <div className="coupon-validity">
                    <span>有效期至: {new Date(coupon.valid_until).toLocaleDateString()}</span>
                    <span>剩余: {coupon.usage_limit - coupon.used_count}张</span>
                  </div>
                </div>
                <div className="coupon-footer">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-secondary"
                    onClick={() => claimCoupon(coupon.code)}
                  >
                    立即领取
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 已过期优惠券 */}
      <div className="expired-coupons">
        <h3>⏰ 已过期优惠券 ({coupons.filter(isExpired).length})</h3>
        <div className="coupons-grid">
          {coupons.filter(isExpired).map((coupon) => (
            <motion.div
              key={coupon.id}
              className="coupon-card expired"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="coupon-header">
                <div className="coupon-icon">⏰</div>
                <div className="coupon-code">{coupon.code}</div>
              </div>
              <div className="coupon-content">
                <h4 className="coupon-title">{coupon.title}</h4>
                <p className="coupon-description">{coupon.description}</p>
                <div className="coupon-discount">
                  <span className="discount-amount">{getDiscountText(coupon)}</span>
                </div>
                <div className="coupon-validity expired">
                  <span>已过期: {new Date(coupon.valid_until).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 创建优惠券表单 */}
      {showCreateForm && (
        <div className="modal-overlay">
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <CreateCouponForm
              onSubmit={createCoupon}
              onCancel={() => setShowCreateForm(false)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

// 创建优惠券表单组件
const CreateCouponForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_amount: '',
    max_discount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-coupon-form">
      <h3>创建优惠券</h3>
      
      <div className="form-group">
        <label>优惠券标题</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>折扣类型</label>
          <select
            value={formData.discount_type}
            onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
            className="form-input"
          >
            <option value="percentage">百分比折扣</option>
            <option value="fixed">固定金额减免</option>
          </select>
        </div>

        <div className="form-group">
          <label>折扣值</label>
          <input
            type="number"
            value={formData.discount_value}
            onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>最低消费</label>
          <input
            type="number"
            value={formData.min_amount}
            onChange={(e) => setFormData({...formData, min_amount: e.target.value})}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>最大折扣</label>
          <input
            type="number"
            value={formData.max_discount}
            onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>生效时间</label>
          <input
            type="datetime-local"
            value={formData.valid_from}
            onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>过期时间</label>
          <input
            type="datetime-local"
            value={formData.valid_until}
            onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>使用限制</label>
        <input
          type="number"
          value={formData.usage_limit}
          onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
          min="1"
          className="form-input"
        />
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

export default Coupons;
