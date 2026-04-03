from flask import Flask, render_template, request, redirect, url_for, session, flash
import pymysql
from pymysql.cursors import DictCursor
from werkzeug.security import check_password_hash
from functools import wraps
from datetime import datetime

app = Flask(__name__)
app.secret_key = "dailybite-secret-key-2026"

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dailybites_budget_system',
    'port': 3306,
    'cursorclass': DictCursor,
    'autocommit': True
}

def get_db():
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print(f"DB Error: {e}")
        return None

# Startup test
print("\n" + "="*70)
print("🚀 Daily Bite Café Budget System - Flask Backend")
print("="*70)
if get_db():
    print("✅ Connected to XAMPP MySQL successfully!")
print("="*70 + "\n")

# Decorators
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login first', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('role') != 'admin':
            flash('Admin access required', 'danger')
            return redirect(url_for('staff_dashboard'))
        return f(*args, **kwargs)
    return decorated

# ====================== LOGIN ======================
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        login_input = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        if not login_input or not password:
            return render_template("login.html", error="Please enter username or email")

        conn = get_db()
        if not conn:
            return render_template("login.html", error="Database connection failed")

        try:
            cursor = conn.cursor()
            if '@' in login_input:
                cursor.execute("SELECT * FROM users WHERE email = %s AND role = 'admin' AND active = 1", (login_input,))
            else:
                cursor.execute("SELECT * FROM users WHERE username = %s AND active = 1", (login_input,))

            user = cursor.fetchone()
            cursor.close()
            conn.close()

            if user and (check_password_hash(str(user['password']), password) or str(user['password']) == password):
                session['user_id'] = user['user_id']
                session['username'] = user['username']
                session['role'] = user['role']
                session['name'] = user.get('name', user['username'])

                flash(f'Welcome back, {session["name"]}!', 'success')

                if user['role'] == 'admin':
                    return redirect(url_for('admin_dashboard'))
                return redirect(url_for('staff_dashboard'))
            else:
                return render_template("login.html", error="Invalid credentials")
        except Exception as e:
            print(f"Login error: {e}")
            return render_template("login.html", error="Database error")

    return render_template("login.html")

# ====================== BASIC ROUTES ======================
@app.route("/")
def home():
    if 'user_id' in session:
        return redirect(url_for('admin_dashboard') if session.get('role') == 'admin' else url_for('staff_dashboard'))
    return redirect(url_for('login'))

@app.route("/logout")
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

# You can add the rest of the routes (admin_dashboard, staff_dashboard, transactions, budgets, etc.) later.
# For now this gives you a working login + DB connection.

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)
