const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');

// GET /api/statistics/summary
router.get('/summary', verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req;
        const { month, year } = req.query;

        const now = new Date();
        const targetMonth = month !== undefined ? parseInt(month) : now.getMonth();
        const targetYear = year !== undefined ? parseInt(year) : now.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const snapshot = await db
            .collection('users')
            .doc(uid)
            .collection('user_transactions_list')
            .where('date', '>=', startStr)
            .where('date', '<=', endStr)
            .get();

        let income = 0;
        let expense = 0;

        snapshot.forEach(doc => {
            const amount = doc.data().amount;
            if (amount > 0) {
                income += amount;
            } else {
                expense += Math.abs(amount);
            }
        });

        // ទាញយក Spending Limit
        const userDoc = await db.collection('users').doc(uid).get();
        const spendingLimit = userDoc.data()?.spendingLimit || 0;

        res.json({
            success: true,
            summary: {
                income,
                expense,
                balance: income - expense,
                spendingLimit,
                month: targetMonth,
                year: targetYear
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// GET /api/dashboard/daily - ទិន្នន័យប្រចាំថ្ងៃសម្រាប់ Chart
router.get('/daily', verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req;
        const { month, year } = req.query;

        const now = new Date();
        const targetMonth = month !== undefined ? parseInt(month) : now.getMonth();
        const targetYear = year !== undefined ? parseInt(year) : now.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // ទាញយក Transactions ក្នុងខែនេះ
        const snapshot = await db
            .collection('users')
            .doc(uid)
            .collection('user_transactions_list')
            .where('date', '>=', startStr)
            .where('date', '<=', endStr)
            .orderBy('date')
            .get();

        // Group តាមថ្ងៃ
        const dailyMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date;

            if (!dailyMap[date]) {
                dailyMap[date] = {
                    date,
                    income: 0,
                    expense: 0
                };
            }

            const amount = data.amount;
            if (amount > 0) {
                dailyMap[date].income += amount;
            } else {
                dailyMap[date].expense += Math.abs(amount);
            }
        });

        // បម្លែងជា Array និងតម្រៀបតាមថ្ងៃ
        const dailyData = Object.values(dailyMap).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        res.json({
            success: true,
            daily: dailyData
        });
    } catch (error) {
        console.error('Error fetching daily data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// GET /api/dashboard/categories - ទិន្នន័យតាមប្រភេទសម្រាប់ Pie Chart
router.get('/categories', verifyFirebaseToken, async (req, res) => {
    try {
        const { uid } = req;
        const { month, year } = req.query;

        const now = new Date();
        const targetMonth = month !== undefined ? parseInt(month) : now.getMonth();
        const targetYear = year !== undefined ? parseInt(year) : now.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // ទាញយក Transactions ក្នុងខែនេះ (តែចំណាយ)
        const snapshot = await db
            .collection('users')
            .doc(uid)
            .collection('user_transactions_list')
            .where('date', '>=', startStr)
            .where('date', '<=', endStr)
            .where('amount', '<', 0)
            .get();

        const categoryMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const category = data.category || 'Other';
            const amount = Math.abs(data.amount);

            categoryMap[category] = (categoryMap[category] || 0) + amount;
        });

        // បម្លែងជា Array សម្រាប់ Pie Chart
        const categories = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value
        }));

        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching category data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


module.exports = router;


