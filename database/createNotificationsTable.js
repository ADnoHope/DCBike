const { pool } = require('../config/database');

async function createTable() {
  const connection = await pool.getConnection();
  try {
    // Create driver_notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS driver_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_id INT NOT NULL,
        trip_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'new_trip',
        message TEXT,
        status ENUM('pending','seen','accepted','rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_driver_id (driver_id),
        INDEX idx_trip_id (trip_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ driver_notifications table created (or already exists)');

    // Create notifications table for customers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        trip_id INT,
        type VARCHAR(50) NOT NULL DEFAULT 'trip_accepted' COMMENT 'trip_accepted, trip_cancelled, etc',
        title VARCHAR(255),
        message TEXT,
        data JSON COMMENT 'Additional data like driver info, trip details',
        status VARCHAR(20) NOT NULL DEFAULT 'unread' COMMENT 'unread, read, archived',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_trip_id (trip_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ notifications table created (or already exists)');
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

createTable();
