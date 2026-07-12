from alembic import op
import sqlalchemy as sa


def upgrade():
    op.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(200)
    )
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(200),
        head_user_id INTEGER
    )
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id INTEGER NOT NULL,
        department_id INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME
    )
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        department_id INTEGER NOT NULL,
        job_title VARCHAR(100) NOT NULL,
        phone VARCHAR(30),
        location VARCHAR(100),
        hire_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        is_department_head BOOLEAN DEFAULT 0,
        is_asset_manager BOOLEAN DEFAULT 0
    )
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS asset_categories (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(20) NOT NULL UNIQUE,
        description VARCHAR(200)
    )
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(150) NOT NULL,
        asset_tag VARCHAR(50) NOT NULL UNIQUE,
        serial_number VARCHAR(80) NOT NULL UNIQUE,
        category_id INTEGER NOT NULL,
        department_id INTEGER NOT NULL,
        assigned_to_user_id INTEGER,
        status VARCHAR(30) DEFAULT 'available',
        purchase_date DATE,
        warranty_end DATE,
        location VARCHAR(100) DEFAULT 'Main Office',
        value NUMERIC(10, 2) DEFAULT 0.00,
        description TEXT,
        qr_code VARCHAR(200),
        created_at DATETIME
    )
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS assets")
    op.execute("DROP TABLE IF EXISTS asset_categories")
    op.execute("DROP TABLE IF EXISTS employees")
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TABLE IF EXISTS departments")
    op.execute("DROP TABLE IF EXISTS roles")
