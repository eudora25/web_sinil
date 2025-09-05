// Express.js API Route: /api/create-user.js

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const router = express.Router();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// POST /api/create-user
router.post('/', async (req, res) => {
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
      return res.status(400).json({ error: error.message });
    }

    // 생성된 사용자 정보 반환
    return res.status(200).json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router; 