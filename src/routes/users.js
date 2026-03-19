const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const admin = require('firebase-admin');
// GET /api/users/profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.json({ 
        success: true, 
        user: { name: '', spendingLimit: 0, monthlySalary: 0 } 
      });
    }

    res.json({ success: true, user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/profile
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { 
      name, gender, company, jobTitle, 
      monthlySalary, spendingLimit, 
      profileImage 
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (company !== undefined) updateData.company = company;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    
    if (monthlySalary !== undefined) updateData.monthlySalary = parseFloat(monthlySalary) || 0;
    if (spendingLimit !== undefined) updateData.spendingLimit = parseFloat(spendingLimit) || 0;
    
    updateData.updatedAt = new Date().toISOString();

    await db.collection('users').doc(uid).set(updateData, { merge: true });

    const updatedDoc = await db.collection('users').doc(uid).get();

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: updatedDoc.data() 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
router.delete('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;

    // Get all transactions
    const transactions = await db.collection('transactions').where('userId', '==', uid).get();
    
    // Use a batch, but be mindful of the 500 limit
    const batch = db.batch();
    
    transactions.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the user document
    const userDoc = db.collection('users').doc(uid);
    batch.delete(userDoc);

    // Commit the data deletion
    await batch.commit();

    // Finally, delete the Auth account
    await admin.auth().deleteUser(uid);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.code === 'auth/user-not-found' ? 'User already deleted' : error.message 
    });
  }
});

module.exports = router;
