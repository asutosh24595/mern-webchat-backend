const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, 'webchatapp-secret-key');
    req.user = decoded; // Attach the decoded user information to the request object
    next();
  } catch (error) {
    console.error('Error during token verification:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
