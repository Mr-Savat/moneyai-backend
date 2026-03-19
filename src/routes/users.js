const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
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
module.exports = router;