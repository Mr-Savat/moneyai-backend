const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');

// GET /api/transactions - ទាញយក Transactions ទាំងអស់
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { month, year, limit = 50 } = req.query;
    
    let query = db
      .collection('users')
      .doc(uid)
      .collection('user_transactions_list')
      .orderBy('date', 'desc');
    
    // Filter តាមខែ បើមាន
    if (month && year) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      query = query
        .where('date', '>=', startDate)
        .where('date', '<=', endDate);
    }
    
    const snapshot = await query.limit(parseInt(limit)).get();
    
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ 
      success: true, 
      transactions,
      count: transactions.length
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transactions' 
    });
  }
});

// GET /api/transactions/:id - ទាញយក Transaction តាម ID
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { id } = req.params;
    
    const doc = await db
      .collection('users')
      .doc(uid)
      .collection('user_transactions_list')
      .doc(id)
      .get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }
    
    res.json({ 
      success: true, 
      transaction: { id: doc.id, ...doc.data() }
    });
    
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transaction' 
    });
  }
});

// POST /api/transactions - បន្ថែម Transaction ថ្មី
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { date, description, amount, category } = req.body;
    
    // ពិនិត្យទិន្នន័យ
    if (!date || !description || !amount || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const transaction = {
      date,
      description,
      amount: parseFloat(amount),
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('user_transactions_list')
      .add(transaction);
    
    res.status(201).json({ 
      success: true, 
      transaction: { id: docRef.id, ...transaction }
    });
    
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add transaction' 
    });
  }
});

// PUT /api/transactions/:id - កែ Transaction
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { id } = req.params;
    const updates = req.body;
    
    // បន្ថែម updatedAt
    updates.updatedAt = new Date().toISOString();
    
    await db
      .collection('users')
      .doc(uid)
      .collection('user_transactions_list')
      .doc(id)
      .update(updates);
    
    // ទាញយក Transaction ដែលបានកែ
    const updated = await db
      .collection('users')
      .doc(uid)
      .collection('user_transactions_list')
      .doc(id)
      .get();
    
    res.json({ 
      success: true, 
      transaction: { id: updated.id, ...updated.data() }
    });
    
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update transaction' 
    });
  }
});

// DELETE /api/transactions/:id - លុប Transaction
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    const { id } = req.params;
    
    await db
      .collection('users')
      .doc(uid)
      .collection('user_transactions_list')
      .doc(id)
      .delete();
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete transaction' 
    });
  }
});

module.exports = router;