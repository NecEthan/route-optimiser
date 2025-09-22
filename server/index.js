require('dotenv').config({ path: '../.env' });

console.log('🔍 Environment Debug:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

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

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your app password
  }
});

// Welcome email function
async function sendWelcomeEmail(email, password) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Welcome to Window Cleaner Route Optimizer!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4CAF50;">Welcome to Window Cleaner Route Optimizer! 🚀</h1>
          
          <p>Thank you for subscribing! Your account has been created successfully.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> <code style="background-color: #e0e0e0; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
          </div>
          
          <p>You can now access your account and start optimizing your window cleaning routes!</p>
          
          <div style="margin: 30px 0;">
            <a href="your-app-url-here" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Security tip:</strong> We recommend changing your password after your first login.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="color: #888; font-size: 12px;">
            This email was sent because you completed a payment on our platform. 
            If you didn't sign up, please contact our support team.
          </p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

// Export BEFORE setting up routes (important!)
module.exports = { 
  supabase: supabaseDB,
  supabaseAuth: supabaseAuth
};

// Middleware
app.use(cors());

// Stripe webhook endpoint - MUST be before express.json() middleware
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use('/webhook', express.raw({ type: 'application/json' }));

// GET endpoint for testing
app.get('/webhook', (req, res) => {
  res.json({ message: 'Webhook endpoint is ready for POST requests', status: 'ok' });
});

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Received webhook: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    let email = session.customer_email;

    if (!email && session.customer) {
      try {
        const customer = await stripe.customers.retrieve(session.customer);
        email = customer.email;
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    }

    console.log(`📧 Customer email: ${email}`);
    console.log(`💳 Customer ID: ${session.customer}`);
    console.log(`📅 Subscription ID: ${session.subscription}`);
    
    if (email) {
      try {
        // Generate a random password for the user
        const crypto = require('crypto');
        const generatedPassword = crypto.randomBytes(12).toString('hex');
        
        console.log(`🔐 Creating user account for: ${email}`);
        
        // Use Service Key to create user without confirmation email
        const { data, error } = await supabaseDB.auth.admin.createUser({
          email,
          password: generatedPassword,
          user_metadata: {
            full_name: email.split('@')[0],
            stripe_customer_id: session.customer,
            subscription_id: session.subscription,
            created_via_stripe: true
          },
          email_confirm: true // Auto-confirm the email
        });

        if (error) {
          console.error('❌ Failed to create user account:', error);
        } else {
          console.log('✅ User account created successfully!');
          console.log(`🔐 Generated password: ${generatedPassword}`);
          
          // Send welcome email with password to user
          await sendWelcomeEmail(email, generatedPassword);
        }
        
      } catch (error) {
        console.error('❌ Error creating user account:', error);
      }
    } else {
      console.log('⚠️ No email found, cannot create user account');
    }
    
    // TODO: Create user account in your database here
    // Example: await db.users.insert({ email, stripeCustomerId: session.customer, subscriptionId: session.subscription, active: true });
  }

  res.json({ received: true });
});

app.use(express.json({
  verify: (req, res, buf) => {
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
app.use('/api/user', require('./routes/user'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/accounting', require('./routes/accounting'));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Window Cleaner Route Optimizer API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /api/auth/register - Register user',
      'POST /api/auth/login - Login user',
      'GET /api/user/subscription - Get user subscription (protected)',
      'GET /api/user/profile - Get user profile (protected)',
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
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Find the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        localIP = interface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📱 Mobile access: http://${localIP}:${port}`);
  console.log(`🔐 Register: http://localhost:${port}/api/auth/register`);
});