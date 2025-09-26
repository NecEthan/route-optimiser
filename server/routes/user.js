const express = require('express');
const router = express.Router();

// Import supabase client from index.js
const { createClient } = require('@supabase/supabase-js');
const supabaseDB = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper functions
const getCardDisplayName = (cardType) => {
  if (!cardType) return 'Credit Card';
  
  switch (cardType.toLowerCase()) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
      return 'American Express';
    case 'discover':
      return 'Discover';
    case 'diners':
      return 'Diners Club';
    case 'jcb':
      return 'JCB';
    default:
      return 'Credit Card';
  }
};

const isCardExpired = (expirationMonth, expirationYear) => {
  if (!expirationMonth || !expirationYear) return false;
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = today.getFullYear();
  
  if (expirationYear < currentYear) return true;
  if (expirationYear === currentYear && expirationMonth < currentMonth) return true;
  
  return false;
};

// Middleware to verify JWT token (basic version)
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No authorization header or invalid format');
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🔐 Verifying token:', token ? 'Token present' : 'No token');
        
        // Verify token with Supabase
        const { data: { user }, error } = await supabaseDB.auth.getUser(token);
        
        console.log('🔍 Token verification result:', { 
            user: user ? { id: user.id, email: user.email } : null, 
            error: error?.message 
        });
        
        if (error || !user) {
            console.log('❌ Token verification failed:', error?.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        req.user = user;
        console.log('✅ User authenticated:', { id: user.id, email: user.email });
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

    // Calculate next billing date based on subscription start date and billing cycle
    let nextBillingDate = null;
    if (data.subscription_start_date && data.billing_cycle) {
      const startDate = new Date(data.subscription_start_date);
      const today = new Date();
      
      if (data.billing_cycle === 'monthly') {
        // Find the next monthly billing date
        nextBillingDate = new Date(startDate);
        nextBillingDate.setMonth(today.getMonth() + 1);
        nextBillingDate.setDate(startDate.getDate());
        
        // If the next billing date has already passed this month, move to next month
        if (nextBillingDate <= today) {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
      } else if (data.billing_cycle === 'yearly') {
        nextBillingDate = new Date(startDate);
        nextBillingDate.setFullYear(today.getFullYear() + 1);
        
        if (nextBillingDate <= today) {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }
      }
    }

    // Enhanced subscription data
    const enhancedData = {
      ...data,
      next_billing_date: nextBillingDate ? nextBillingDate.toISOString().split('T')[0] : null,
      subscription_type: data.subscription_type || 'Basic Plan',
      billing_cycle: data.billing_cycle || 'monthly',
      formatted_price: `£${parseFloat(data.subscription_price || 0).toFixed(2)}`
    };

    console.log('✅ Enhanced subscription data:', {
      id: enhancedData.id,
      type: enhancedData.subscription_type,
      price: enhancedData.formatted_price,
      next_billing: enhancedData.next_billing_date,
      status: enhancedData.status
    });
    
    res.json({
      success: true,
      data: enhancedData,
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

// GET /api/user/create-sample-data - Create sample data for testing (NO AUTH REQUIRED)
router.get('/create-sample-data', async (req, res) => {
  try {
    console.log('🧪 Creating sample data...');
    
    // Create a test user ID (you can replace this with your actual user ID)
    const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Replace with your user ID
    
    // Create sample subscription
    const sampleSubscription = {
      user_id: testUserId,
      stripe_customer_id: 'cus_sample_123',
      stripe_subscription_id: 'sub_sample_123',
      subscription_price: 15.99,
      subscription_type: 'Pro Plan',
      subscription_start_date: new Date().toISOString().split('T')[0],
      billing_cycle: 'monthly',
      status: 'active'
    };

    const { data: subData, error: subError } = await supabaseDB
      .from('user_subscriptions')
      .upsert([sampleSubscription], { onConflict: 'user_id' })
      .select()
      .single();

    // Create sample payment method
    const samplePaymentMethod = {
      user_id: testUserId,
      stripe_customer_id: 'cus_sample_123',
      stripe_payment_method_id: 'pm_sample_123',
      last_four: '4242',
      card_type: 'visa',
      expiration_month: 12,
      expiration_year: 2028,
      cardholder_name: 'John Doe',
      bank_name: 'Sample Bank',
      is_default: true,
      status: 'active'
    };

    const { data: pmData, error: pmError } = await supabaseDB
      .from('user_payment_methods')
      .upsert([samplePaymentMethod], { onConflict: 'stripe_payment_method_id' })
      .select()
      .single();

    res.json({
      success: true,
      data: {
        subscription: subData,
        paymentMethod: pmData,
        message: 'Sample data created! Now test your payment method endpoint.',
        testUserId: testUserId
      }
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample data',
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

// GET /api/user/create-sample-data - Create sample data for the logged in user (development only)
router.get('/create-sample-data/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('🧪 Creating sample data for user:', userId);
    
    // Create test subscription
    const testSubscription = {
      user_id: userId,
      stripe_customer_id: `cus_test_${Date.now()}`,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      subscription_price: 15.99,
      subscription_type: 'Pro Plan',
      subscription_start_date: new Date().toISOString().split('T')[0],
      billing_cycle: 'monthly',
      status: 'active'
    };

    const { data: subData, error: subError } = await supabaseDB
      .from('user_subscriptions')
      .insert([testSubscription])
      .select()
      .single();

    if (subError) {
      console.error('Error creating test subscription:', subError);
    } else {
      console.log('✅ Test subscription created:', subData.id);
    }

    // Create test payment method
    const testPaymentMethod = {
      user_id: userId,
      stripe_customer_id: `cus_test_${Date.now()}`,
      stripe_payment_method_id: `pm_test_${Date.now()}`,
      last_four: '4242',
      card_type: 'visa',
      expiration_month: 12,
      expiration_year: 2028,
      cardholder_name: 'John Doe',
      bank_name: 'Test Bank',
      is_default: true,
      status: 'active'
    };

    const { data: pmData, error: pmError } = await supabaseDB
      .from('user_payment_methods')
      .insert([testPaymentMethod])
      .select()
      .single();

    if (pmError) {
      console.error('Error creating test payment method:', pmError);
    } else {
      console.log('✅ Test payment method created:', pmData.id);
    }

    res.json({
      success: true,
      data: {
        subscription: subData,
        paymentMethod: pmData
      },
      message: 'Sample data created successfully'
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample data',
      error: error.message
    });
  }
});

// GET /api/user/debug/payment-methods - Debug endpoint to check what payment methods exist
router.get('/debug/payment-methods', async (req, res) => {
  try {
    const { data, error } = await supabaseDB
      .from('user_payment_methods')
      .select('*');
    
    console.log('🔍 All payment methods in DB:', data);
    
    res.json({
      success: true,
      data: data,
      count: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/debug/current-user - Debug endpoint to check what user is authenticated
router.get('/debug/current-user', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Current authenticated user:', req.user);
    
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        created_at: req.user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/debug/confirm-user - Debug endpoint to confirm the test user's email
router.get('/debug/confirm-user', async (req, res) => {
  try {
    const testUserId = 'd62955ed-992c-4c59-9e8e-87ea2ce96556';
    
    // Use admin client to update user confirmation status
    const { data, error } = await supabaseDB.auth.admin.updateUserById(testUserId, {
      email_confirm: true
    });
    
    if (error) {
      console.error('Error confirming user:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log('✅ User confirmed:', data);
    
    res.json({
      success: true,
      message: 'User email confirmed',
      user: data.user
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/debug/fix-payment-data - Debug endpoint to fix payment data for current authenticated user
router.get('/debug/fix-payment-data', verifyToken, async (req, res) => {
  try {
    // Update existing payment data to use the current authenticated user ID
    const currentUserId = req.user.id;
    const existingUserId = 'd62955ed-992c-4c59-9e8e-87ea2ce96556';
    
    console.log(`🔧 Fixing payment data from ${existingUserId} to ${currentUserId}`);
    
    // Update payment methods
    const { data: paymentData, error: paymentError } = await supabaseDB
      .from('user_payment_methods')
      .update({ user_id: currentUserId })
      .eq('user_id', existingUserId)
      .select();
    
    if (paymentError) {
      console.error('Error updating payment methods:', paymentError);
    } else {
      console.log('✅ Updated payment methods:', paymentData);
    }
    
    // Update subscriptions if any exist
    const { data: subData, error: subError } = await supabaseDB
      .from('user_subscriptions')
      .update({ user_id: currentUserId })
      .eq('user_id', existingUserId)
      .select();
    
    if (subError) {
      console.error('Error updating subscriptions:', subError);
    } else {
      console.log('✅ Updated subscriptions:', subData);
    }
    
    res.json({
      success: true,
      message: 'Fixed payment data for current user',
      currentUserId,
      existingUserId,
      updatedPaymentMethods: paymentData?.length || 0,
      updatedSubscriptions: subData?.length || 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/debug/update-test-data - Debug endpoint to update existing payment data to new user
router.get('/debug/update-test-data', async (req, res) => {
  try {
    // Update the existing payment data to use the newly registered user ID
    const newUserId = 'd62955ed-992c-4c59-9e8e-87ea2ce96556';
    const oldUserId = '947af734-4e40-44f7-8d8e-d0f304dee2dd';
    
    console.log(`🔄 Updating payment data from ${oldUserId} to ${newUserId}`);
    
    // Update payment methods
    const { data: paymentData, error: paymentError } = await supabaseDB
      .from('user_payment_methods')
      .update({ user_id: newUserId })
      .eq('user_id', oldUserId)
      .select();
    
    if (paymentError) {
      console.error('Error updating payment methods:', paymentError);
    } else {
      console.log('✅ Updated payment methods:', paymentData);
    }
    
    // Update subscriptions if any exist
    const { data: subData, error: subError } = await supabaseDB
      .from('user_subscriptions')
      .update({ user_id: newUserId })
      .eq('user_id', oldUserId)
      .select();
    
    if (subError) {
      console.error('Error updating subscriptions:', subError);
    } else {
      console.log('✅ Updated subscriptions:', subData);
    }
    
    res.json({
      success: true,
      message: 'Updated test data to new user ID',
      oldUserId,
      newUserId,
      updatedPaymentMethods: paymentData?.length || 0,
      updatedSubscriptions: subData?.length || 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/create-test-data - Create sample subscription and payment method for testing
router.post('/create-test-data', verifyToken, async (req, res) => {
  try {
    console.log('🧪 Creating test data for user:', req.user.id);
    
    // Create test subscription
    const testSubscription = {
      user_id: req.user.id,
      stripe_customer_id: `cus_test_${Date.now()}`,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      subscription_price: 15.99,
      subscription_type: 'Pro Plan',
      subscription_start_date: new Date().toISOString().split('T')[0],
      billing_cycle: 'monthly',
      status: 'active'
    };

    const { data: subData, error: subError } = await supabaseDB
      .from('user_subscriptions')
      .insert([testSubscription])
      .select()
      .single();

    if (subError) {
      console.error('Error creating test subscription:', subError);
    } else {
      console.log('✅ Test subscription created:', subData.id);
    }

    // Create test payment method
    const testPaymentMethod = {
      user_id: req.user.id,
      stripe_customer_id: `cus_test_${Date.now()}`,
      stripe_payment_method_id: `pm_test_${Date.now()}`,
      last_four: '4242',
      card_type: 'visa',
      expiration_month: 12,
      expiration_year: 2028,
      cardholder_name: 'John Doe',
      bank_name: 'Test Bank',
      is_default: true,
      status: 'active'
    };

    const { data: pmData, error: pmError } = await supabaseDB
      .from('user_payment_methods')
      .insert([testPaymentMethod])
      .select()
      .single();

    if (pmError) {
      console.error('Error creating test payment method:', pmError);
    } else {
      console.log('✅ Test payment method created:', pmData.id);
    }

    res.json({
      success: true,
      data: {
        subscription: subData,
        paymentMethod: pmData
      },
      message: 'Test data created successfully'
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test data',
      error: error.message
    });
  }
});

// GET /api/user/payment-method - Get user's payment method
router.get('/payment-method', verifyToken, async (req, res) => {
  try {
    console.log('💳 Fetching payment method for authenticated user:', req.user.id);
    console.log('📝 Frontend requested userId from query:', req.query.userId);
    
    // Check if the frontend userId matches the authenticated user
    if (req.query.userId && req.query.userId !== req.user.id) {
      console.log('⚠️  MISMATCH: Frontend userId does not match authenticated user!');
      console.log('   Frontend userId:', req.query.userId);
      console.log('   Authenticated userId:', req.user.id);
    }
    
    // First, let's see what payment methods exist in the database (for debugging)
    const { data: allMethods, error: allError } = await supabaseDB
      .from('user_payment_methods')
      .select('user_id, id, status, last_four');
    
    console.log('🔍 All payment methods in database:', allMethods);
    
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

    // Enhanced payment method data with formatted information
    const enhancedData = {
      ...data,
      card_display_name: getCardDisplayName(data.card_type),
      expiration_display: data.expiration_month && data.expiration_year 
        ? `${data.expiration_month.toString().padStart(2, '0')}/${data.expiration_year}`
        : null,
      is_expired: isCardExpired(data.expiration_month, data.expiration_year),
      formatted_last_four: data.last_four ? `•••• •••• •••• ${data.last_four}` : null
    };

    console.log('✅ Enhanced payment method data:', {
      id: enhancedData.id,
      display_name: enhancedData.card_display_name,
      last_four: enhancedData.last_four,
      expiration: enhancedData.expiration_display,
      status: enhancedData.status,
      is_expired: enhancedData.is_expired
    });
    
    res.json({
      success: true,
      data: enhancedData,
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
