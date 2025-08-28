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

// create-user API (회원가입용)
app.post('/api/create-user', async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://vbmmfuraxvxlfpewqrsm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3MDg4MCwiZXhwIjoyMDcxNzQ2ODgwfQ._M_g1QCYnBzHxpIGBSIVKgVpaYCm1-S4YPOHjCHvXRI'
  );

  const { 
    email, 
    password, 
    company_name,
    business_registration_number,
    representative_name,
    business_address,
    contact_person_name,
    mobile_phone
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1단계: Supabase Auth에 사용자 생성 (admin 권한)
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

    // 2단계: 회사 정보 등록 (admin 권한으로 RLS 우회)
    if (data.user && business_registration_number) {
      const companyData = {
        user_id: data.user.id,
        email: email,
        company_name: company_name || '미입력',
        business_registration_number: business_registration_number,
        representative_name: representative_name || '미입력',
        business_address: business_address || null,
        contact_person_name: contact_person_name || null,
        mobile_phone: mobile_phone || null,
        user_type: 'user',
        approval_status: 'pending',
        created_by: data.user.id,
      };

      console.log('Attempting to insert company data:', companyData);
      const { data: companyInsertData, error: companyInsertError } = await supabase
        .from('companies')
        .insert([companyData]);

      if (companyInsertError) {
        console.error('Company insert error:', companyInsertError);
        console.error('Company data that failed to insert:', companyData);
        // 사용자는 생성되었지만 회사 정보 등록 실패
        return res.status(200).json({ 
          user: data.user, 
          warning: '사용자는 생성되었지만 회사 정보 등록에 실패했습니다.',
          companyError: companyInsertError.message 
        });
      }

      console.log('User and company created successfully:', data.user.id);
      console.log('Company insert result:', companyInsertData);
      return res.status(200).json({ 
        user: data.user, 
        company: companyInsertData 
      });
    }

    // 회사 정보 없이 사용자만 생성
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
