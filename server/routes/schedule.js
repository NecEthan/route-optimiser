// routes/schedule.ts or in your main Express file

import express from 'express';
import { WindowCleanerOptimizationService } from '../ExpressIntegrationService';

const router = express.Router();

/**
 * 🎯 SMART ONE-BUTTON OPTIMIZATION 
 * POST /api/schedule/smart-optimize/:userId
 * 
 * Intelligent optimization that handles both first-time and returning users:
 * - First-time: Optimizes all days for the week
 * - Returning: Protects today/tomorrow, optimizes remaining days
 */
router.post('/smart-optimize/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Default work schedule (can be customized later)
    const defaultWorkSchedule = {
      monday_hours: 8,
      tuesday_hours: 8,
      wednesday_hours: 8,
      thursday_hours: 8,
      friday_hours: 8,
      saturday_hours: 4,
      sunday_hours: null
    };
    
    // Use provided work schedule or default
    const workSchedule = req.body.workSchedule || defaultWorkSchedule;
    const cleanerLocation = req.body.cleanerLocation || { lat: 51.5074, lng: -0.1278 };

    console.log(`🎯 Starting smart optimization for user: ${userId}`);

    const optimizationService = new WindowCleanerOptimizationService();

    // Call the new smart optimization endpoint
    const smartOptimizeResult = await optimizationService.smartOptimizeSchedule(
      userId,
      workSchedule,
      cleanerLocation
    );

    // Generate appropriate response message based on optimization type
    let responseMessage;
    let optimizationType;
    
    if (smartOptimizeResult.isFirstTime) {
      optimizationType = 'first-time';
      responseMessage = `🎉 Welcome! Created your first optimized schedule with ${smartOptimizeResult.summary.total_customers_scheduled} customers across ${smartOptimizeResult.summary.working_days} days. Revenue potential: £${smartOptimizeResult.summary.total_revenue.toFixed(2)}`;
    } else {
      optimizationType = 'returning-user';
      const protectedDaysText = smartOptimizeResult.protectedDates && smartOptimizeResult.protectedDates.length > 0 
        ? ` (protected: ${smartOptimizeResult.protectedDates.join(', ')})`
        : '';
      responseMessage = `🔄 Schedule updated intelligently${protectedDaysText}. Optimized ${smartOptimizeResult.summary.total_customers_scheduled} customers with £${smartOptimizeResult.summary.total_revenue.toFixed(2)} revenue potential.`;
    }

    // Extract key metrics
    const metrics = optimizationService.extractKeyMetrics(smartOptimizeResult);
    const todaysSchedule = optimizationService.getTodaysSchedule(smartOptimizeResult);

    res.json({
      success: true,
      message: responseMessage,
      optimizationType,
      isFirstTime: smartOptimizeResult.isFirstTime,
      protectedDates: smartOptimizeResult.protectedDates || [],
      data: {
        fullSchedule: smartOptimizeResult.schedule,
        todaysSchedule,
        metrics,
        summary: smartOptimizeResult.summary,
        timeSavings: smartOptimizeResult.time_savings_summary,
        unscheduledCustomers: smartOptimizeResult.unscheduled_customers,
        customersFromDatabase: smartOptimizeResult.customers_from_database
      }
    });

  } catch (error) {
    console.error('Smart optimization failed:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('No customers found')) {
      errorMessage = 'No customers found in your account. Please add some customers first before optimizing.';
    } else if (error.message.includes('Network error')) {
      errorMessage = 'Unable to connect to optimization service. Please try again in a moment.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      optimizationType: 'failed'
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

  } catch (error) {
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

  } catch (error) {
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

  } catch (error) {
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

  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer status'
    });
  }
});

export default router;