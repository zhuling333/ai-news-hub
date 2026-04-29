const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Use /tmp for writable storage on Vercel
  const countFile = '/tmp/stats_count.json';
  
  if (req.method === 'GET') {
    let data = { count: 0 };
    if (fs.existsSync(countFile)) {
      try {
        data = JSON.parse(fs.readFileSync(countFile, 'utf8'));
      } catch(e) {}
    }
    res.json({ ...data, ts: Date.now() });
  } else if (req.method === 'POST') {
    let data = { count: 0 };
    if (fs.existsSync(countFile)) {
      try {
        data = JSON.parse(fs.readFileSync(countFile, 'utf8'));
      } catch(e) {}
    }
    data.count = (data.count || 0) + 1;
    data.lastUpdate = new Date().toISOString();
    try {
      fs.writeFileSync(countFile, JSON.stringify(data));
    } catch(e) { console.error('Write error:', e); }
    res.json({ success: true, count: data.count });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
