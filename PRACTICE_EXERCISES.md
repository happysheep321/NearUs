# NearUs邻里APP - 实践练习指南

## 🎯 练习目标

通过一系列循序渐进的练习，帮助你从零开始掌握全栈开发技能。每个练习都基于NearUs项目，让你在实践中学习。

---

## 📚 基础练习 (适合初学者)

### 练习1: 修改页面文本
**目标**: 熟悉项目结构，学会修改简单内容

**任务**:
1. 找到首页的欢迎文本
2. 修改为你的个性化欢迎语
3. 修改页面标题

**文件位置**:
- 前端: `frontend/src/index.js` (Home组件)
- 后端: `app.py` (首页路由)

**学习要点**:
- 理解React组件结构
- 学会修改JSX内容
- 了解前后端分离的概念

### 练习2: 添加简单的样式
**目标**: 学习CSS样式修改

**任务**:
1. 修改按钮颜色
2. 调整页面布局
3. 添加一些动画效果

**文件位置**:
- `frontend/src/index.css`

**学习要点**:
- CSS选择器
- Flexbox布局
- CSS动画

### 练习3: 修改用户信息显示
**目标**: 理解数据绑定和状态管理

**任务**:
1. 在用户资料页面添加新字段
2. 修改用户信息显示格式
3. 添加头像显示

**文件位置**:
- 前端: `frontend/src/index.js` (用户相关组件)
- 后端: `app.py` (User模型)

**学习要点**:
- React状态管理
- 数据绑定
- 组件通信

---

## 🔧 进阶练习 (适合有一定基础)

### 练习4: 创建新的页面组件
**目标**: 学会创建完整的页面组件

**任务**:
1. 创建一个"关于我们"页面
2. 添加路由配置
3. 在导航中添加链接

**步骤**:
```jsx
// 1. 创建组件
function AboutUs() {
    return (
        <div className="about-page">
            <h1>关于我们</h1>
            <p>NearUs是一个邻里社交平台...</p>
        </div>
    );
}

// 2. 添加路由
<Route path="/about" element={<AboutUs />} />

// 3. 添加导航链接
{ path: '/about', icon: 'ℹ️', label: '关于我们' }
```

**学习要点**:
- React组件创建
- 路由配置
- 导航系统

### 练习5: 实现简单的API调用
**目标**: 理解前后端通信

**任务**:
1. 创建一个"系统状态"页面
2. 显示后端服务器状态
3. 添加刷新按钮

**后端API**:
```python
@app.route('/api/status')
def get_status():
    return jsonify({
        'status': 'running',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })
```

**前端实现**:
```jsx
function SystemStatus() {
    const [status, setStatus] = useState(null);
    
    const fetchStatus = async () => {
        try {
            const response = await axios.get('/api/status');
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };
    
    useEffect(() => {
        fetchStatus();
    }, []);
    
    return (
        <div>
            <h2>系统状态</h2>
            {status && (
                <div>
                    <p>状态: {status.status}</p>
                    <p>时间: {status.timestamp}</p>
                    <p>版本: {status.version}</p>
                </div>
            )}
            <button onClick={fetchStatus}>刷新</button>
        </div>
    );
}
```

**学习要点**:
- HTTP请求
- 异步编程
- 错误处理

### 练习6: 表单处理
**目标**: 学会处理用户输入

**任务**:
1. 创建一个"反馈"页面
2. 实现表单提交功能
3. 添加表单验证

**实现步骤**:
```jsx
function Feedback() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 表单验证
        const newErrors = {};
        if (!formData.name) newErrors.name = '请输入姓名';
        if (!formData.email) newErrors.email = '请输入邮箱';
        if (!formData.message) newErrors.message = '请输入反馈内容';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        try {
            await axios.post('/api/feedback', formData);
            alert('反馈提交成功！');
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            alert('提交失败，请重试');
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="您的姓名"
            />
            {errors.name && <span className="error">{errors.name}</span>}
            
            <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="您的邮箱"
            />
            {errors.email && <span className="error">{errors.email}</span>}
            
            <textarea
                name="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="您的反馈"
            />
            {errors.message && <span className="error">{errors.message}</span>}
            
            <button type="submit">提交反馈</button>
        </form>
    );
}
```

**学习要点**:
- 表单状态管理
- 表单验证
- 用户交互

---

## 🚀 高级练习 (适合有经验的开发者)

### 练习7: 实现实时通知
**目标**: 学习WebSocket和实时通信

