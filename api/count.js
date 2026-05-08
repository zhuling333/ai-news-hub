const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    // Read from /tmp (ephemeral but works per-cold-start)
    let data = { count: 0 };
    try {
      const countFile = '/tmp/stats_count.json';
      if (fs.existsSync(countFile)) {
        data = JSON.parse(fs.readFileSync(countFile, 'utf8'));
      }
    } catch (e) { /* ignore */ }
    res.json({ ...data, ts: Date.now() });
  } else if (req.method === 'POST') {
    let count = 0;
    try {
      const countFile = '/tmp/stats_count.json';
      if (fs.existsSync(countFile)) {
        const existing = JSON.parse(fs.readFileSync(countFile, 'utf8'));
        count = existing.count || 0;
      }
      count += 1;
      fs.writeFileSync(countFile, JSON.stringify({
        count,
        lastUpdate: new Date().toISOString(),
      }));
    } catch (e) { /* /tmp may not be writable in some envs */ }
    res.json({ success: true, count });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
