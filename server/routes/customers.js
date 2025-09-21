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
    
    const { name, email, phone, address, latitude, longitude } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name and address are required'
      });
    }

    const customerData = {
      name,
      email,
      phone,
      address,
      user_id: req.user.id, // Use authenticated user ID
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      // Remove frequency - it doesn't exist in your schema
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
    const { id, name, email, phone, address, latitude, longitude } = req.body;
    console.log('Updating customer ID:', req.params.id, 'with data:', req.body);
    console.log(id, 'id')

    // Only update fields that exist in the database schema
    const updateData = {
      name,
      email,
      phone,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      updated_at: new Date().toISOString()
    };

    console.log('Filtered update data:', updateData);

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
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
      .eq('id', req.params.id);

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