const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Esta función nos confirmará en la terminal si la DB está conectada
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error de conexión:', err.stack);
  } else {
    console.log('✅ Base de datos conectada exitosamente');
  }
});

module.exports = pool;