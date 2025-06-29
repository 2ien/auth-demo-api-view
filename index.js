const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');

const authRouter = require('./routers/authRouter');
const postsRouter = require('./routers/postsRouter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('./models/usersModel');

const app = express();

// Cấu hình
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout'); 
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  const token = req.cookies.token;
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

// Kết nối DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected");
  })
  .catch(err => {
    console.log(err);
  });

// API route
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// Web view routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Trang chủ' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Đăng nhập' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email }).select('+password');

  if (!user) {
    return res.render('login', {
      title: 'Đăng nhập',
      message: 'Không tìm thấy người dùng'
    });
  }

  if (!user.password) {
    return res.render('login', {
      title: 'Đăng nhập',
      message: 'Tài khoản không hợp lệ (thiếu mật khẩu)'
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render('login', {
      title: 'Đăng nhập',
      message: 'Sai mật khẩu'
    });
  }

  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'jwtsecret'
  );
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/');
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Đăng ký' });
});

app.post('/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render('register', {
      title: 'Đăng ký',
      message: 'Mật khẩu không khớp'
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  await Users.create({ email, password: hashed });

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || 'jwtsecret'
  );
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

app.listen(process.env.PORT || 8000, '0.0.0.0', () => {
  console.log('Server is running');
});
