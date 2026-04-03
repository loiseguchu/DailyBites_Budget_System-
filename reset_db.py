import pymysql

print("=" * 60)
print("🗑️  RESETTING DATABASE - DELETING EVERYTHING")
print("=" * 60)

try:
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        port=3306,
        autocommit=True
    )
    cursor = conn.cursor()
    
    cursor.execute("DROP DATABASE IF EXISTS dailybites_budget_system")
    cursor.execute("CREATE DATABASE dailybites_budget_system")
    cursor.execute("USE dailybites_budget_system")
    
    print("✅ Old database completely deleted and recreated empty!")
    print("Now run: python init_db.py")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")