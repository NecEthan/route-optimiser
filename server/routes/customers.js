const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// GET /api/customers - Get all customers
router.get('/', async (req, res) => {
  try {
    const { is_active = true, limit = 100, offset = 0 } = req.query;
    
    const query = `
      SELECT * FROM customers 
      WHERE is_active = $1 
      ORDER BY name ASC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [is_active, limit, offset]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
});


module.exports = router;
