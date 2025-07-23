const jwt = require('jsonwebtoken');

exports.identifier = (req, res, next) => {
  let token;
  if (req.headers.client === 'not-browser') {
    token = req.headers.authorization;  // Thường dạng "Bearer token"
  } else {
    token = req.cookies['token'];  // Đổi thành 'token' cho giống phần set cookie
  }

  if (!token) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Nếu token có dạng "Bearer token", tách ra
    const userToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET || 'jwtsecret');
    if (jwtVerified) {
      req.user = jwtVerified;
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
  } catch (error) {
    console.log(error);
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }
};
