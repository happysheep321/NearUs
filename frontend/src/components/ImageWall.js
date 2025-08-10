import React from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// 图片墙页面
function ImageWall() {
  const [images, setImages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showUpload, setShowUpload] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploadDescription, setUploadDescription] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // 开源图片素材
  const sampleImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
      description: '美丽的社区花园，绿意盎然',
      uploader: { username: '园艺爱好者' },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      likes_count: 15,
      is_liked: false
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      description: '邻里音乐分享会现场，大家其乐融融',
      uploader: { username: '音乐达人' },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      likes_count: 28,
      is_liked: true
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      description: '晨跑健身团，健康生活从运动开始',
      uploader: { username: '健身教练' },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      likes_count: 42,
      is_liked: false
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
      description: '老年人智能手机课堂，科技助老',
      uploader: { username: '数字助老' },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      likes_count: 35,
      is_liked: false
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
      description: '社区烧烤派对，美食与友谊',
      uploader: { username: '美食家' },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      likes_count: 56,
      is_liked: true
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
      description: '社区读书会，知识分享的快乐',
      uploader: { username: '书香门第' },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      likes_count: 23,
      is_liked: false
    }
  ];

  React.useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data } = await axios.get('/image-wall');
      if (data.length === 0) {
        setImages(sampleImages);
      } else {
        setImages(data);
      }
    } catch (error) {
      console.error('加载图片失败:', error);
      setImages(sampleImages);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('description', uploadDescription);
    
    try {
      await axios.post('/image-wall/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFile(null);
      setUploadDescription('');
      setShowUpload(false);
      loadImages();
      // 这里需要从父组件传入showToast函数
      if (window.showToast) {
        window.showToast('图片上传成功！', 'success');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      if (window.showToast) {
        window.showToast('上传图片失败', 'error');
      }
    }
  };

  const likeImage = async (id) => {
    try {
      await axios.post(`/image-wall/${id}/like`);
      loadImages();
    } catch (error) {
      if (window.showToast) {
        window.showToast('操作失败', 'error');
      }
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.uploader?.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStats = () => {
    const total = images.length;
    const totalLikes = images.reduce((sum, img) => sum + (img.likes_count || 0), 0);
    const myLikes = images.filter(img => img.is_liked).length;
    return { total, totalLikes, myLikes };
  };

  const stats = getStats();

  if (loading) return (
    <div className="fade-in">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载图片墙中...</p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* 页面头部 */}
      <div className="page-header image-wall-header">
        <div className="header-content">
          <h1>📷 图片墙</h1>
          <p>分享美好瞬间，记录社区生活</p>
        </div>
        <button 
          className="btn btn-primary btn-large image-upload-btn"
          onClick={() => setShowUpload(true)}
        >
          <span className="btn-icon">📤</span>
          上传图片
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="image-wall-stats">
        <div className="stat-item">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">总图片</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.totalLikes}</div>
          <div className="stat-label">总点赞</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{stats.myLikes}</div>
          <div className="stat-label">我的点赞</div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="image-wall-search">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索图片描述或上传者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* 图片瀑布流 */}
      <div className="image-wall-grid">
        {filteredImages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📷</div>
            <h3>暂无图片</h3>
            <p>{searchQuery ? '没有找到匹配的图片' : '成为第一个分享图片的人吧！'}</p>
          </div>
        ) : (
          filteredImages.map(image => (
            <motion.div 
              key={image.id} 
              className="image-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="image-container">
                <img src={image.url} alt={image.description} className="wall-image" />
                <div className="image-overlay">
                  <button 
                    className={`like-button ${image.is_liked ? 'liked' : ''}`}
                    onClick={() => likeImage(image.id)}
                  >
                    {image.is_liked ? '❤️' : '🤍'} {image.likes_count || 0}
                  </button>
                </div>
              </div>
              <div className="image-info">
                <p className="image-description">{image.description || '无描述'}</p>
                <div className="image-meta">
                  <span className="meta-item">
                    <span className="meta-icon">👤</span>
                    {image.uploader?.username || '未知'}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {new Date(image.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 上传图片弹窗 */}
      {showUpload && (
        <div className="modal-overlay image-upload-modal" onClick={() => setShowUpload(false)}>
          <div className="modal-content image-upload-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header image-upload-header">
              <div className="header-left">
                <h3>📤 上传图片</h3>
                <p>分享你的美好瞬间，让社区更加精彩</p>
              </div>
            </div>
            
            <div className="modal-body image-upload-body">
              <div className="upload-section">
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="file-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">
                      <h4>选择图片</h4>
                      <p>点击选择或拖拽图片到此处</p>
                    </div>
                  </label>
                  {selectedFile && (
                    <div className="selected-file">
                      <img src={URL.createObjectURL(selectedFile)} alt="预览" className="file-preview" />
                      <span className="file-name">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-section">
                <div className="form-group">
                  <label>图片描述</label>
                  <textarea
                    placeholder="描述这张图片的内容和故事..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="form-textarea"
                    rows="4"
                  />
                </div>
              </div>
              
              <div className="upload-tips">
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  <span className="tip-text">添加有意义的描述，让更多人了解你的分享</span>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📏</span>
                  <span className="tip-text">建议图片尺寸不超过5MB，支持JPG、PNG格式</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer image-upload-footer">
              <button className="btn btn-outline" onClick={() => setShowUpload(false)}>取消</button>
              <button 
                className="upload-submit-btn"
                onClick={uploadImage}
                disabled={!selectedFile}
              >
                <span className="btn-icon">📤</span>
                上传图片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageWall;
