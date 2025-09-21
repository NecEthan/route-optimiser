require('dotenv').config({ path: '../.env' });

console.log('🔍 Environment Debug:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Create Supabase clients
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseDB = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test that clients are created
console.log('🔌 Supabase Auth client created:', !!supabaseAuth);
console.log('🔌 Supabase DB client created:', !!supabaseDB);

// Export BEFORE setting up routes (important!)
module.exports = { 
  supabase: supabaseDB,
  supabaseAuth: supabaseAuth
};

// Middleware
app.use(cors());

// Custom JSON middleware that handles empty bodies
app.use(express.json({
  verify: (req, res, buf) => {
    // Store raw body for debugging if needed
    req.rawBody = buf;
  }
}));

// JSON error handler middleware
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ JSON Parse Error:', error.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      error: 'Please check your request body format'
    });
  }
  next(error);
});

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check (uses database client)
app.get('/health', async (req, res) => {
  try {
    const { data, error, count } = await supabaseDB
      .from('customers')
      .select('id', { count: 'exact', head: true });
    
    if (error) throw error;
    
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      customerCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/jobs', require('./routes/jobs'));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Window Cleaner Route Optimizer API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /api/auth/register - Register user',
      'POST /api/auth/login - Login user',
      'GET /api/customers - Get customers (protected)',
      'GET /api/routes - Route optimization (protected)',
      'GET /api/accounting - Get accounting data (protected)',
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📱 Mobile access: http://192.168.0.79:${port}`);
  console.log(`🔐 Register: http://localhost:${port}/api/auth/register`);
});