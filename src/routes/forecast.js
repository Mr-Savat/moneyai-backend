const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { db } = require('../config/firebase');

// GET /api/forecast - ទាញយកការព្យាករណ៍
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req;
    
    // ទាញយក Transactions ៦ ខែចុងក្រោយ
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    
    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('transactions')
      .where('date', '>=', startDate)
      .where('amount', '<', 0) // តែចំណាយ
      .orderBy('date')
      .get();
    
    // Group តាមខែ
    const monthlyMap = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          total: 0
        };
      }
      
      monthlyMap[monthKey].total += Math.abs(data.amount);
    });
    
    const monthlyData = Object.values(monthlyMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
    
    // គណនាការព្យាករណ៍ (ប្រើ 2 ខែចុងក្រោយ)
    let forecast = null;
    if (monthlyData.length >= 2) {
      const last = monthlyData[monthlyData.length - 1];
      const prev = monthlyData[monthlyData.length - 2];
      const trend = last.total - prev.total;
      const conservativeTrend = trend * 0.7;
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const lastMonthIndex = months.indexOf(last.month);
      const nextMonth = months[lastMonthIndex + 1] || 'Jan';
      
      forecast = {
        nextMonth,
        nextValue: Math.round(last.total + conservativeTrend),
        lastMonth: last.month,
        lastValue: last.total,
        trend: Math.round(trend)
      };
    }
    
    res.json({
      success: true,
      historical: monthlyData,
      forecast
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;