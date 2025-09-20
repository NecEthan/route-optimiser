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

router.get('/expenses', async (req, res) => {
  try {
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
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

router.get('/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
});

router.post('/expenses/', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
        error: 'Please provide expense data in the request body'
      });
    }

    const { category, amount, expense_date, notes } = req.body;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category and amount are required'
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const expenseData = {
      user_id: req.user.id,
      category: category.trim(),
      amount: parseFloat(amount),
      notes: notes || null
    };

    if (expense_date) {
      expenseData.expense_date = expense_date;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) {
      console.error('Add expense error:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: data
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: error.message
    });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, expense_date, notes } = req.body;

    // Validation
    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category and amount are required'
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const updateData = {
      category: category.trim(),
      amount: parseFloat(amount),
      notes: notes?.trim() || null
    };

    if (expense_date) {
      updateData.expense_date = expense_date;
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
});

// DELETE /api/accounting/expenses/:id - Delete expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      data: data
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
});

// GET /api/accounting/expenses/categories - Get expense categories
router.get('/expenses/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('category')
      .eq('user_id', req.user.id)
      .not('category', 'is', null);

    if (error) {
      throw error;
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))].sort();

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories',
      error: error.message
    });
  }
});

// GET /api/accounting/expenses/summary - Get expense summary
router.get('/expenses/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let query = supabase
      .from('expenses')
      .select('amount, category, expense_date')
      .eq('user_id', req.user.id);

    if (from_date) {
      query = query.gte('expense_date', from_date);
    }

    if (to_date) {
      query = query.lte('expense_date', to_date);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate summary statistics
    const totalAmount = data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalCount = data.length;
    
    // Group by category
    const categoryBreakdown = data.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += parseFloat(expense.amount);
      acc[category].count += 1;
      return acc;
    }, {});

    // Sort categories by total amount
    const sortedCategories = Object.entries(categoryBreakdown)
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        count: stats.count,
        percentage: totalAmount > 0 ? (stats.total / totalAmount * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      data: {
        totalAmount: totalAmount.toFixed(2),
        totalCount,
        averageAmount: totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00',
        categoryBreakdown: sortedCategories,
        dateRange: {
          from: from_date || null,
          to: to_date || null
        }
      }
    });
  } catch (error) {
    console.error('Get expenses summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses summary',
      error: error.message
    });
  }
});

// GET /api/accounting/expenses/monthly - Get monthly expense totals
router.get('/expenses/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const { data, error } = await supabase
      .from('expenses')
      .select('amount, expense_date, category')
      .eq('user_id', req.user.id)
      .gte('expense_date', `${year}-01-01`)
      .lt('expense_date', `${parseInt(year) + 1}-01-01`)
      .order('expense_date');

    if (error) {
      throw error;
    }

    // Group by month
    const monthlyData = data.reduce((acc, expense) => {
      const month = new Date(expense.expense_date).getMonth(); // 0-11
      const monthKey = new Date(year, month).toISOString().slice(0, 7); // YYYY-MM format
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0,
          categories: {}
        };
      }
      
      acc[monthKey].total += parseFloat(expense.amount);
      acc[monthKey].count += 1;
      
      const category = expense.category || 'Uncategorized';
      if (!acc[monthKey].categories[category]) {
        acc[monthKey].categories[category] = 0;
      }
      acc[monthKey].categories[category] += parseFloat(expense.amount);
      
      return acc;
    }, {});

    // Convert to array and sort by month
    const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: monthlyArray,
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Get monthly expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly expenses',
      error: error.message
    });
  }
});

// Payments

router.get('/payments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length,
      user: req.user.email
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});


