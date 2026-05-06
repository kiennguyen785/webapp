from flask import Flask, jsonify, render_template, request
import pyodbc

app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend"
)

def get_connection():
    return pyodbc.connect(
        "DRIVER={SQL Server};"
        "SERVER=ADMIN\\SQLEXPRESS;"
        "DATABASE=DA2;"
        "UID=sa;"
        "PWD=123123;"
        "TrustServerCertificate=yes;"
    )

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/products")
def get_products():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT item_id, product_name, main_category, price, image_url, quantity
        FROM products_real
    """)

    rows = cursor.fetchall()
    conn.close()

    data = []
    for row in rows:
        data.append({
            "item_id": row[0],
            "name": row[1],
            "category": row[2],
            "price": row[3],
            "image": row[4],
            "quantity": row[5]
        })

    return jsonify(data)
@app.route("/product/<int:item_id>")
def get_product_detail(item_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT item_id, product_name, main_category, price, description, image_url
        FROM products_real
        WHERE item_id = ?
    """, item_id)

    row = cursor.fetchone()
    conn.close()

    if row is None:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({
        "item_id": row[0],
        "name": row[1],
        "category": row[2],
        "price": row[3],
        "description": row[4],
        "image": row[5]
    })

@app.route("/api/register", methods=["POST"])
def register_api():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"status": "error", "message": "Vui lòng nhập đầy đủ thông tin"})

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO users (username, password, is_profile_completed)
            OUTPUT INSERTED.user_id
            VALUES (?, ?, 0)
        """, username, password)

        user_id = cursor.fetchone()[0]
        conn.commit()

        return jsonify({
            "status": "ok",
            "message": "Đăng ký thành công",
            "user_id": user_id,
            "username": username,
            "profile_completed": False
        })

    except:
        return jsonify({"status": "error", "message": "Tên đăng nhập đã tồn tại"})
    finally:
        conn.close()


@app.route("/api/login", methods=["POST"])
def login_api():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT user_id, username, is_profile_completed
        FROM users
        WHERE username = ? AND password = ?
    """, username, password)

    row = cursor.fetchone()
    conn.close()

    if row is None:
        return jsonify({"status": "error", "message": "Sai tài khoản hoặc mật khẩu"})

    return jsonify({
        "status": "ok",
        "user_id": row[0],
        "username": row[1],
        "profile_completed": bool(row[2])
    })
@app.route("/category/<category_name>")
def get_products_by_category(category_name):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT item_id, product_name, main_category, price, image_url, quantity
        FROM products_real
        WHERE main_category = ?
    """, category_name)

    rows = cursor.fetchall()
    conn.close()

    data = []
    for row in rows:
        data.append({
            "item_id": row[0],
            "name": row[1],
            "category": row[2],
            "price": row[3],
            "image": row[4],
            "quantity": row[5]
        })

    return jsonify(data)

@app.route("/event", methods=["POST"])
def save_event():
    data = request.get_json()

    user_id = data.get("user_id", 1)
    item_id = data.get("item_id")
    event_type = data.get("event_type")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO events (user_id, item_id, event_type)
        VALUES (?, ?, ?)
    """, user_id, item_id, event_type)

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

@app.route("/login")
def login_page():
    return render_template("login.html")
@app.route("/register")
def register_page():
    return render_template("register.html")
@app.route("/cart")
def cart_page():
    return render_template("cart.html")
@app.route("/cart/add", methods=["POST"])
def add_to_cart():
    data = request.get_json()

    user_id = data.get("user_id", 1)
    item_id = data.get("item_id")
    quantity = data.get("quantity", 1)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO cart (user_id, item_id, quantity)
        VALUES (?, ?, ?)
    """, user_id, item_id, quantity)

    conn.commit()
    conn.close()

    return jsonify({"status": "added"})
@app.route("/profile")
def profile_page():
    return render_template("profile.html")

@app.route("/api/profile/<int:user_id>")
def get_profile(user_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT full_name, phone, address
        FROM users
        WHERE user_id = ?
    """, user_id)

    row = cursor.fetchone()

    conn.close()

    if row is None:
        return jsonify({"status": "error"})

    return jsonify({
        "full_name": row[0],
        "phone": row[1],
        "address": row[2]
    })
@app.route("/api/profile/update", methods=["POST"])
def update_profile():

    data = request.get_json()

    user_id = data.get("user_id")

    full_name = data.get("full_name")
    phone = data.get("phone")
    address = data.get("address")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE users
        SET full_name = ?,
            phone = ?,
            address = ?,
            is_profile_completed = 1
        WHERE user_id = ?
    """, full_name, phone, address, user_id)

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})
if __name__ == "__main__":
    app.run(debug=True)
    
