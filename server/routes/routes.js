const express = require('express');
const { supabase } = require('../index');
const router = express.Router();

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
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

router.get('/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, address, latitude, longitude, phone, frequency')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length,
      user: req.user.email
    });
  } catch (error) {
    console.error('Error fetching customers for routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

router.post('/optimize', async (req, res) => {
  try {
    const { customerIds, startLocation } = req.body;

    if (!customerIds || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select customers for route optimization'
      });
    }

    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, address, latitude, longitude, phone')
      .in('id', customerIds);

    if (error) throw error;

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No customers found for the selected IDs'
      });
    }

    const optimizedRoute = customers.sort((a, b) => a.name.localeCompare(b.name));

    const googleMapsUrl = generateGoogleMapsUrl(optimizedRoute, startLocation);

    res.json({
      success: true,
      data: {
        optimizedRoute: optimizedRoute,
        googleMapsUrl: googleMapsUrl,
        totalStops: optimizedRoute.length,
        startLocation: startLocation,
        createdBy: req.user.email
      },
      message: 'Route optimized successfully!'
    });

  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize route',
      error: error.message
    });
  }
});

function generateGoogleMapsUrl(customers, startLocation) {
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  let waypoints = [];
  
  if (startLocation && startLocation.trim()) {
    waypoints.push(encodeURIComponent(startLocation.trim()));
  }
  
  customers.forEach(customer => {
    if (customer.address && customer.address.trim()) {
      waypoints.push(encodeURIComponent(customer.address.trim()));
    }
  });
  
  const url = baseUrl + waypoints.join('/') + '?travelmode=driving&dir_action=navigate';
  
  return url;
}

router.post('/save', async (req, res) => {
  try {
    const { name, customerIds, googleMapsUrl } = req.body;

    const { data: route, error } = await supabase
      .from('routes')
      .insert({
        name: name || `Route - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'planned',
        created_by: req.user.id 
      })
      .select()
      .single();

    if (error) throw error;

    if (customerIds && customerIds.length > 0) {
      const routeCustomers = customerIds.map((customerId, index) => ({
        route_id: route.id,
        customer_id: customerId,
        visit_order: index + 1,
        completed: false
      }));

      const { error: relationError } = await supabase
        .from('route_customers')
        .insert(routeCustomers);

      if (relationError) {
        console.error('Error saving route relationships:', relationError);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        route: route,
        googleMapsUrl: googleMapsUrl
      },
      message: 'Route saved successfully!'
    });

  } catch (error) {
    console.error('Error saving route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save route',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length,
      user: req.user.email
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
});

module.exports = router;