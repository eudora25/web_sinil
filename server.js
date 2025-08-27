const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// create-user API
app.post('/api/create-user', async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://vbmmfuraxvxlfpewqrsm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3MDg4MCwiZXhwIjoyMDcxNzQ2ODgwfQ._M_g1QCYnBzHxpIGBSIVKgVpaYCm1-S4YPOHjCHvXRI'
  );

  const { email, password, company_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Supabase Auth에 사용자 생성 (admin 권한)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_name }
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return res.status(400).json({ error: error.message });
    }

    // 생성된 사용자 정보 반환
    console.log('User created successfully:', data.user.id);
    return res.status(200).json({ user: data.user });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 정적 파일 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
