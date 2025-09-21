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
      .from('jobs')
      .select('*')
      .order('updated_at', { ascending: false });


    if (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }

    console.log('✅ Sending jobs count:', data.length);
    res.json({
      success: true,
      data: data,
      count: data.length,
      user: req.user.email
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// GET /api/jobs/:id - Get single job
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      job: data
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
});

// POST /api/jobs - Create new job
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/jobs - Received data:', req.body);
    console.log('User from token:', req.user);
    
    const { 
      customer_id, 
      description, 
      frequency, 
      price, 
      estimated_duration,
    } = req.body;

    // Validate required fields
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'customer_id is required'
      });
    }
    
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'description is required'
      });
    }
    
    if (!price || isNaN(parseFloat(price))) {
      return res.status(400).json({
        success: false,
        message: 'valid price is required'
      });
    }

    // Verify customer exists and belongs to user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('user_id', req.user.id)
      .single();

    if (customerError || !customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID or customer does not belong to user'
      });
    }

    const jobData = {
      customer_id,
      user_id: req.user.id, // Use authenticated user ID
      description: description.trim(),
      price: parseFloat(price),
      frequency: frequency || 'monthly',
      estimated_duration: estimated_duration ? parseInt(estimated_duration) : null
    };
    
    console.log('Inserting job data:', jobData);

    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create job',
        error: error.message
      });
    }

    console.log('Job created successfully:', data);

    res.status(201).json({
      success: true,
      job: data,
      message: 'Job created successfully'
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/jobs/:id - Update job
router.put('/:id', async (req, res) => {
  try {
    const { 
      description, 
      price, 
      frequency, 
      estimated_duration,
      active
    } = req.body;

    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to user'
      });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration ? parseInt(estimated_duration) : null;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      job: data,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', async (req, res) => {
  try {
    // Verify job exists and belongs to user before deleting
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to user'
      });
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: `Job "${existingJob.title}" deleted successfully`
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

// POST /api/jobs/:id/complete - Mark job as complete
router.post('/:id/complete', async (req, res) => {
  try {
    const { notes, completed_at } = req.body;
    const completionTime = completed_at || new Date().toISOString();

    // Verify job exists and belongs to user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, completed')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to user'
      });
    }

    if (existingJob.completed) {
      return res.status(400).json({
        success: false,
        message: 'Job is already marked as complete'
      });
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        completed: true,
        completed_at: completionTime,
        status: 'completed',
        completion_notes: notes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .single();

    if (error) throw error;

    // Log completion to job_history table if it exists
    try {
      await supabase
        .from('job_history')
        .insert({
          job_id: req.params.id,
          user_id: req.user.id,
          action: 'completed',
          notes: notes || '',
          created_at: completionTime
        });
    } catch (historyError) {
      console.warn('Could not log to job_history:', historyError.message);
    }

    res.json({
      success: true,
      job: data,
      message: `Job "${existingJob.title}" marked as complete`
    });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as complete',
      error: error.message
    });
  }
});

// POST /api/jobs/:id/incomplete - Mark job as incomplete
router.post('/:id/incomplete', async (req, res) => {
  try {
    // Verify job exists and belongs to user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, completed')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to user'
      });
    }

    if (!existingJob.completed) {
      return res.status(400).json({
        success: false,
        message: 'Job is already marked as incomplete'
      });
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        completed: false,
        completed_at: null,
        status: 'pending',
        completion_notes: '',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .single();

    if (error) throw error;

    // Log to job_history table if it exists
    try {
      await supabase
        .from('job_history')
        .insert({
          job_id: req.params.id,
          user_id: req.user.id,
          action: 'marked_incomplete',
          created_at: new Date().toISOString()
        });
    } catch (historyError) {
      console.warn('Could not log to job_history:', historyError.message);
    }

    res.json({
      success: true,
      job: data,
      message: `Job "${existingJob.title}" marked as incomplete`
    });
  } catch (error) {
    console.error('Mark incomplete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as incomplete',
      error: error.message
    });
  }
});

// GET /api/jobs/:id/history - Get job completion history
router.get('/:id/history', async (req, res) => {
  try {
    // Verify job exists and belongs to user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to user'
      });
    }

    const { data, error } = await supabase
      .from('job_history')
      .select('*')
      .eq('job_id', req.params.id)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist, return empty array
      console.warn('Job history table may not exist:', error.message);
      return res.json({
        success: true,
        history: [],
        message: 'Job history not available'
      });
    }

    res.json({
      success: true,
      history: data || [],
      job_title: existingJob.title
    });
  } catch (error) {
    console.error('Get job history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job history',
      error: error.message
    });
  }
});

// GET /api/jobs/today - Get today's jobs
router.get('/schedule/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('user_id', req.user.id)
      .eq('scheduled_date', today)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s jobs:', error);
      throw error;
    }

    res.json({
      success: true,
      jobs: data,
      count: data.length,
      date: today
    });
  } catch (error) {
    console.error('Get today\'s jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s jobs',
      error: error.message
    });
  }
});

module.exports = router;