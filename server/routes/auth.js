const express = require('express');
const { supabaseAuth } = require('../index'); 
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration request:', req.body.email);
    
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    console.log('🔐 Calling Supabase auth.signUp...');

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('❌ Supabase auth error:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.log('✅ Registration successful!');

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      },
      message: 'User registered successfully!'
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login request:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Login error:', error);
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    console.log('✅ Login successful!');

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed: ' + error.message
    });
  }
});

module.exports = router;