from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
from pymysql.cursors import DictCursor
from datetime import datetime

app = Flask(__name__)
# Enable CORS for the React frontend running on any port (like 8080 or 5173)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'P@ssword',
    'database': 'DailyBites_Budget_System--main',
    'port': 3306,
    'cursorclass': DictCursor,
    'autocommit': True
}

def get_db():
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print(f"DB Connection Error: {e}")
        return None

# ====================== AUTH ROUTES ======================

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    conn = get_db()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor() as cursor:
            # Login accepts either email or username in this system based on frontend input mapping to email field
            cursor.execute("SELECT * FROM users WHERE (email = %s OR username = %s) AND active = 1", (email, email))
            user = cursor.fetchone()

            if user and (str(user['password']) == password):
                # We skip hash check for simplicity as per previous setup. 
                return jsonify({
                    "id": str(user['user_id']),
                    "name": user['name'],
                    "email": user['email'],
                    "role": user['role']
                }), 200
            else:
                return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        conn.close()

# ====================== USERS ======================

@app.route("/api/users", methods=["GET"])
def get_users():
    conn = get_db()
    if not conn: return jsonify([]), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id as id, name, email, role FROM users WHERE active = 1")
            rows = cursor.fetchall()
            for r in rows:
                r['id'] = str(r['id'])
            return jsonify(rows), 200
    finally:
        conn.close()

@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO users (name, email, username, password, role, active) VALUES (%s, %s, %s, %s, %s, 1)", 
                           (data['name'], data['email'], data['email'], data['password'], data['role']))
            data['id'] = str(cursor.lastrowid)
            return jsonify(data), 201
    finally:
        conn.close()

@app.route("/api/users/<string:u_id>", methods=["DELETE"])
def delete_user(u_id):
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE user_id = %s", (u_id,))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

# ====================== TRANSACTIONS ======================

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    conn = get_db()
    if not conn: return jsonify([]), 500
    
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    'expense' as type, e.expense_id as id, e.amount, e.category, e.description, DATE_FORMAT(e.date, '%Y-%m-%d') as date, u.name as recordedBy
                FROM expenses e JOIN users u ON e.user_id = u.user_id
                UNION ALL
                SELECT 
                    'income' as type, i.income_id as id, i.amount, i.category, i.description, DATE_FORMAT(i.date, '%Y-%m-%d') as date, u.name as recordedBy
                FROM income i JOIN users u ON i.user_id = u.user_id
                ORDER BY date DESC, id DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # frontend expects IDs as string prefixes to avoid collision
            for r in rows:
                r['id'] = f"{r['type'][:3]}-{r['id']}"
                r['amount'] = float(r['amount'])
            
            return jsonify(rows), 200
    finally:
        conn.close()

@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500

    try:
        with conn.cursor() as cursor:
            # Get user ID from name
            cursor.execute("SELECT user_id FROM users WHERE name = %s", (data.get('recordedBy'),))
            user = cursor.fetchone()
            user_id = user['user_id'] if user else 1 # fallback to default

            if data['type'] == 'expense':
                cursor.execute("""
                    INSERT INTO expenses (user_id, amount, category, description, date) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, data['amount'], data['category'], data.get('description', ''), data['date']))
                inserted_id = f"exp-{cursor.lastrowid}"
            else:
                cursor.execute("""
                    INSERT INTO income (user_id, amount, category, description, date) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, data['amount'], data['category'], data.get('description', ''), data['date']))
                inserted_id = f"inc-{cursor.lastrowid}"

            data['id'] = inserted_id
            return jsonify(data), 201
    finally:
        conn.close()

@app.route("/api/transactions/<string:txn_id>", methods=["DELETE"])
def delete_transaction(txn_id):
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    
    try:
        parts = txn_id.split("-")
        if len(parts) != 2: return jsonify({"error": "Invalid ID format"}), 400
        t_type, real_id = parts[0], parts[1]
        
        with conn.cursor() as cursor:
            if t_type == "exp":
                cursor.execute("DELETE FROM expenses WHERE expense_id = %s", (real_id,))
            else:
                cursor.execute("DELETE FROM income WHERE income_id = %s", (real_id,))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

