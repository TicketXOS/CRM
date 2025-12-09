import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Cấu hình cơ sở dữ liệu
export interface DatabaseConfig {
  filename: string;
  driver: typeof sqlite3.Database;
}

// Lấy đường dẫn cơ sở dữ liệu
function getDatabasePath(): string {
  // Trong môi trường phát triển, sử dụng thư mục dự án
  if (process.env.NODE_ENV === 'development') {
    const dbDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, 'crm.db');
  }

  // Trong môi trường sản xuất, sử dụng thư mục dữ liệu người dùng
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'crm.db');
}

// Cấu hình cơ sở dữ liệu
export const dbConfig: DatabaseConfig = {
  filename: getDatabasePath(),
  driver: sqlite3.Database
};

// Phiên bản kết nối cơ sở dữ liệu
let db: Database | null = null;

// Lấy kết nối cơ sở dữ liệu
export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await open(dbConfig);

    // Bật ràng buộc khóa ngoại
    await db.exec('PRAGMA foreign_keys = ON');

    // Thiết lập tối ưu hiệu suất
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    await db.exec('PRAGMA cache_size = 1000');
    await db.exec('PRAGMA temp_store = MEMORY');

    console.log('Kết nối cơ sở dữ liệu SQLite thành công:', dbConfig.filename);
  }

  return db;
}

// Đóng kết nối cơ sở dữ liệu
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('Kết nối cơ sở dữ liệu đã đóng');
  }
}

// Khởi tạo cấu trúc bảng cơ sở dữ liệu
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // Bảng người dùng
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(20) DEFAULT 'user',
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng khách hàng
  await database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      company VARCHAR(100),
      address TEXT,
      source VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      assigned_to INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Bảng sản phẩm
  await database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      cost DECIMAL(10,2),
      category VARCHAR(50),
      sku VARCHAR(50) UNIQUE,
      stock_quantity INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng đơn hàng
  await database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      payment_status VARCHAR(20) DEFAULT 'unpaid',
      payment_method VARCHAR(50),
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Bảng mục đơn hàng
  await database.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Bảng nhật ký hệ thống
  await database.exec(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id INTEGER,
      details TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tạo chỉ mục
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at);
  `);

  // Chèn người dùng quản trị viên mặc định (nếu không tồn tại)
  const adminExists = await database.get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await database.run(`
      INSERT INTO users (username, password, email, role, status)
      VALUES (?, ?, ?, ?, ?)
    `, ['admin', hashedPassword, 'admin@crm.com', 'admin', 'active']);

    console.log('Tài khoản quản trị viên mặc định đã được tạo: admin/admin123');
  }

  console.log('Khởi tạo cấu trúc bảng cơ sở dữ liệu hoàn tất');
}

// Sao lưu cơ sở dữ liệu
export async function backupDatabase(backupPath: string): Promise<void> {
  // Tạo thư mục sao lưu
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Thực hiện sao lưu - sử dụng sao chép tệp
  const sourcePath = getDatabasePath();
  fs.copyFileSync(sourcePath, backupPath);
  console.log('Sao lưu cơ sở dữ liệu hoàn tất:', backupPath);
}

// Khôi phục cơ sở dữ liệu
export async function restoreDatabase(backupPath: string): Promise<void> {
  if (!fs.existsSync(backupPath)) {
    throw new Error('Tệp sao lưu không tồn tại');
  }

  // Đóng kết nối hiện tại
  await closeDatabase();

  // Sao chép tệp sao lưu đến vị trí cơ sở dữ liệu hiện tại
  fs.copyFileSync(backupPath, dbConfig.filename);

  // Kết nối lại cơ sở dữ liệu
  await getDatabase();
  console.log('Khôi phục cơ sở dữ liệu hoàn tất');
}
