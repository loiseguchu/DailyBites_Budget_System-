import pymysql

print("=" * 60)
print("🚀 CREATING FRESH DATABASE + DEFAULT USERS")
print("=" * 60)

try:
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='P@ssword',
        port=3306,
        autocommit=True
    )
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS `DailyBites_Budget_System--main`")
    cursor.execute("USE `DailyBites_Budget_System--main`")

    # Create all tables
    cursor.execute("""
        CREATE TABLE users (
            user_id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'staff') DEFAULT 'staff',
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE expenses (
            expense_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE income (
            income_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE budgets (
            budget_id INT PRIMARY KEY AUTO_INCREMENT,
            category VARCHAR(50) NOT NULL,
            limit_amount DECIMAL(12,2) NOT NULL,
            month VARCHAR(7) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_budget (category, month)
        )
    """)

    cursor.execute("""
        CREATE TABLE categories (
            category_id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) UNIQUE NOT NULL,
            type ENUM('income', 'expense') NOT NULL,
            active BOOLEAN DEFAULT TRUE
        )
    """)

    cursor.execute("""
        CREATE TABLE audit_logs (
            log_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
        )
    """)

    # Default users (matching your GitHub README)
    users = [
        ('Manager', 'manager@dailybite.co.ke', 'manager', 'admin123', 'admin'),
        ('Administrator', 'admin@dailybite.co.ke', 'admin', 'admin123', 'admin'),
        ('James Kariuki', 'james@dailybite.co.ke', 'james', 'staff123', 'staff'),
        ('Mary Wanjiku', 'mary@dailybite.co.ke', 'mary', 'staff123', 'staff')
    ]

    for name, email, username, password, role in users:
        cursor.execute("""
            INSERT INTO users (name, email, username, password, role, active)
            VALUES (%s, %s, %s, %s, %s, 1)
        """, (name, email, username, password, role))

    # Default categories
    categories = [
        ('Utilities', 'expense'), ('Shopping', 'expense'), ('Rent', 'expense'),
        ('Groceries', 'expense'), ('Transport', 'expense'), ('Healthcare', 'expense'),
        ('Entertainment', 'expense'), ('Salary', 'income'), ('Sales', 'income'),
        ('Freelance', 'income'), ('Tips', 'income')
    ]
    for name, cat_type in categories:
        cursor.execute("INSERT IGNORE INTO categories (name, type, active) VALUES (%s, %s, 1)", (name, cat_type))

    print("✅ Database created successfully with default users!")
    print("🔑 Login credentials:")
    print("   Admin → manager@dailybite.co.ke / admin123   or   admin / admin123")
    print("   Staff  → james / staff123   or   mary / staff123")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")