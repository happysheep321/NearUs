import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (username, password) => {
    const { data } = await axios.post('/auth/login', { username, password });
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await axios.post('/auth/register', payload);
    localStorage.setItem('auth', JSON.stringify(data));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
    // 强制跳转到首页
    window.location.href = '/';
  };

  const token = () => {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    try { 
      return JSON.parse(raw).access_token; 
    } catch { 
      return null; 
    }
  };

  // 设置 axios 拦截器
  React.useEffect(() => {
    axios.interceptors.request.use((config) => {
      const t = token();
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
  }, []);

  const value = {
    user,
    auth: { user, token },
    login,
    register,
    logout,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
