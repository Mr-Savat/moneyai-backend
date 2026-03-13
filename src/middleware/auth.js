const { auth } = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    req.user = decodedToken;
    req.uid = decodedToken.uid;
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

module.exports = { verifyFirebaseToken };