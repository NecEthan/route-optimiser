// routes/schedule.ts or in your main Express file

import express from 'express';
import { WindowCleanerOptimizationService } from '../ExpressIntegrationService';

const router = express.Router();

/**
 * 🎯 GENERATE & SAVE OPTIMIZED SCHEDULE
 * POST /api/schedule/optimize/:userId
 * 
 * Sends work schedule to FastAPI → Gets optimized schedule → Saves to DB
 */
router.post('/optimize/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { workSchedule, cleanerLocation } = req.body;

    // Validate input
    if (!workSchedule) {
      return res.status(400).json({
        success: false,
        error: 'Work schedule is required'
      });
    }

    const optimizationService = new WindowCleanerOptimizationService();

    // Generate optimized schedule via FastAPI (this saves to DB automatically)
    const optimizedSchedule = await optimizationService.generateOptimizedScheduleFromDatabase(
      userId,
      workSchedule,
      cleanerLocation
    );

    // Extract key metrics
    const metrics = optimizationService.extractKeyMetrics(optimizedSchedule);
    const todaysSchedule = optimizationService.getTodaysSchedule(optimizedSchedule);

    res.json({
      success: true,
      message: 'Schedule optimized and saved successfully',
      data: {
        fullSchedule: optimizedSchedule.schedule,
        todaysSchedule,
        metrics,
        savedToDatabase: true
      }
    });

  } catch (error: any) {
    console.error('Schedule optimization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 📅 GET TODAY'S SCHEDULE FROM DATABASE
 * GET /api/schedule/today/:userId
 * 
 * Retrieves today's customers from the saved schedule in your database
 */
router.get('/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Query your database for today's route
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const todaysRoute = await db.query(`
      SELECT 
        r.id as route_id,
        r.date,
        r.day_name,
        r.estimated_duration,
        r.estimated_revenue,
        r.max_work_hours,
        r.status,
        json_agg(
          json_build_object(
            'customer_id', rj.customer_id,
            'customer_name', rj.customer_name,
            'customer_address', rj.customer_address,
            'visit_order', rj.visit_order,
            'estimated_duration', rj.estimated_duration,
            'price', rj.price,
            'status', rj.status
          ) ORDER BY rj.visit_order
        ) as customers
      FROM routes r
      LEFT JOIN route_jobs rj ON r.id = rj.route_id
      WHERE r.user_id = $1 AND r.date = $2
      GROUP BY r.id, r.date, r.day_name, r.estimated_duration, r.estimated_revenue, r.max_work_hours, r.status
    `, [userId, today]);

    if (todaysRoute.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No schedule found for today. Please generate an optimized schedule first.',
        date: today
      });
    }

    const route = todaysRoute.rows[0];

    res.json({
      success: true,
      date: today,
      dayName: route.day_name,
      totalCustomers: route.customers.length,
      estimatedDuration: route.estimated_duration,
      estimatedRevenue: route.estimated_revenue,
      maxWorkHours: route.max_work_hours,
      customers: route.customers.filter(c => c.customer_id !== null), // Remove null entries
      status: route.status
    });

  } catch (error: any) {
    console.error('Error fetching today\'s schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve today\'s schedule'
    });
  }
});

/**
 * 📊 GET FULL WEEK SCHEDULE FROM DATABASE
 * GET /api/schedule/week/:userId
 * 
 * Retrieves the entire week's schedule from your database
 */
