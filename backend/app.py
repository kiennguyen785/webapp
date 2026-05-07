from flask import Flask, jsonify, render_template, request, session, redirect
import pyodbc

app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend"
)
app.secret_key = "da2_secret_key"

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
    return render_template(
        "home.html",
        username=session.get("username"),
        role=session.get("role")
    )

@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/register")
def register_page():
    return render_template("register.html")


@app.route("/profile")
def profile_page():
    return render_template("profile.html")


@app.route("/cart")
def cart_page():
    return render_template("cart.html")


@app.route("/orders")
def orders_page():
    return render_template("orders.html")


@app.route("/product/<int:item_id>")
def product_detail_page(item_id):
    return render_template("product_detail.html")


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


@app.route("/api/product/<int:item_id>")
def get_product_detail(item_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            item_id,
            product_name,
            main_category,
            price,
            description,
            image_url,
            quantity
        FROM products_real
        WHERE item_id = ?
    """, item_id)

    row = cursor.fetchone()
    conn.close()

    if row is None:
        return jsonify({
            "status": "error",
            "message": "Không tìm thấy sản phẩm"
        }), 404

    return jsonify({
        "status": "ok",
        "item_id": row[0],
        "name": row[1],
        "category": row[2],
        "price": row[3],
        "description": row[4],
        "image": row[5],
        "quantity": row[6]
    })


@app.route("/api/register", methods=["POST"])
def register_api():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Vui lòng nhập đầy đủ thông tin"
        })

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO users (
                username,
                password,
                role,
                is_profile_completed
            )
            OUTPUT INSERTED.user_id
            VALUES (?, ?, 'user', 0)
        """, username, password)

        user_id = cursor.fetchone()[0]
        conn.commit()

        return jsonify({
            "status": "ok",
            "message": "Đăng ký thành công",
            "user_id": user_id,
            "username": username,
            "role": "user",
            "profile_completed": False
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Tên đăng nhập đã tồn tại"
        })

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
        SELECT user_id, username, role, is_profile_completed
        FROM users
        WHERE username = ? AND password = ?
    """, username, password)

    row = cursor.fetchone()
    conn.close()

    if row is None:
        return jsonify({
            "status": "error",
            "message": "Sai tài khoản hoặc mật khẩu"
        })

        session["user_id"] = row[0]
        session["username"] = row[1]
        session["role"] = row[2]
        session["is_profile_completed"] = bool(row[3])
    
    return jsonify({
        "status": "ok",
        "user_id": row[0],
        "username": row[1],
        "role": row[2],
        "profile_completed": bool(row[3])
    })


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
        return jsonify({
            "status": "error",
            "message": "Không tìm thấy người dùng"
        })

    return jsonify({
        "status": "ok",
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

    return jsonify({
        "status": "ok",
        "message": "Cập nhật thông tin thành công"
    })


@app.route("/event", methods=["POST"])
def save_event():

    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json()

    user_id = session["user_id"]
    item_id = data.get("item_id")
    event_type = data.get("event_type")

    if not item_id or not event_type:
        return jsonify({
            "status": "error",
            "message": "Thiếu dữ liệu event"
        })

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO events (
            user_id,
            item_id,
            event_type
        )
        VALUES (?, ?, ?)
    """, user_id, item_id, event_type)

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok"
    })


@app.route("/cart/add", methods=["POST"])
def add_to_cart():

    try:

        data = request.get_json()

        user_id = data.get("user_id")
        item_id = data.get("item_id")
        quantity = data.get("quantity", 1)

        if not user_id or not item_id:

            return jsonify({
                "status": "error",
                "message": "Thiếu user_id hoặc item_id"
            })

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT quantity
            FROM products_real
            WHERE item_id = ?
        """, item_id)

        product = cursor.fetchone()

        if product is None:

            conn.close()

            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm"
            })

        if product[0] <= 0:

            conn.close()

            return jsonify({
                "status": "error",
                "message": "Sản phẩm đã hết hàng"
            })

        cursor.execute("""
            SELECT cart_id, quantity
            FROM cart
            WHERE user_id = ? AND item_id = ?
        """, user_id, item_id)

        row = cursor.fetchone()

        if row:

            cursor.execute("""
                UPDATE cart
                SET quantity = quantity + ?
                WHERE user_id = ? AND item_id = ?
            """, quantity, user_id, item_id)

        else:

            cursor.execute("""
                INSERT INTO cart (
                    user_id,
                    item_id,
                    quantity
                )
                VALUES (?, ?, ?)
            """, user_id, item_id, quantity)

        conn.commit()
        conn.close()

        return jsonify({
            "status": "added",
            "message": "Đã thêm vào giỏ hàng"
        })

    except Exception as e:

        print("LỖI CART:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        })

@app.route("/api/cart/<int:user_id>")
def get_cart(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            c.cart_id,
            c.item_id,
            p.product_name,
            p.price,
            p.image_url,
            c.quantity,
            p.quantity
        FROM cart c
        JOIN products_real p
            ON c.item_id = p.item_id
        WHERE c.user_id = ?
    """, user_id)

    rows = cursor.fetchall()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "cart_id": row[0],
            "item_id": row[1],
            "name": row[2],
            "price": row[3],
            "image": row[4],
            "quantity": row[5],
            "stock": row[6],
            "total": row[3] * row[5]
        })

    return jsonify(data)
