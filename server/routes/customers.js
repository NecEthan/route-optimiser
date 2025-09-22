const express = require('express');
const { supabase } = require('../index');
const router = express.Router();

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please login first.'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

router.use(authenticateUser);

router.get('/', async (req, res) => {
  try {
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', req.user.id)
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length,
      user: req.user.email
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('POST /api/customers - Received data:', req.body);
    console.log('User from token:', req.user);
    
    const { 
      name, 
      email, 
      phone, 
      description, 
      address, 
      price, 
      frequency, 
      estimated_duration,
      payment_status,
      exterior_windows,
      interior_windows,
      gutters,
      soffits,
      fascias,
      status,
      latitude, 
      longitude 
    } = req.body;

    if (!name || !address || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, description, and price are required'
      });
    }

    const customerData = {
      name,
      email: email || null,
      phone: phone || null,
      description,
      address,
      price: parseFloat(price),
      frequency: frequency || null,
      estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
      payment_status: payment_status || false,
      exterior_windows: exterior_windows || false,
      interior_windows: interior_windows || false,
      gutters: gutters || false,
      soffits: soffits || false,
      fascias: fascias || false,
      status: status !== undefined ? status : true, // Default to active
      user_id: req.user.id, // Use authenticated user ID
    };

    console.log('Inserting customer data:', customerData);

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
      });
    }

    console.log('Customer created successfully:', data);

    res.status(201).json({
      success: true,
      data: data,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    console.log('--------------------')
    console.log('Updating customer ID:', req.params.id, 'with data:', req.body);

    const { 
      name, 
      email, 
      phone, 
      address, 
      latitude, 
      longitude,
      description,
      price,
      frequency,
      estimated_duration,
      last_completed,
      payment_status,
      exterior_windows,
      interior_windows,
      gutters,
      soffits,
      fascias,
      status
    } = req.body;

    // Build update data with only provided fields
    const updateData = {};
    
    // Basic customer fields
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    
    // Service fields
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration ? parseInt(estimated_duration) : null;
    if (last_completed !== undefined) updateData.last_completed = last_completed;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (status !== undefined) updateData.status = status;
    
    // Service type booleans
    if (exterior_windows !== undefined) updateData.exterior_windows = exterior_windows;
    if (interior_windows !== undefined) updateData.interior_windows = interior_windows;
    if (gutters !== undefined) updateData.gutters = gutters;
    if (soffits !== undefined) updateData.soffits = soffits;
    if (fascias !== undefined) updateData.fascias = fascias;

    console.log('Filtered update data:', updateData);

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // Ensure user can only update their own customers
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Customer not found or does not belong to user'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error(' Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

module.exports = router;