@app.route("/api/transactions/<string:txn_id>", methods=["PUT"])
def update_transaction(txn_id):
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    
    try:
        parts = txn_id.split("-")
        if len(parts) != 2: return jsonify({"error": "Invalid ID format"}), 400
        t_type, real_id = parts[0], parts[1]
        
        with conn.cursor() as cursor:
            if t_type == "exp":
                cursor.execute("""
                    UPDATE expenses 
                    SET amount=%s, category=%s, description=%s, date=%s 
                    WHERE expense_id=%s
                """, (data['amount'], data['category'], data.get('description', ''), data['date'], real_id))
            else:
                cursor.execute("""
                    UPDATE income 
                    SET amount=%s, category=%s, description=%s, date=%s 
                    WHERE income_id=%s
                """, (data['amount'], data['category'], data.get('description', ''), data['date'], real_id))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

# ====================== BUDGETS ======================

@app.route("/api/budgets", methods=["GET"])
def get_budgets():
    conn = get_db()
    if not conn: return jsonify([]), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    b.budget_id as id, b.category, b.limit_amount as allocated, b.month,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE e.category = b.category AND DATE_FORMAT(e.date, '%Y-%m') = b.month) as spent,
                    b.active as enabled
                FROM budgets b
            """)
            rows = cursor.fetchall()
            for r in rows:
                r['id'] = f"bud-{r['id']}"
                r['allocated'] = float(r['allocated'])
                r['spent'] = float(r['spent'])
                r['enabled'] = bool(r['enabled'])
            return jsonify(rows), 200
    finally:
        conn.close()

@app.route("/api/budgets", methods=["POST"])
def add_budget():
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO budgets (category, limit_amount, month) VALUES (%s, %s, %s)", 
                           (data['category'], data['allocated'], data['month']))
            data['id'] = f"bud-{cursor.lastrowid}"
            data['spent'] = 0
            data['enabled'] = True
            return jsonify(data), 201
    finally:
        conn.close()

@app.route("/api/budgets/<string:bud_id>", methods=["PUT"])
def update_budget(bud_id):
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        real_id = bud_id.replace("bud-", "")
        with conn.cursor() as cursor:
            # Update allocated amount and/or active state
            if 'allocated' in data:
                cursor.execute("UPDATE budgets SET limit_amount = %s WHERE budget_id = %s", (data['allocated'], real_id))
            if 'enabled' in data:
                cursor.execute("UPDATE budgets SET active = %s WHERE budget_id = %s", (data['enabled'], real_id))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

@app.route("/api/budgets/<string:bud_id>", methods=["DELETE"])
def delete_budget(bud_id):
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        real_id = bud_id.replace("bud-", "")
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM budgets WHERE budget_id = %s", (real_id,))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

# ====================== CATEGORIES ======================

@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db()
    if not conn: return jsonify([]), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT c.category_id, c.name, c.type, c.active as budgetEnabled, c.staff_visible,
                       (SELECT limit_amount FROM budgets b WHERE b.category = c.name ORDER BY budget_id DESC LIMIT 1) as budgetAmount
                FROM categories c
            """)
            rows = cursor.fetchall()
            for r in rows:
                r['id'] = f"cat-{r['category_id']}"
                r['budgetEnabled'] = bool(r['budgetEnabled'])
                r['staffVisible'] = bool(r['staff_visible']) if r['staff_visible'] is not None else True
                r['budgetAmount'] = float(r['budgetAmount']) if r['budgetAmount'] is not None else None
            return jsonify(rows), 200
    finally:
        conn.close()

