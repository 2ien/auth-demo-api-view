const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authRouter = require('./routers/authRouter');
const postsRouter = require('./routers/postsRouter');

const Users = require('./models/usersModel');
const Post = require('./models/postsModel');
const mongooseTypes = require('mongoose').Types;

const app = express();

// Middleware bảo mật
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    }
  })
);

// Middleware cơ bản
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// View engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(__dirname + '/public'));
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/js', express.static(__dirname + '/js'));

// Session (nếu cần dùng flash hoặc quản lý user truyền thống)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false
  })
);

// Middleware decode JWT → req.user + res.locals.user
app.use((req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret', (err, decoded) => {
      if (!err) {
        req.user = decoded;
        res.locals.user = decoded;
      } else {
        res.locals.user = null;
      }
      next();
    });
  } else {
    res.locals.user = null;
    next();
  }
});

// Middleware bảo vệ route view (form create)
const requireLogin = (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  next();
};

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected'))
  .catch((err) => console.error(err));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// Web view routes

// Trang chủ
app.get('/', (req, res) => {
  res.render('index', { title: 'Trang chủ', user: res.locals.user });
});

// Danh sách bài viết
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .populate('author', 'email');
    res.render('posts', { title: 'Danh sách bài viết', posts, user: res.locals.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi máy chủ');
  }
});

// Form tạo bài viết
app.get('/posts/create', requireLogin, (req, res) => {
  res.render('createPost', { title: 'Tạo bài viết mới', user: res.locals.user });
});

// Xử lý tạo bài viết
app.post('/posts/create', requireLogin, async (req, res) => {
  const { title, subtitle, content, summary, tags, category, coverImage } = req.body;
  try {
    const newPost = new Post({
      title,
      subtitle,
      content,
      summary,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category,
      coverImage,
      author: req.user.id,
      publishedAt: new Date(),
      status: 'published'
    });
    await newPost.save();
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi tạo bài viết');
  }
});

// Chi tiết bài viết
app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongooseTypes.ObjectId.isValid(id)) {
    return res.status(400).send('ID bài viết không hợp lệ');
  }

  try {
    const post = await Post.findById(id).populate('author', 'email');
    if (!post) {
      return res.status(404).send('Không tìm thấy bài viết');
    }
    res.render('post', { title: post.title, post, user: res.locals.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi máy chủ');
  }
});

// Đăng nhập
app.get('/login', (req, res) => {
  res.render('login', { title: 'Đăng nhập' });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render('login', { title: 'Đăng nhập', message: 'Vui lòng nhập đầy đủ' });
    }

    const user = await Users.findOne({ email }).select('+password');
    if (!user) return res.render('login', { title: 'Đăng nhập', message: 'Không tìm thấy người dùng' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render('login', { title: 'Đăng nhập', message: 'Sai mật khẩu' });

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'jwtsecret');
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.render('login', { title: 'Đăng nhập', message: 'Lỗi máy chủ' });
  }
});

// Đăng ký
app.get('/register', (req, res) => {
  res.render('register', { title: 'Đăng ký' });
});

app.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.render('register', { title: 'Đăng ký', message: 'Vui lòng nhập đầy đủ' });
    }

    if (password !== confirmPassword) {
      return res.render('register', { title: 'Đăng ký', message: 'Mật khẩu không khớp' });
    }

    const existed = await Users.findOne({ email });
    if (existed) return res.render('register', { title: 'Đăng ký', message: 'Email đã được sử dụng' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await Users.create({ email, password: hashed });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'jwtsecret');
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.render('register', { title: 'Đăng ký', message: 'Đăng ký thất bại' });
  }
});

// Đăng xuất
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Trang 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// Khởi động server
app.listen(process.env.PORT || 8000, '0.0.0.0', () => {
  console.log('✅ Server is running...');
});
