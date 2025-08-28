// Vercel Serverless Function: /api/create-user.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vbmmfuraxvxlfpewqrsm.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibW1mdXJheHZ4bGZwZXdxcnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3MDg4MCwiZXhwIjoyMDcxNzQ2ODgwfQ._M_g1QCYnBzHxpIGBSIVKgVpaYCm1-S4YPOHjCHvXRI'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    // Supabase Auth에 사용자 생성 (admin 권한)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_name }
    });

    if (error) {
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

      const { data: companyInsertData, error: companyInsertError } = await supabase
        .from('companies')
        .insert([companyData]);

      if (companyInsertError) {
        console.error('Company insert error:', companyInsertError);
        // 사용자는 생성되었지만 회사 정보 등록 실패
        return res.status(200).json({ 
          user: data.user, 
          warning: '사용자는 생성되었지만 회사 정보 등록에 실패했습니다.',
          companyError: companyInsertError.message 
        });
      }

      console.log('User and company created successfully:', data.user.id);
      return res.status(200).json({ 
        user: data.user, 
        company: companyInsertData 
      });
    }

    // 회사 정보 없이 사용자만 생성
    console.log('User created successfully:', data.user.id);
    return res.status(200).json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
} 