// POST /api/accounting/payments - Create new payment
router.post('/payments', async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
        error: 'Please provide payment data in the request body'
      });
    }

    const { amount, payment_date, method, notes, customer_id, job_id } = req.body;

    // Validation
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Validate method if provided
    const validMethods = ['cash', 'card', 'bank'];
    if (method && !validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Method must be one of: cash, card, bank'
      });
    }

    const paymentData = {
      user_id: req.user.id,
      amount: parseFloat(amount),
      method: method || 'cash',
      notes: notes?.trim() || null,
      customer_id: customer_id || null,
      job_id: job_id || null
    };

    // Add payment_date if provided, otherwise use database default (NOW())
    if (payment_date) {
      paymentData.payment_date = payment_date;
    }

    console.log('💰 Adding payment:', paymentData);

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone
        ),
        jobs:job_id (
          id,
          description,
          address,
          status
        )
      `)
      .single();

    if (error) {
      console.error('Add payment error:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      data: data
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment',
      error: error.message
    });
  }
});

// PUT /api/accounting/payments/:id - Update payment
router.put('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, method, notes, customer_id, job_id } = req.body;

    // Validation
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Validate method if provided
    const validMethods = ['cash', 'card', 'bank'];
    if (method && !validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Method must be one of: cash, card, bank'
      });
    }

    const updateData = {
      amount: parseFloat(amount),
      method: method || 'cash',
      notes: notes?.trim() || null,
      customer_id: customer_id || null,
      job_id: job_id || null
    };

    if (payment_date) {
      updateData.payment_date = payment_date;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone
        ),
        jobs:job_id (
          id,
          description,
          address,
          status
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
});

// DELETE /api/accounting/payments/:id - Delete payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully',
      data: data
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
});

// GET /api/accounting/payments/methods - Get payment methods
router.get('/payments/methods', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('method')
      .eq('user_id', req.user.id)
      .not('method', 'is', null);

    if (error) {
      throw error;
    }

    // Get unique methods
    const methods = [...new Set(data.map(item => item.method))].sort();

    res.json({
      success: true,
      data: methods,
      count: methods.length
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
});

// GET /api/accounting/payments/summary - Get payments summary
router.get('/payments/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let query = supabase
      .from('payments')
      .select('amount, method, payment_date')
      .eq('user_id', req.user.id);

    if (from_date) {
      query = query.gte('payment_date', from_date);
    }

    if (to_date) {
      query = query.lte('payment_date', to_date);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate summary statistics
    const totalAmount = data.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const totalCount = data.length;
    
    // Group by payment method
    const methodBreakdown = data.reduce((acc, payment) => {
      const method = payment.method || 'Unknown';
      if (!acc[method]) {
        acc[method] = { total: 0, count: 0 };
      }
      acc[method].total += parseFloat(payment.amount);
      acc[method].count += 1;
      return acc;
    }, {});

    // Sort methods by total amount
    const sortedMethods = Object.entries(methodBreakdown)
      .map(([method, stats]) => ({
        method,
        total: stats.total,
        count: stats.count,
        percentage: totalAmount > 0 ? (stats.total / totalAmount * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      data: {
        totalAmount: totalAmount.toFixed(2),
        totalCount,
        averageAmount: totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00',
        methodBreakdown: sortedMethods,
        dateRange: {
          from: from_date || null,
          to: to_date || null
        }
      }
    });
  } catch (error) {
    console.error('Get payments summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments summary',
      error: error.message
    });
  }
});

// GET /api/accounting/payments/monthly - Get monthly payment totals
router.get('/payments/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date, method')
      .eq('user_id', req.user.id)
      .gte('payment_date', `${year}-01-01`)
      .lt('payment_date', `${parseInt(year) + 1}-01-01`)
      .order('payment_date');

    if (error) {
      throw error;
    }

    // Group by month
    const monthlyData = data.reduce((acc, payment) => {
      const month = new Date(payment.payment_date).getMonth(); // 0-11
      const monthKey = new Date(year, month).toISOString().slice(0, 7); // YYYY-MM format
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0,
          methods: {}
        };
      }
      
      acc[monthKey].total += parseFloat(payment.amount);
      acc[monthKey].count += 1;
      
      const method = payment.method || 'Unknown';
      if (!acc[monthKey].methods[method]) {
        acc[monthKey].methods[method] = 0;
      }
      acc[monthKey].methods[method] += parseFloat(payment.amount);
      
      return acc;
    }, {});

    // Convert to array and sort by month
    const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: monthlyArray,
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Get monthly payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly payments',
      error: error.message
    });
  }
});

// GET /api/accounting/payments/by-customer/:customer_id - Get payments for specific customer
router.get('/payments/by-customer/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone
        ),
        jobs:job_id (
          id,
          description,
          address,
          status
        )
      `)
      .eq('user_id', req.user.id)
      .eq('customer_id', customer_id)
      .order('payment_date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      customer_id
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer payments',
      error: error.message
    });
  }
});

// GET /api/accounting/payments/by-job/:job_id - Get payments for specific job
router.get('/payments/by-job/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone
        ),
        jobs:job_id (
          id,
          description,
          address,
          status
        )
      `)
      .eq('user_id', req.user.id)
      .eq('job_id', job_id)
      .order('payment_date', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      job_id
    });
  } catch (error) {
    console.error('Get job payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job payments',
      error: error.message
    });
  }
});



module.exports = router;