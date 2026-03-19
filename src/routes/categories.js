const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');

// GET /api/categories
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    
    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('categories')
      .orderBy('name')
      .get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/categories
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    
    const category = {
      name,
      color: color || '#6366f1',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('categories')
      .add(category);
    
    res.status(201).json({ 
      success: true, 
      category: { id: docRef.id, ...category }
    });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { id } = req.params;
    
    await db
      .collection('users')
      .doc(uid)
      .collection('categories')
      .doc(id)
      .delete();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;