**任务**:
1. 创建一个实时通知系统
2. 实现消息推送
3. 添加通知设置

**后端实现**:
```python
@socketio.on('join_notifications')
def handle_join_notifications(data):
    user_id = get_jwt_identity()
    join_room(f'user_{user_id}')

def send_notification(user_id, message):
    socketio.emit('new_notification', {
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f'user_{user_id}')
```

**前端实现**:
```jsx
function NotificationSystem() {
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();
    
    useEffect(() => {
        if (user) {
            socket.emit('join_notifications', { user_id: user.id });
            
            socket.on('new_notification', (notification) => {
                setNotifications(prev => [...prev, notification]);
            });
        }
        
        return () => {
            socket.off('new_notification');
        };
    }, [user]);
    
    return (
        <div className="notifications">
            <h3>实时通知</h3>
            {notifications.map((notification, index) => (
                <div key={index} className="notification">
                    <p>{notification.message}</p>
                    <small>{notification.timestamp}</small>
                </div>
            ))}
        </div>
    );
}
```

**学习要点**:
- WebSocket通信
- 实时数据处理
- 房间管理

### 练习8: 文件上传功能
**目标**: 学会处理文件上传

**任务**:
1. 实现头像上传功能
2. 添加文件类型验证
3. 实现图片预览

**后端实现**:
```python
@app.route('/api/upload/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user = current_user()
    
    if 'avatar' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = f"avatar_{user.id}_{int(time.time())}.jpg"
        filepath = os.path.join('uploads', 'avatars', filename)
        file.save(filepath)
        
        user.avatar_url = f"/uploads/avatars/{filename}"
        db.session.commit()
        
        return jsonify({'avatar_url': user.avatar_url})
    
    return jsonify({'error': 'Invalid file type'}), 400
```

**前端实现**:
```jsx
function AvatarUpload() {
    const [avatar, setAvatar] = useState(null);
    const [preview, setPreview] = useState(null);
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            
            // 创建预览
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    const handleUpload = async () => {
        if (!avatar) return;
        
        const formData = new FormData();
        formData.append('avatar', avatar);
        
        try {
            const response = await axios.post('/api/upload/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('头像上传成功！');
        } catch (error) {
            alert('上传失败，请重试');
        }
    };
    
    return (
        <div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />
            {preview && (
                <img src={preview} alt="预览" style={{width: 100, height: 100}} />
            )}
            <button onClick={handleUpload}>上传头像</button>
        </div>
    );
}
```

**学习要点**:
- 文件处理
- FormData使用
- 图片预览

### 练习9: 数据可视化
**目标**: 学会数据展示和图表

**任务**:
1. 创建用户活跃度统计页面
2. 实现数据图表展示
3. 添加时间筛选

**实现步骤**:
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function UserStats() {
    const [stats, setStats] = useState([]);
    const [timeRange, setTimeRange] = useState('7d');
    
    const fetchStats = async () => {
        try {
            const response = await axios.get(`/api/stats/users?range=${timeRange}`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };
    
    useEffect(() => {
        fetchStats();
    }, [timeRange]);
    
    return (
        <div>
            <h2>用户活跃度统计</h2>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="90d">最近90天</option>
            </select>
            
            <LineChart width={600} height={300} data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="active_users" stroke="#8884d8" />
            </LineChart>
        </div>
    );
}
```

**学习要点**:
- 数据可视化
- 图表库使用
- 数据筛选

---

## 🎯 综合项目练习

### 练习10: 完整的功能模块
**目标**: 综合运用所学知识

**任务**: 创建一个"社区活动"模块

**功能要求**:
1. 用户可以创建活动
2. 其他用户可以报名参加
3. 活动有详细信息和状态管理
4. 支持活动搜索和筛选
5. 活动通知系统

**实现步骤**:

1. **数据库模型**:
```python
class CommunityEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(255))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    max_participants = db.Column(db.Integer)
    current_participants = db.Column(db.Integer, default=0)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(32), default='upcoming')  # upcoming, ongoing, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    creator = db.relationship('User', backref='created_events')
    participants = db.relationship('EventParticipant', backref='event')

class EventParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('community_events.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(32), default='confirmed')  # confirmed, cancelled
    
    user = db.relationship('User', backref='event_participations')
```

2. **API路由**:
```python
@app.route('/api/events', methods=['GET', 'POST'])
@jwt_required()
def events():
    if request.method == 'GET':
        # 获取活动列表，支持搜索和筛选
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        
        query = CommunityEvent.query
        if search:
            query = query.filter(CommunityEvent.title.contains(search))
        if status:
            query = query.filter(CommunityEvent.status == status)
        
        events = query.order_by(CommunityEvent.start_time).all()
        return jsonify([event.to_dict() for event in events])
    
    elif request.method == 'POST':
        # 创建新活动
        user = current_user()
        data = request.json
        
        event = CommunityEvent(
            title=data['title'],
            description=data['description'],
            location=data['location'],
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']),
            max_participants=data.get('max_participants'),
            created_by=user.id
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify(event.to_dict()), 201

@app.route('/api/events/<int:event_id>/join', methods=['POST'])
@jwt_required()
def join_event(event_id):
    user = current_user()
    event = CommunityEvent.query.get_or_404(event_id)
    
    # 检查是否已经报名
    existing = EventParticipant.query.filter_by(
        event_id=event_id, user_id=user.id
    ).first()
    
    if existing:
        return jsonify({'error': 'Already joined'}), 400
    
    # 检查人数限制
    if event.max_participants and event.current_participants >= event.max_participants:
        return jsonify({'error': 'Event is full'}), 400
    
    participant = EventParticipant(event_id=event_id, user_id=user.id)
    event.current_participants += 1
    
    db.session.add(participant)
    db.session.commit()
    
    return jsonify({'message': 'Successfully joined event'})
```

3. **前端组件**:
```jsx
function CommunityEvents() {
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    
    const fetchEvents = async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            
            const response = await axios.get(`/api/events?${params}`);
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };
    
    useEffect(() => {
        fetchEvents();
    }, [searchTerm, statusFilter]);
    
    const handleJoinEvent = async (eventId) => {
        try {
            await axios.post(`/api/events/${eventId}/join`);
            fetchEvents(); // 刷新列表
            alert('报名成功！');
        } catch (error) {
            alert('报名失败：' + error.response.data.error);
        }
    };
    
    return (
        <div className="community-events">
            <div className="events-header">
                <h2>社区活动</h2>
                <button onClick={() => setShowCreate(true)}>创建活动</button>
            </div>
            
            <div className="events-filters">
                <input
                    type="text"
                    placeholder="搜索活动..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">全部状态</option>
                    <option value="upcoming">即将开始</option>
                    <option value="ongoing">进行中</option>
                    <option value="completed">已结束</option>
                </select>
            </div>
            
            <div className="events-list">
                {events.map(event => (
                    <div key={event.id} className="event-card">
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                        <div className="event-details">
                            <span>📍 {event.location}</span>
                            <span>🕒 {new Date(event.start_time).toLocaleString()}</span>
                            <span>👥 {event.current_participants}/{event.max_participants || '不限'}</span>
                        </div>
                        <button 
                            onClick={() => handleJoinEvent(event.id)}
                            disabled={event.status !== 'upcoming'}
                        >
                            {event.status === 'upcoming' ? '报名参加' : event.status}
                        </button>
                    </div>
                ))}
            </div>
            
            {showCreate && (
                <CreateEventModal 
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => {
                        setShowCreate(false);
                        fetchEvents();
                    }}
                />
            )}
        </div>
    );
}
```

**学习要点**:
- 完整的CRUD操作
- 复杂的状态管理
- 用户交互设计
- 数据验证和错误处理

---

## 📝 练习完成检查清单

### 基础练习
- [ ] 成功修改页面文本
- [ ] 添加了自定义样式
- [ ] 修改了用户信息显示

### 进阶练习
- [ ] 创建了新的页面组件
- [ ] 实现了API调用
- [ ] 完成了表单处理

### 高级练习
- [ ] 实现了实时通知
- [ ] 完成了文件上传
- [ ] 创建了数据可视化

### 综合项目
- [ ] 完成了完整的功能模块
- [ ] 实现了复杂的状态管理
- [ ] 添加了错误处理机制

---

## 🎯 练习建议

1. **循序渐进**: 按照难度顺序完成练习
2. **理解原理**: 不要只是复制代码，要理解每个概念
3. **举一反三**: 尝试修改练习内容，添加新功能
4. **记录笔记**: 记录遇到的问题和解决方案
5. **寻求帮助**: 遇到困难时查阅文档或寻求帮助

通过这些练习，你将逐步掌握全栈开发的核心技能，从简单的页面修改到复杂的功能实现。记住，编程是一个持续学习的过程，保持耐心和热情！
