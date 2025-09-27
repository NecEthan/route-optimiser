const express = require('express');
const router = express.Router();

// Import supabase client from index.js
const { createClient } = require('@supabase/supabase-js');
const supabaseDB = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware to verify JWT token
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
        console.log('🔐 Verifying token for payment endpoint');
        
        // Verify token with Supabase
        const { data: { user }, error } = await supabaseDB.auth.getUser(token);
        
        if (error || !user) {
            console.log('❌ Token verification failed:', error?.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        req.user = user;
        console.log('✅ User authenticated for payment operation:', { id: user.id, email: user.email });
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token verification failed' 
        });
    }
};

// PUT /api/payment/method/:id - Update existing payment method
router.put('/method/:id', verifyToken, async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    const userId = req.user.id;
    
    console.log('🔄 Updating payment method:', paymentMethodId, 'for user:', userId);
    console.log('📦 Update data received:', req.body);

    // Validate required fields
    const {
      stripe_payment_method_id,
      last_four,
      card_type,
      expiration_month,
      expiration_year,
      cardholder_name,
      bank_name = null,
      status = 'active'
    } = req.body;

    if (!stripe_payment_method_id || !last_four || !card_type || !cardholder_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stripe_payment_method_id, last_four, card_type, cardholder_name'
      });
    }

    // First, verify that the payment method belongs to the authenticated user
    const { data: existingMethod, error: fetchError } = await supabaseDB
      .from('user_payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching existing payment method:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found or does not belong to user'
        });
      }
      
      throw fetchError;
    }

    console.log('✅ Found existing payment method:', {
      id: existingMethod.id,
      current_last_four: existingMethod.last_four,
      current_type: existingMethod.card_type
    });

    // Update the payment method
    const updateData = {
      stripe_payment_method_id,
      last_four,
      card_type: card_type.toLowerCase(),
      expiration_month: parseInt(expiration_month),
      expiration_year: parseInt(expiration_year),
      cardholder_name,
      bank_name,
      status,
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Updating with data:', updateData);

    const { data: updatedData, error: updateError } = await supabaseDB
      .from('user_payment_methods')
      .update(updateData)
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating payment method:', updateError);
      throw updateError;
    }

    console.log('✅ Payment method updated successfully:', {
      id: updatedData.id,
      new_last_four: updatedData.last_four,
      new_type: updatedData.card_type,
      cardholder: updatedData.cardholder_name
    });

    // Return enhanced data
    const enhancedData = {
      ...updatedData,
      card_display_name: getCardDisplayName(updatedData.card_type),
      expiration_display: updatedData.expiration_month && updatedData.expiration_year 
        ? `${updatedData.expiration_month.toString().padStart(2, '0')}/${updatedData.expiration_year}`
        : null,
      formatted_last_four: updatedData.last_four ? `•••• •••• •••• ${updatedData.last_four}` : null,
      is_expired: isCardExpired(updatedData.expiration_month, updatedData.expiration_year)
    };

    res.json({
      success: true,
      data: enhancedData,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('💥 Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
      error: error.message
    });
  }
});

// POST /api/payment/method - Create new payment method
router.post('/method', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('➕ Creating new payment method for user:', userId);
    console.log('📦 Payment data received:', req.body);

    const {
      stripe_customer_id,
      stripe_payment_method_id,
      last_four,
      card_type,
      expiration_month,
      expiration_year,
      cardholder_name,
      bank_name = null,
      is_default = true,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!stripe_payment_method_id || !last_four || !card_type || !cardholder_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stripe_payment_method_id, last_four, card_type, cardholder_name'
      });
    }

    // If this is set as default, mark all other cards as non-default first
    if (is_default) {
      await supabaseDB
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const paymentMethodData = {
      user_id: userId,
      stripe_customer_id: stripe_customer_id || `cus_${Date.now()}`,
      stripe_payment_method_id,
      last_four,
      card_type: card_type.toLowerCase(),
      expiration_month: parseInt(expiration_month),
      expiration_year: parseInt(expiration_year),
      cardholder_name,
      bank_name,
      is_default,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newPaymentMethod, error: insertError } = await supabaseDB
      .from('user_payment_methods')
      .insert([paymentMethodData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating payment method:', insertError);
      throw insertError;
    }

    console.log('✅ Payment method created successfully:', {
      id: newPaymentMethod.id,
      last_four: newPaymentMethod.last_four,
      type: newPaymentMethod.card_type
    });

    // Return enhanced data
    const enhancedData = {
      ...newPaymentMethod,
      card_display_name: getCardDisplayName(newPaymentMethod.card_type),
      expiration_display: newPaymentMethod.expiration_month && newPaymentMethod.expiration_year 
        ? `${newPaymentMethod.expiration_month.toString().padStart(2, '0')}/${newPaymentMethod.expiration_year}`
        : null,
      formatted_last_four: newPaymentMethod.last_four ? `•••• •••• •••• ${newPaymentMethod.last_four}` : null,
      is_expired: isCardExpired(newPaymentMethod.expiration_month, newPaymentMethod.expiration_year)
    };

    res.status(201).json({
      success: true,
      data: enhancedData,
      message: 'Payment method created successfully'
    });

  } catch (error) {
    console.error('💥 Error creating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment method',
      error: error.message
    });
  }
});

// DELETE /api/payment/method/:id - Delete payment method
router.delete('/method/:id', verifyToken, async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    const userId = req.user.id;

    console.log('🗑️ Deleting payment method:', paymentMethodId, 'for user:', userId);

    // Verify ownership before deletion
    const { data: existingMethod, error: fetchError } = await supabaseDB
      .from('user_payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found or does not belong to user'
      });
    }

    if (fetchError) {
      throw fetchError;
    }

    // Soft delete (mark as inactive) instead of hard delete
    const { error: deleteError } = await supabaseDB
      .from('user_payment_methods')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentMethodId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Error deleting payment method:', deleteError);
      throw deleteError;
    }

    console.log('✅ Payment method deleted successfully');

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('💥 Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error.message
    });
  }
});

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

module.exports = router;
