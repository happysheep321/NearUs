import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const ImageWall = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, [filter]);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`/api/images?filter=${filter}`);
      setImages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取图片失败:', error);
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    const formData = new FormData();
    
    acceptedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setImages(prev => [...response.data, ...prev]);
      setShowUpload(false);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  const likeImage = async (imageId) => {
    try {
      await axios.post(`/api/images/${imageId}/like`);
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, likes: img.likes + 1, liked: true }
            : img
        )
      );
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const unlikeImage = async (imageId) => {
    try {
      await axios.delete(`/api/images/${imageId}/like`);
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, likes: img.likes - 1, liked: false }
            : img
        )
      );
    } catch (error) {
      console.error('取消点赞失败:', error);
    }
  };

  const addComment = async (imageId, comment) => {
    try {
      const response = await axios.post(`/api/images/${imageId}/comments`, { comment });
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, comments: [...img.comments, response.data] }
            : img
        )
      );
    } catch (error) {
      console.error('添加评论失败:', error);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await axios.delete(`/api/images/${imageId}`);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSelectedImage(null);
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  };

  const filteredImages = images.filter(image => 
    image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">图片分享墙</h1>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {images.length}
            </div>
            <div className="text-sm text-gray-600">总图片</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {images.reduce((sum, img) => sum + img.likes, 0)}
            </div>
            <div className="text-sm text-gray-600">总点赞</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {images.reduce((sum, img) => sum + img.comments.length, 0)}
            </div>
            <div className="text-sm text-gray-600">总评论</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(images.map(img => img.user_id)).size}
            </div>
            <div className="text-sm text-gray-600">分享用户</div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索图片、标签或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部</option>
              <option value="recent">最新</option>
              <option value="popular">最热</option>
              <option value="mine">我的</option>
            </select>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              上传图片
            </button>
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">上传图片</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <span>上传中...</span>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">📷</div>
                  <p className="text-gray-600">
                    {isDragActive ? '释放文件以上传' : '拖拽图片到此处，或点击选择文件'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    支持 JPG, PNG, GIF, WebP 格式
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 图片网格 */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {filteredImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="break-inside-avoid mb-4 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <div className="relative group">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                  <div className="text-2xl mb-2">👁️</div>
                  <div>查看详情</div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{image.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{image.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {image.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      image.liked ? unlikeImage(image.id) : likeImage(image.id);
                    }}
                    className={`flex items-center space-x-1 ${
                      image.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <span>{image.liked ? '❤️' : '🤍'}</span>
                    <span>{image.likes}</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <span>💬</span>
                    <span>{image.comments.length}</span>
                  </div>
                </div>
                <span>{formatTime(image.created_at)}</span>
              </div>
              
              <div className="flex items-center mt-3">
                <img
                  src={image.user_avatar || '/default-avatar.png'}
                  alt={image.username}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span className="text-sm text-gray-600">{image.username}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 图片详情模态框 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <p className="text-gray-600 mb-4">{selectedImage.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedImage.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            selectedImage.liked ? unlikeImage(selectedImage.id) : likeImage(selectedImage.id);
                            setSelectedImage(prev => ({
                              ...prev,
                              liked: !prev.liked,
                              likes: prev.liked ? prev.likes - 1 : prev.likes + 1
                            }));
                          }}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            selectedImage.liked 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                          }`}
                        >
                          <span>{selectedImage.liked ? '❤️' : '🤍'}</span>
                          <span>{selectedImage.likes}</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center">
                        <img
                          src={selectedImage.user_avatar || '/default-avatar.png'}
                          alt={selectedImage.username}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <span className="text-sm text-gray-600">{selectedImage.username}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">评论 ({selectedImage.comments.length})</h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedImage.comments.map((comment, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <img
                              src={comment.user_avatar || '/default-avatar.png'}
                              alt={comment.username}
                              className="w-6 h-6 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-sm">{comment.username}</span>
                                <span className="text-xs text-gray-500">{formatTime(comment.created_at)}</span>
                              </div>
                              <p className="text-sm text-gray-600">{comment.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageWall;
