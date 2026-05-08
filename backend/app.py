from flask import Flask, jsonify, render_template, request, session, redirect
from recommend import get_recommend_products
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
    return render_template(
        "cart.html",
        username=session.get("username"),
        role=session.get("role")
    )

@app.route("/cart/checkout", methods=["POST"])
def checkout_cart():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json() or {}

    user_id = session["user_id"]
    item_id = data.get("item_id")
    quantity = int(data.get("quantity", 1))

    conn = get_connection()
    cursor = conn.cursor()

    try:
        items = []

        if item_id:
            cursor.execute("""
                SELECT item_id, price, quantity
                FROM products_real
                WHERE item_id = ?
            """, item_id)

            row = cursor.fetchone()

            if row is None:
                return jsonify({
                    "status": "error",
                    "message": "Không tìm thấy sản phẩm"
                })

            stock = int(row[2])

            if stock < quantity:
                return jsonify({
                    "status": "error",
                    "message": "Số lượng trong kho không đủ"
                })

            items.append({
                "item_id": row[0],
                "quantity": quantity,
                "price": int(row[1])
            })

        else:
            cursor.execute("""
                SELECT
                    c.item_id,
                    c.quantity,
                    p.price,
                    p.quantity
                FROM cart c
                JOIN products_real p
                    ON c.item_id = p.item_id
                WHERE c.user_id = ?
            """, user_id)

            rows = cursor.fetchall()

            if len(rows) == 0:
                return jsonify({
                    "status": "error",
                    "message": "Giỏ hàng trống"
                })

            for row in rows:
                cart_quantity = int(row[1])
                stock = int(row[3])

                if cart_quantity > stock:
                    return jsonify({
                        "status": "error",
                        "message": "Số lượng trong kho không đủ"
                    })

                items.append({
                    "item_id": row[0],
                    "quantity": cart_quantity,
                    "price": int(row[2])
                })

        total_price = 0

        for item in items:
            total_price += item["quantity"] * item["price"]

        cursor.execute("""
            INSERT INTO orders (
                user_id,
                total_price
            )
            OUTPUT INSERTED.order_id
            VALUES (?, ?)
        """, user_id, total_price)

        order_id = cursor.fetchone()[0]

        for item in items:
            cursor.execute("""
                INSERT INTO order_items (
                    order_id,
                    item_id,
                    quantity,
                    price
                )
                VALUES (?, ?, ?, ?)
            """, order_id, item["item_id"], item["quantity"], item["price"])

            cursor.execute("""
                UPDATE products_real
                SET quantity = quantity - ?
                WHERE item_id = ?
            """, item["quantity"], item["item_id"])

            cursor.execute("""
                INSERT INTO events (
                    user_id,
                    item_id,
                    event_type
                )
                VALUES (?, ?, ?)
            """, user_id, item["item_id"], "purchase")

        if not item_id:
            cursor.execute("""
                DELETE FROM cart
                WHERE user_id = ?
            """, user_id)

        conn.commit()

        return jsonify({
            "status": "ok",
            "message": "Đặt hàng thành công",
            "order_id": order_id
        })

    except Exception as e:
        conn.rollback()
        print("LỖI CHECKOUT:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        })

    finally:
        conn.close()
@app.route("/orders")
def orders_page():
    return render_template(
        "orders.html",
        username=session.get("username"),
        role=session.get("role")
    )
@app.route("/api/orders")
def get_orders():
    if "user_id" not in session:
        return jsonify([]), 401

    user_id = session["user_id"]

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            o.order_id,
            o.total_price,
            o.order_time,
            oi.item_id,
            p.product_name,
            oi.quantity,
            oi.price,
            p.image_url
        FROM orders o
        JOIN order_items oi
            ON o.order_id = oi.order_id
        JOIN products_real p
            ON oi.item_id = p.item_id
        WHERE o.user_id = ?
        ORDER BY o.order_time DESC
    """, user_id)

    rows = cursor.fetchall()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "order_id": row[0],
            "total_price": row[1],
            "order_time": str(row[2]),
            "item_id": row[3],
            "product_name": row[4],
            "quantity": row[5],
            "price": row[6],
            "image": row[7]
        })

    return jsonify(data)
@app.route("/product/<int:item_id>")
def product_detail_page(item_id):
    return render_template("product_detail.html")

@app.route("/products")
def products_page():
    return render_template(
        "products.html",
        username=session.get("username"),
        role=session.get("role")
    )

@app.route("/api/products")
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
@app.route("/recommend")
def recommend_page():
    return render_template(
        "recommend.html",
        username=session.get("username"),
        role=session.get("role")
    )
@app.route("/api/recommend")
def recommend_api():
    if "user_id" not in session:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor()

    data = get_recommend_products(
        cursor,
        session["user_id"],
        top_k=5
    )

    conn.close()

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
        session["user_id"] = user_id
        session["username"] = username
        session["role"] = "user"
        session["is_profile_completed"] = False

        return jsonify({
            "status": "ok",
            "message": "Đăng ký thành công",
            "user_id": user_id,
            "username": username,
            "role": "user",
            "profile_completed": False
        })

    except Exception as e:
        print("LỖI REGISTER:", e)

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


@app.route("/api/profile")
def get_profile():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    user_id = session["user_id"]

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
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json()

    user_id = session["user_id"]
    full_name = data.get("full_name", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()

    if len(full_name) < 2:
        return jsonify({
            "status": "error",
            "message": "Họ tên không hợp lệ"
        })

    if not phone.isdigit() or len(phone) < 9 or len(phone) > 11:
        return jsonify({
            "status": "error",
            "message": "Số điện thoại không hợp lệ"
        })

    if len(address) < 5:
        return jsonify({
            "status": "error",
            "message": "Địa chỉ không hợp lệ"
        })

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

    session["is_profile_completed"] = True

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
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json()

    user_id = session["user_id"]
    item_id = data.get("item_id")
    quantity = int(data.get("quantity", 1))

    if not item_id:
        return jsonify({
            "status": "error",
            "message": "Thiếu item_id"
        })

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT quantity
            FROM products_real
            WHERE item_id = ?
        """, item_id)

        product = cursor.fetchone()

        if product is None:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm"
            })

        stock = int(product[0])

        if stock <= 0:
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
            new_quantity = int(row[1]) + quantity

            if new_quantity > stock:
                return jsonify({
                    "status": "error",
                    "message": "Số lượng trong kho không đủ"
                })

            cursor.execute("""
                UPDATE cart
                SET quantity = ?
                WHERE user_id = ? AND item_id = ?
            """, new_quantity, user_id, item_id)

        else:
            if quantity > stock:
                return jsonify({
                    "status": "error",
                    "message": "Số lượng trong kho không đủ"
                })

            cursor.execute("""
                INSERT INTO cart (user_id, item_id, quantity)
                VALUES (?, ?, ?)
            """, user_id, item_id, quantity)

        conn.commit()

        return jsonify({
            "status": "ok",
            "message": "Đã thêm vào giỏ hàng"
        })

    except Exception as e:
        conn.rollback()
        print("LỖI ADD CART:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        })

    finally:
        conn.close()
@app.route("/api/cart")
def get_cart():
    if "user_id" not in session:
        return jsonify([]), 401

    user_id = session["user_id"]

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
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Bạn chưa đăng nhập"}), 401

    data = request.get_json()

    cart_id = data.get("cart_id")
    action = data.get("action")
    user_id = session["user_id"]

    if not cart_id or action not in ["increase", "decrease"]:
        return jsonify({"status": "error", "message": "Dữ liệu không hợp lệ"})

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT quantity
        FROM cart
        WHERE cart_id = ? AND user_id = ?
    """, cart_id, user_id)

    row = cursor.fetchone()

    if row is None:
        conn.close()
        return jsonify({"status": "error", "message": "Không tìm thấy sản phẩm trong giỏ"})

    current_qty = row[0]

    if action == "increase":
        cursor.execute("""
            UPDATE cart
            SET quantity = quantity + 1
            WHERE cart_id = ? AND user_id = ?
        """, cart_id, user_id)

    elif action == "decrease":
        if current_qty <= 1:
            cursor.execute("""
                DELETE FROM cart
                WHERE cart_id = ? AND user_id = ?
            """, cart_id, user_id)
        else:
            cursor.execute("""
                UPDATE cart
                SET quantity = quantity - 1
                WHERE cart_id = ? AND user_id = ?
            """, cart_id, user_id)

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})
@app.route("/cart/remove", methods=["POST"])
def remove_cart_item():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Bạn chưa đăng nhập"}), 401

    data = request.get_json()

    cart_id = data.get("cart_id")
    user_id = session["user_id"]

    if not cart_id:
        return jsonify({"status": "error", "message": "Thiếu cart_id"})

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM cart
        WHERE cart_id = ? AND user_id = ?
    """, cart_id, user_id)

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")
if __name__ == "__main__":
    app.run(debug=True)