router.get('/week/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the date range for this week (next 7 days from today)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    const weekSchedule = await db.query(`
      SELECT 
        r.id as route_id,
        r.date,
        r.day_name,
        r.estimated_duration,
        r.estimated_revenue,
        r.max_work_hours,
        r.status,
        r.created_at,
        COALESCE(
          json_agg(
            CASE WHEN rj.customer_id IS NOT NULL THEN
              json_build_object(
                'customer_id', rj.customer_id,
                'customer_name', rj.customer_name,
                'customer_address', rj.customer_address,
                'visit_order', rj.visit_order,
                'estimated_duration', rj.estimated_duration,
                'price', rj.price,
                'status', rj.status
              )
            END ORDER BY rj.visit_order
          ) FILTER (WHERE rj.customer_id IS NOT NULL),
          '[]'::json
        ) as customers
      FROM routes r
      LEFT JOIN route_jobs rj ON r.id = rj.route_id
      WHERE r.user_id = $1 
        AND r.date >= $2 
        AND r.date < $3
      GROUP BY r.id, r.date, r.day_name, r.estimated_duration, r.estimated_revenue, r.max_work_hours, r.status, r.created_at
      ORDER BY r.date
    `, [userId, today.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

    if (weekSchedule.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No schedule found for this week. Please generate an optimized schedule first.'
      });
    }

    // Calculate summary statistics
    const totalRevenue = weekSchedule.rows.reduce((sum, day) => sum + parseFloat(day.estimated_revenue || 0), 0);
    const totalDuration = weekSchedule.rows.reduce((sum, day) => sum + parseInt(day.estimated_duration || 0), 0);
    const totalCustomers = weekSchedule.rows.reduce((sum, day) => sum + (day.customers?.length || 0), 0);
    const workingDays = weekSchedule.rows.filter(day => day.customers?.length > 0).length;

    res.json({
      success: true,
      weekSummary: {
        totalRevenue,
        totalDurationMinutes: totalDuration,
        totalDurationHours: Math.round((totalDuration / 60) * 10) / 10,
        totalCustomers,
        workingDays,
        averageRevenuePerDay: workingDays > 0 ? Math.round((totalRevenue / workingDays) * 100) / 100 : 0
      },
      schedule: weekSchedule.rows.map(day => ({
        date: day.date,
        dayName: day.day_name,
        customersCount: day.customers?.length || 0,
        estimatedDuration: day.estimated_duration,
        estimatedRevenue: day.estimated_revenue,
        maxWorkHours: day.max_work_hours,
        customers: day.customers || [],
        status: day.status,
        lastGenerated: day.created_at
      }))
    });

  } catch (error: any) {
    console.error('Error fetching week schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve week schedule'
    });
  }
});

/**
 * 🗓️ GET SCHEDULE FOR SPECIFIC DATE
 * GET /api/schedule/date/:userId/:date
 * 
 * Retrieves schedule for a specific date (YYYY-MM-DD format)
 */
router.get('/date/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const daySchedule = await db.query(`
      SELECT 
        r.id as route_id,
        r.date,
        r.day_name,
        r.estimated_duration,
        r.estimated_revenue,
        r.max_work_hours,
        r.status,
        r.created_at,
        COALESCE(
          json_agg(
            CASE WHEN rj.customer_id IS NOT NULL THEN
              json_build_object(
                'customer_id', rj.customer_id,
                'customer_name', rj.customer_name,
                'customer_address', rj.customer_address,
                'visit_order', rj.visit_order,
                'estimated_duration', rj.estimated_duration,
                'price', rj.price,
                'status', rj.status
              )
            END ORDER BY rj.visit_order
          ) FILTER (WHERE rj.customer_id IS NOT NULL),
          '[]'::json
        ) as customers
      FROM routes r
      LEFT JOIN route_jobs rj ON r.id = rj.route_id
      WHERE r.user_id = $1 AND r.date = $2
      GROUP BY r.id, r.date, r.day_name, r.estimated_duration, r.estimated_revenue, r.max_work_hours, r.status, r.created_at
    `, [userId, date]);

    if (daySchedule.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No schedule found for ${date}`,
        date
      });
    }

    const day = daySchedule.rows[0];

    res.json({
      success: true,
      date: day.date,
      dayName: day.day_name,
      customersCount: day.customers?.length || 0,
      estimatedDuration: day.estimated_duration,
      estimatedRevenue: day.estimated_revenue,
      maxWorkHours: day.max_work_hours,
      customers: day.customers || [],
      status: day.status,
      lastGenerated: day.created_at
    });

  } catch (error: any) {
    console.error('Error fetching date schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve schedule for date'
    });
  }
});

/**
 * 🔄 UPDATE CUSTOMER STATUS IN ROUTE
 * PUT /api/schedule/customer/:routeId/:customerId/status
 * 
 * Update the status of a customer in a route (e.g., completed, skipped, rescheduled)
 */
router.put('/customer/:routeId/:customerId/status', async (req, res) => {
  try {
    const { routeId, customerId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['scheduled', 'completed', 'skipped', 'rescheduled', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateResult = await db.query(`
      UPDATE route_jobs 
      SET 
        status = $1,
        notes = $2,
        updated_at = NOW()
      WHERE route_id = $3 AND customer_id = $4
      RETURNING *
    `, [status, notes || null, routeId, customerId]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found in route'
      });
    }

    res.json({
      success: true,
      message: `Customer status updated to ${status}`,
      customer: updateResult.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating customer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer status'
    });
  }
});

export default router;