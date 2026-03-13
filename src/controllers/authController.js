const { auth, db } = require('../config/firebase');

// ផ្ទៀងផ្ទាត់ Firebase Token
const verifyToken = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // រកមើលអ្នកប្រើក្នុង Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // បង្កើតអ្នកប្រើថ្មីក្នុង Firestore
      const userData = {
        uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
        photoURL: decodedToken.picture || '',
        createdAt: new Date().toISOString(),
        spendingLimit: 0,
        monthlySalary: 0,
        gender: 'male',
        company: '',
        jobTitle: ''
      };
      
      await db.collection('users').doc(uid).set(userData);
      
      return res.status(200).json({
        success: true,
        user: userData,
        isNewUser: true
      });
    }
    
    // អ្នកប្រើមានរួចហើយ
    return res.status(200).json({
      success: true,
      user: userDoc.data(),
      isNewUser: false
    });
    
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// ទទួលបានព័ត៌មានអ្នកប្រើ
const getUser = async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      user: userDoc.data()
    });
    
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// ធ្វើបច្ចុប្បន្នភាពព័ត៌មានអ្នកប្រើ
const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    
    await db.collection('users').doc(uid).update(updates);
    
    const updatedDoc = await db.collection('users').doc(uid).get();
    
    return res.status(200).json({
      success: true,
      user: updatedDoc.data()
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  verifyToken,
  getUser,
  updateUser
};