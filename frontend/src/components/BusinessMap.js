import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import 'leaflet/dist/leaflet.css';

// 修复Leaflet默认图标问题
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BusinessMap = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const { auth } = useAuth();
  const { showToast } = useToast();

  const categories = [
    { value: 'all', label: '全部', icon: '🏪' },
    { value: 'restaurant', label: '餐饮', icon: '🍽️' },
    { value: 'shop', label: '商店', icon: '🛍️' },
    { value: 'service', label: '服务', icon: '🔧' },
    { value: 'other', label: '其他', icon: '📍' }
  ];

  useEffect(() => {
    fetchBusinesses();
    getUserLocation();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get('/businesses');
      setBusinesses(response.data);
    } catch (error) {
      showToast('获取商家信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('获取位置失败:', error);
          // 默认位置：北京
          setUserLocation([39.9042, 116.4074]);
        }
      );
    } else {
      setUserLocation([39.9042, 116.4074]);
    }
  };

  const filteredBusinesses = businesses.filter(business => 
    selectedCategory === 'all' || business.category === selectedCategory
  );

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : '📍';
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  if (loading || !userLocation) {
    return (
      <div className="business-map-container">
        <div className="loading">加载地图中...</div>
      </div>
    );
  }

  return (
    <div className="business-map-container">
      <div className="map-header">
        <h2>🗺️ 本地商家地图</h2>
        <div className="category-filter">
          {categories.map(category => (
            <motion.button
              key={category.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.value)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* 用户位置标记 */}
          <Marker position={userLocation}>
            <Popup>
              <div className="user-location-popup">
                <h4>📍 您的位置</h4>
                <p>纬度: {userLocation[0].toFixed(4)}</p>
                <p>经度: {userLocation[1].toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>

          {/* 商家标记 */}
          {filteredBusinesses.map(business => (
            <Marker
              key={business.id}
              position={[business.latitude, business.longitude]}
            >
              <Popup>
                <div className="business-popup">
                  <h4>{getCategoryIcon(business.category)} {business.name}</h4>
                  <p className="business-description">{business.description}</p>
                  <p className="business-address">📍 {business.address}</p>
                  {business.phone && (
                    <p className="business-phone">📞 {business.phone}</p>
                  )}
                  <div className="business-rating">
                    <span className="stars">
                      {'⭐'.repeat(Math.floor(business.rating))}
                    </span>
                    <span className="rating-text">
                      {business.rating.toFixed(1)} ({business.rating_count} 评价)
                    </span>
                  </div>
                  {userLocation && (
                    <p className="business-distance">
                      距离: {getDistance(
                        userLocation[0], userLocation[1],
                        business.latitude, business.longitude
                      )} 公里
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="business-list">
        <h3>附近商家 ({filteredBusinesses.length})</h3>
        <div className="business-cards">
          {filteredBusinesses.map(business => (
            <motion.div
              key={business.id}
              className="business-card"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="business-card-header">
                <span className="business-icon">{getCategoryIcon(business.category)}</span>
                <h4>{business.name}</h4>
                {business.is_verified && <span className="verified-badge">✓ 认证</span>}
              </div>
              <p className="business-description">{business.description}</p>
              <p className="business-address">📍 {business.address}</p>
              <div className="business-footer">
                <div className="business-rating">
                  <span className="stars">
                    {'⭐'.repeat(Math.floor(business.rating))}
                  </span>
                  <span>{business.rating.toFixed(1)}</span>
                </div>
                {userLocation && (
                  <span className="distance">
                    {getDistance(
                      userLocation[0], userLocation[1],
                      business.latitude, business.longitude
                    )}km
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessMap;
