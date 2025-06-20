const express = require('express');
const app = express();

app.use(express.json());

const vipEmails = [
  'vip1@example.com',
  'vip2@example.com', 
  'premium@hotel.com',
  'gold@customer.com'
];

app.post('/check-vip', (req, res) => {
  console.log('VIP check request:', req.body);
  const { email } = req.body;
  const isVip = vipEmails.includes(email?.toLowerCase());
  
  const response = {
    email,
    isVip,
    tier: isVip ? 'gold' : 'standard',
    discount: isVip ? 15 : 0
  };
  
  console.log('VIP response:', response);
  res.json(response);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'mock-vip-api',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock VIP API running on port ${PORT}`);
  console.log('VIP emails:', vipEmails);
});