@app.route("/cart/update", methods=["POST"])
def update_cart_quantity():
    data = request.get_json()

    cart_id = data.get("cart_id")
    action = data.get("action")

    if not cart_id or action not in ["increase", "decrease"]:
        return jsonify({"status": "error", "message": "Dữ liệu không hợp lệ"})

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT quantity
        FROM cart
        WHERE cart_id = ?
    """, cart_id)

    row = cursor.fetchone()

    if row is None:
        conn.close()
        return jsonify({"status": "error", "message": "Không tìm thấy sản phẩm trong giỏ"})

    current_qty = row[0]

    if action == "increase":
        cursor.execute("""
            UPDATE cart
            SET quantity = quantity + 1
            WHERE cart_id = ?
        """, cart_id)

    elif action == "decrease":
        if current_qty <= 1:
            cursor.execute("""
                DELETE FROM cart
                WHERE cart_id = ?
            """, cart_id)
        else:
            cursor.execute("""
                UPDATE cart
                SET quantity = quantity - 1
                WHERE cart_id = ?
            """, cart_id)

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})
@app.route("/cart/remove", methods=["POST"])
def remove_cart_item():
    data = request.get_json()

    cart_id = data.get("cart_id")

    if not cart_id:
        return jsonify({"status": "error", "message": "Thiếu cart_id"})

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM cart
        WHERE cart_id = ?
    """, cart_id)

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})
@app.route("/cart/checkout", methods=["POST"])
def checkout_cart():

    data = request.get_json()

    user_id = data.get("user_id")

    if not user_id:

        return jsonify({
            "status": "error",
            "message": "Thiếu user_id"
        })

    conn = get_connection()
    cursor = conn.cursor()

    # Lấy sản phẩm trong cart
    cursor.execute("""

        SELECT
            c.item_id,
            c.quantity,
            p.price

        FROM cart c

        JOIN products_real p
            ON c.item_id = p.item_id

        WHERE c.user_id = ?

    """, user_id)

    cart_items = cursor.fetchall()

    if len(cart_items) == 0:

        conn.close()

        return jsonify({
            "status": "error",
            "message": "Giỏ hàng trống"
        })

    total_price = 0

    for item in cart_items:

        total_price += item[1] * item[2]

    # tạo order
    cursor.execute("""

        INSERT INTO orders (
            user_id,
            total_price
        )

        OUTPUT INSERTED.order_id

        VALUES (?, ?)

    """, user_id, total_price)

    order_id = cursor.fetchone()[0]

    # thêm order_items
    for item in cart_items:

        item_id = item[0]
        quantity = item[1]
        price = item[2]

        cursor.execute("""

            INSERT INTO order_items (
                order_id,
                item_id,
                quantity,
                price
            )

            VALUES (?, ?, ?, ?)

        """, order_id, item_id, quantity, price)

        # trừ tồn kho
        cursor.execute("""

            UPDATE products_real

            SET quantity = quantity - ?

            WHERE item_id = ?

        """, quantity, item_id)

        # lưu purchase event
        cursor.execute("""

            INSERT INTO events (
                user_id,
                item_id,
                event_type
            )

            VALUES (?, ?, ?)

        """, user_id, item_id, "purchase")

    # xóa cart
    cursor.execute("""

        DELETE FROM cart
        WHERE user_id = ?

    """, user_id)

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok",
        "message": "Đặt hàng thành công"
    })
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")
if __name__ == "__main__":
    app.run(debug=True)