@app.route("/api/categories", methods=["POST"])
def add_category():
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO categories (name, type, active, staff_visible) VALUES (%s, %s, %s, %s)", 
                           (data['name'], data['type'], 1, data.get('staffVisible', True)))
            cat_id = cursor.lastrowid
            
            budget_amount = data.get('budgetAmount')
            if budget_amount is not None and str(budget_amount).strip() != '':
                current_month = datetime.now().strftime("%Y-%m")
                try:
                    cursor.execute("INSERT INTO budgets (category, limit_amount, month) VALUES (%s, %s, %s)",
                                   (data['name'], budget_amount, current_month))
                except Exception as e:
                    print("Could not create initial budget:", e)

            data['id'] = f"cat-{cat_id}"
            data['budgetEnabled'] = True
            data['staffVisible'] = data.get('staffVisible', True)
            return jsonify(data), 201
    finally:
        conn.close()

@app.route("/api/categories/<string:cat_id>", methods=["PUT"])
def update_category(cat_id):
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        real_id = cat_id.replace("cat-", "")
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM categories WHERE category_id = %s", (real_id,))
            old_cat = cursor.fetchone()
            old_name = old_cat['name'] if old_cat else None
            new_name = data['name']
            
            cursor.execute("UPDATE categories SET name=%s, type=%s, staff_visible=%s WHERE category_id=%s",
                           (new_name, data['type'], data.get('staffVisible', True), real_id))
                           
            if old_name and old_name != new_name:
                cursor.execute("UPDATE expenses SET category=%s WHERE category=%s", (new_name, old_name))
                cursor.execute("UPDATE income SET category=%s WHERE category=%s", (new_name, old_name))
                cursor.execute("UPDATE budgets SET category=%s WHERE category=%s", (new_name, old_name))

            budget_amount = data.get('budgetAmount')
            current_month = datetime.now().strftime("%Y-%m")
            if budget_amount is not None and str(budget_amount).strip() != '':
                cursor.execute("""
                    INSERT INTO budgets (category, limit_amount, month) 
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE limit_amount = %s
                """, (new_name, budget_amount, current_month, budget_amount))
            elif 'budgetAmount' in data:
                # If budgetAmount is provided as empty string or null, remove it for the current month
                cursor.execute("DELETE FROM budgets WHERE category=%s AND month=%s", (new_name, current_month))
                
            return jsonify({"success": True}), 200
    finally:
        conn.close()

@app.route("/api/categories/<string:cat_id>", methods=["DELETE"])
def delete_category(cat_id):
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        real_id = cat_id.replace("cat-", "")
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM categories WHERE category_id = %s", (real_id,))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

@app.route("/api/categories/<string:cat_id>/toggle", methods=["PUT"])
def toggle_category_budget(cat_id):
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        real_id = cat_id.replace("cat-", "")
        with conn.cursor() as cursor:
            cursor.execute("UPDATE categories SET active = NOT active WHERE category_id = %s", (real_id,))
            return jsonify({"success": True}), 200
    finally:
        conn.close()

# ====================== AUDIT LOGS ======================

@app.route("/api/audit", methods=["GET"])
def get_audit():
    conn = get_db()
    if not conn: return jsonify([]), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT a.log_id as id, a.action, a.details, DATE_FORMAT(a.timestamp, '%Y-%m-%dT%T.000Z') as timestamp, u.name as performedBy
                FROM audit_logs a LEFT JOIN users u ON a.user_id = u.user_id
                ORDER BY a.timestamp DESC LIMIT 100
            """)
            rows = cursor.fetchall()
            for r in rows:
                r['id'] = f"audit-{r['id']}"
                if not r['performedBy']: r['performedBy'] = "System"
            return jsonify(rows), 200
    finally:
        conn.close()

@app.route("/api/audit", methods=["POST"])
def add_audit():
    data = request.json
    conn = get_db()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE name = %s", (data.get('performedBy'),))
            user = cursor.fetchone()
            user_id = user['user_id'] if user else None
            
            cursor.execute("INSERT INTO audit_logs (user_id, action, details) VALUES (%s, %s, %s)",
                           (user_id, data['action'], data['details']))
            
            data['id'] = f"audit-{cursor.lastrowid}"
            data['timestamp'] = datetime.utcnow().isoformat()
            return jsonify(data), 201
    finally:
        conn.close()

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)
