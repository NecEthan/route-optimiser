const express = require('express');
const router = express.Router();

// Import supabase client from index.js
const { createClient } = require('@supabase/supabase-js');
const supabaseDB = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware to verify JWT token (basic version)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseDB.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user; // Add user to request object
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// GET /api/user/subscription - Get user's subscription data
router.get('/subscription', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching subscription for user:', req.user.id);
    
    const { data, error } = await supabaseDB
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // If no subscription found, return empty result instead of error
      if (error.code === 'PGRST116') {
        return res.json({
          success: true,
          data: null,
          message: 'No active subscription found'
        });
      }
      
      throw error;
    }

    console.log('✅ Subscription data found:', data);
    
    res.json({
      success: true,
      data: data,
      message: 'Subscription retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription data',
      error: error.message
    });
  }
});

// GET /api/user/profile - Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        user_metadata: req.user.user_metadata,
        created_at: req.user.created_at
      },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile data',
      error: error.message
    });
  }
});

// GET /api/user/payment-method - Get user's payment method
router.get('/payment-method', verifyToken, async (req, res) => {
  try {
    console.log('💳 Fetching payment method for user:', req.user.id);
    
    const { data, error } = await supabaseDB
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // If no payment method found, return empty result instead of error
      if (error.code === 'PGRST116') {
        return res.json({
          success: true,
          data: null,
          message: 'No payment method found'
        });
      }
      
      throw error;
    }

    console.log('✅ Payment method data found:', {
      id: data.id,
      last_four: data.last_four,
      card_type: data.card_type,
      status: data.status
    });
    
    res.json({
      success: true,
      data: data,
      message: 'Payment method retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching user payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment method data',
      error: error.message
    });
  }
});

module.exports = router;
