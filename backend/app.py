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


# ================= PAGE ROUTES =================

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
    return render_template(
        "profile.html",
        username=session.get("username"),
        role=session.get("role")
    )


@app.route("/products")
def products_page():
    return render_template(
        "products.html",
        username=session.get("username"),
        role=session.get("role")
    )

@app.route("/product/<int:item_id>")
def product_detail_page(item_id):
    return render_template(
        "product_detail.html",
        username=session.get("username"),
        role=session.get("role")
    )


@app.route("/cart")
def cart_page():
    return render_template(
        "cart.html",
        username=session.get("username"),
        role=session.get("role")
    )


@app.route("/orders")
def orders_page():
    return render_template(
        "orders.html",
        username=session.get("username"),
        role=session.get("role")
    )


@app.route("/recommend")
def recommend_page():
    return render_template(
        "recommend.html",
        username=session.get("username"),
        role=session.get("role")
    )


@app.route("/seller")
def seller_page():
    if "user_id" not in session:
        return redirect("/login")

    if session.get("role") not in ["seller", "admin"]:
        return redirect("/")

    return render_template(
        "seller.html",
        username=session.get("username"),
        role=session.get("role")
    )

@app.route("/admin")
def admin_page():
    if "user_id" not in session:
        return redirect("/login")

    if session.get("role") != "admin":
        return redirect("/")

    return render_template(
        "admin.html",
        username=session.get("username"),
        role=session.get("role")
    )


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")


# ================= AUTH =================

@app.route("/api/register", methods=["POST"])
def register_api():
    data = request.get_json() or {}

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
        conn.rollback()
        print("LỖI REGISTER:", e)

        return jsonify({
            "status": "error",
            "message": "Tên đăng nhập đã tồn tại"
        })

    finally:
        conn.close()


@app.route("/api/login", methods=["POST"])
def login_api():
    data = request.get_json() or {}

    username = data.get("username")
    password = data.get("password")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            user_id,
            username,
            role,
            is_profile_completed
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


# ================= PROFILE =================

@app.route("/api/profile")
def get_profile():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            full_name,
            phone,
            address
        FROM users
        WHERE user_id = ?
    """, session["user_id"])

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

    data = request.get_json() or {}

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
        SET
            full_name = ?,
            phone = ?,
            address = ?,
            is_profile_completed = 1
        WHERE user_id = ?
    """, full_name, phone, address, session["user_id"])

    conn.commit()
    conn.close()

    session["is_profile_completed"] = True

    return jsonify({
        "status": "ok",
        "message": "Cập nhật thông tin thành công"
    })


# ================= PRODUCT =================

@app.route("/api/products")
def get_products():
    limit = request.args.get("limit")

    conn = get_connection()
    cursor = conn.cursor()

    if limit == "15":
        cursor.execute("""
            SELECT TOP 15
                item_id,
                product_name,
                main_category,
                price,
                image_url,
                quantity
            FROM products_real
            ORDER BY NEWID()
        """)
    else:
        cursor.execute("""
            SELECT
                item_id,
                product_name,
                main_category,
                price,
                image_url,
                quantity
            FROM products_real
            ORDER BY item_id DESC
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
        SELECT
            item_id,
            product_name,
            main_category,
            price,
            image_url,
            quantity
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
            quantity,
            size_guide
        FROM products_real
        WHERE item_id = ?
    """, item_id)

    row = cursor.fetchone()

    if row is None:
        conn.close()
        return jsonify({
            "status": "error",
            "message": "Không tìm thấy sản phẩm"
        }), 404

    cursor.execute("""
        SELECT
            variant_id,
            color,
            size,
            storage,
            weight,
            stock,
            price,
            image_url
        FROM product_variants
        WHERE item_id = ?
    """, item_id)

    variant_rows = cursor.fetchall()

    variants = []

    for v in variant_rows:
        variants.append({
            "variant_id": v[0],
            "color": v[1],
            "size": v[2],
            "storage": v[3],
            "weight": v[4],
            "stock": v[5],
            "price": v[6],
            "image_url": v[7]
        })

    cursor.execute("""
        SELECT
            attribute_name,
            attribute_value
        FROM product_attributes
        WHERE item_id = ?
    """, item_id)

    attr_rows = cursor.fetchall()
    conn.close()

    attributes = []

    for a in attr_rows:
        attributes.append({
            "attribute_name": a[0],
            "attribute_value": a[1]
        })

    return jsonify({
        "status": "ok",
        "item_id": row[0],
        "name": row[1],
        "category": row[2],
        "price": row[3],
        "description": row[4],
        "image": row[5],
        "quantity": row[6],
        "size_guide": row[7],
        "variants": variants,
        "attributes": attributes
    })


# ================= EVENT =================

@app.route("/event", methods=["POST"])
def save_event():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json() or {}

    item_id = data.get("item_id")
    variant_id = data.get("variant_id")
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
            variant_id,
            event_type
        )
        VALUES (?, ?, ?, ?)
    """, session["user_id"], item_id, variant_id, event_type)

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok"
    })


# ================= CART =================

@app.route("/cart/add", methods=["POST"])
def add_to_cart():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json() or {}

    user_id = session["user_id"]
    item_id = data.get("item_id")
    variant_id = data.get("variant_id")
    quantity = int(data.get("quantity", 1))

    if not item_id:
        return jsonify({
            "status": "error",
            "message": "Thiếu item_id"
        })

    conn = get_connection()
    cursor = conn.cursor()

    try:
        if variant_id:
            cursor.execute("""
                SELECT stock
                FROM product_variants
                WHERE variant_id = ? AND item_id = ?
            """, variant_id, item_id)
        else:
            cursor.execute("""
                SELECT quantity
                FROM products_real
                WHERE item_id = ?
            """, item_id)

        product = cursor.fetchone()

        if product is None:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm hoặc phân loại"
            })

        stock = int(product[0])

        if stock <= 0:
            return jsonify({
                "status": "error",
                "message": "Sản phẩm đã hết hàng"
            })

        if quantity > stock:
            return jsonify({
                "status": "error",
                "message": "Số lượng trong kho không đủ"
            })

        cursor.execute("""
            SELECT
                cart_id,
                quantity
            FROM cart
            WHERE user_id = ?
              AND item_id = ?
              AND (
                    variant_id = ?
                    OR (variant_id IS NULL AND ? IS NULL)
              )
        """, user_id, item_id, variant_id, variant_id)

        row = cursor.fetchone()

        if row:
            cart_id = row[0]
            new_quantity = int(row[1]) + quantity

            if new_quantity > stock:
                return jsonify({
                    "status": "error",
                    "message": "Số lượng trong kho không đủ"
                })

            cursor.execute("""
                UPDATE cart
                SET quantity = ?
                WHERE cart_id = ?
            """, new_quantity, cart_id)

        else:
            cursor.execute("""
                INSERT INTO cart (
                    user_id,
                    item_id,
                    variant_id,
                    quantity
                )
                VALUES (?, ?, ?, ?)
            """, user_id, item_id, variant_id, quantity)

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

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            c.cart_id,
            c.item_id,
            c.variant_id,
            p.product_name,
            COALESCE(v.price, p.price),
            COALESCE(v.image_url, p.image_url),
            c.quantity,
            COALESCE(v.stock, p.quantity),
            v.color,
            v.size,
            v.storage,
            v.weight
        FROM cart c
        JOIN products_real p
            ON c.item_id = p.item_id
        LEFT JOIN product_variants v
            ON c.variant_id = v.variant_id
        WHERE c.user_id = ?
        ORDER BY c.cart_id DESC
    """, session["user_id"])

    rows = cursor.fetchall()
    conn.close()

    data = []

    for row in rows:
        price = int(row[4])
        quantity = int(row[6])

        data.append({
            "cart_id": row[0],
            "item_id": row[1],
            "variant_id": row[2],
            "name": row[3],
            "price": price,
            "image": row[5],
            "quantity": quantity,
            "stock": row[7],
            "color": row[8],
            "size": row[9],
            "storage": row[10],
            "weight": row[11],
            "total": price * quantity
        })

    return jsonify(data)


@app.route("/cart/update", methods=["POST"])
def update_cart_quantity():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json() or {}

    cart_id = data.get("cart_id")
    action = data.get("action")

    if not cart_id or action not in ["increase", "decrease"]:
        return jsonify({
            "status": "error",
            "message": "Dữ liệu không hợp lệ"
        })

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                c.quantity,
                COALESCE(v.stock, p.quantity)
            FROM cart c
            JOIN products_real p
                ON c.item_id = p.item_id
            LEFT JOIN product_variants v
                ON c.variant_id = v.variant_id
            WHERE c.cart_id = ?
              AND c.user_id = ?
        """, cart_id, session["user_id"])

        row = cursor.fetchone()

        if row is None:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm trong giỏ"
            })

        current_qty = int(row[0])
        stock = int(row[1])

        if action == "increase":
            if current_qty + 1 > stock:
                return jsonify({
                    "status": "error",
                    "message": "Số lượng trong kho không đủ"
                })

            cursor.execute("""
                UPDATE cart
                SET quantity = quantity + 1
                WHERE cart_id = ?
                  AND user_id = ?
            """, cart_id, session["user_id"])

        else:
            if current_qty <= 1:
                cursor.execute("""
                    DELETE FROM cart
                    WHERE cart_id = ?
                      AND user_id = ?
                """, cart_id, session["user_id"])

            else:
                cursor.execute("""
                    UPDATE cart
                    SET quantity = quantity - 1
                    WHERE cart_id = ?
                      AND user_id = ?
                """, cart_id, session["user_id"])

        conn.commit()

        return jsonify({
            "status": "ok"
        })

    except Exception as e:
        conn.rollback()
        print("LỖI UPDATE CART:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        })

    finally:
        conn.close()


@app.route("/cart/remove", methods=["POST"])
def remove_cart_item():
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    data = request.get_json() or {}

    cart_id = data.get("cart_id")

    if not cart_id:
        return jsonify({
            "status": "error",
            "message": "Thiếu cart_id"
        })

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM cart
        WHERE cart_id = ?
          AND user_id = ?
    """, cart_id, session["user_id"])

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok"
    })


# ================= CHECKOUT / ORDERS =================

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
    variant_id = data.get("variant_id")
    quantity = int(data.get("quantity", 1))

    conn = get_connection()
    cursor = conn.cursor()

    try:
        items = []
        if item_id:
            if variant_id:
                cursor.execute("""
                    SELECT
                        v.item_id,
                        COALESCE(v.price, p.price),
                        v.stock
                    FROM product_variants v
                    JOIN products_real p
                        ON v.item_id = p.item_id
                    WHERE v.variant_id = ?
                      AND v.item_id = ?
                """, variant_id, item_id)
            else:
                cursor.execute("""
                    SELECT
                        item_id,
                        price,
                        quantity
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
                "variant_id": variant_id,
                "quantity": quantity,
                "price": int(row[1])
            })

        else:
            cursor.execute("""
                SELECT
                    c.item_id,
                    c.variant_id,
                    c.quantity,
                    COALESCE(v.price, p.price),
                    COALESCE(v.stock, p.quantity)
                FROM cart c
                JOIN products_real p
                    ON c.item_id = p.item_id
                LEFT JOIN product_variants v
                    ON c.variant_id = v.variant_id
                WHERE c.user_id = ?
            """, user_id)

            rows = cursor.fetchall()

            if len(rows) == 0:
                return jsonify({
                    "status": "error",
                    "message": "Giỏ hàng trống"
                })

            for row in rows:
                cart_quantity = int(row[2])
                stock = int(row[4])

                if cart_quantity > stock:
                    return jsonify({
                        "status": "error",
                        "message": "Số lượng trong kho không đủ"
                    })

                items.append({
                    "item_id": row[0],
                    "variant_id": row[1],
                    "quantity": cart_quantity,
                    "price": int(row[3])
                })

        total_price = sum(
            item["quantity"] * item["price"]
            for item in items
        )

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
                    variant_id,
                    quantity,
                    price
                )
                VALUES (?, ?, ?, ?, ?)
            """,
                order_id,
                item["item_id"],
                item["variant_id"],
                item["quantity"],
                item["price"]
            )

            if item["variant_id"]:
                cursor.execute("""
                    UPDATE product_variants
                    SET stock = stock - ?
                    WHERE variant_id = ?
                """, item["quantity"], item["variant_id"])
            else:
                cursor.execute("""
                    UPDATE products_real
                    SET quantity = quantity - ?
                    WHERE item_id = ?
                """, item["quantity"], item["item_id"])

            cursor.execute("""
                INSERT INTO events (
                    user_id,
                    item_id,
                    variant_id,
                    event_type
                )
                VALUES (?, ?, ?, ?)
            """,
                user_id,
                item["item_id"],
                item["variant_id"],
                "purchase"
            )

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


@app.route("/api/orders")
def get_orders():
    if "user_id" not in session:
        return jsonify([]), 401

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            o.order_id,
            o.total_price,
            o.order_time,
            oi.item_id,
            oi.variant_id,
            p.product_name,
            oi.quantity,
            oi.price,
            COALESCE(v.image_url, p.image_url),
            v.color,
            v.size,
            v.storage,
            v.weight
        FROM orders o
        JOIN order_items oi
            ON o.order_id = oi.order_id
        JOIN products_real p
            ON oi.item_id = p.item_id
        LEFT JOIN product_variants v
            ON oi.variant_id = v.variant_id
        WHERE o.user_id = ?
        ORDER BY o.order_time DESC
    """, session["user_id"])

    rows = cursor.fetchall()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "order_id": row[0],
            "total_price": row[1],
            "order_time": str(row[2]),
            "item_id": row[3],
            "variant_id": row[4],
            "product_name": row[5],
            "quantity": row[6],
            "price": row[7],
            "image": row[8],
            "color": row[9],
            "size": row[10],
            "storage": row[11],
            "weight": row[12]
        })

    return jsonify(data)


# ================= RECOMMEND =================

@app.route("/api/recommend")
def recommend_api():
    if "user_id" not in session:
        return jsonify([])

    conn = get_connection()
    cursor = conn.cursor()

    data = get_recommend_products(
        cursor,
        session["user_id"],
        top_k=25
    )

    conn.close()

    return jsonify(data)


# ================= ADMIN =================

@app.route("/api/admin/users")
def admin_users():
    if "user_id" not in session:
        return jsonify([]), 401

    if session.get("role") != "admin":
        return jsonify([]), 403

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            user_id,
            username,
            full_name,
            phone,
            address,
            role,
            is_profile_completed
        FROM users
        ORDER BY user_id DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "user_id": row[0],
            "username": row[1],
            "full_name": row[2],
            "phone": row[3],
            "address": row[4],
            "role": row[5],
            "is_profile_completed": bool(row[6])
        })

    return jsonify(data)


@app.route("/api/admin/users/<int:user_id>/role", methods=["POST"])
def admin_update_user_role(user_id):
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    if session.get("role") != "admin":
        return jsonify({
            "status": "error",
            "message": "Bạn không có quyền admin"
        }), 403

    data = request.get_json() or {}

    role = data.get("role")

    if role not in ["user", "seller", "admin"]:
        return jsonify({
            "status": "error",
            "message": "Role không hợp lệ"
        })

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE users
        SET role = ?
        WHERE user_id = ?
    """, role, user_id)

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok",
        "message": "Đã cập nhật quyền"
    })


@app.route("/api/admin/users/<int:user_id>/delete", methods=["POST"])
def admin_delete_user(user_id):
    if "user_id" not in session:
        return jsonify({
            "status": "error",
            "message": "Bạn chưa đăng nhập"
        }), 401

    if session.get("role") != "admin":
        return jsonify({
            "status": "error",
            "message": "Bạn không có quyền admin"
        }), 403

    if int(user_id) == int(session["user_id"]):
        return jsonify({
            "status": "error",
            "message": "Không thể xóa tài khoản đang đăng nhập"
        })

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE oi
            FROM order_items oi
            JOIN orders o
                ON oi.order_id = o.order_id
            WHERE o.user_id = ?
        """, user_id)

        cursor.execute("""
            DELETE FROM orders
            WHERE user_id = ?
        """, user_id)

        cursor.execute("""
            DELETE FROM cart
            WHERE user_id = ?
        """, user_id)

        cursor.execute("""
            DELETE FROM events
            WHERE user_id = ?
        """, user_id)

        cursor.execute("""
            DELETE FROM users
            WHERE user_id = ?
        """, user_id)

        conn.commit()

        return jsonify({
            "status": "ok",
            "message": "Đã xóa tài khoản"
        })

    except Exception as e:
        conn.rollback()
        print("LỖI DELETE USER:", e)

        return jsonify({
            "status": "error",
            "message": str(e)
        })

    finally:
        conn.close()


# ================= SELLER =================
@app.route("/api/seller/products")
def seller_products():

    if "user_id" not in session:
        return jsonify([]), 401

    if session.get("role") not in ["seller", "admin"]:
        return jsonify([]), 403

    conn = get_connection()
    cursor = conn.cursor()

    if session.get("role") == "admin":

        cursor.execute("""
            SELECT
                item_id,
                product_name,
                main_category,
                price,
                quantity,
                image_url,
                description,
                size_guide,
                seller_id
            FROM products_real
            ORDER BY item_id DESC
        """)

    else:

        cursor.execute("""
            SELECT
                item_id,
                product_name,
                main_category,
                price,
                quantity,
                image_url,
                description,
                size_guide,
                seller_id
            FROM products_real
            WHERE seller_id = ?
            ORDER BY item_id DESC
        """, session["user_id"])

    rows = cursor.fetchall()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "item_id": row[0],
            "name": row[1],
            "category": row[2],
            "price": row[3],
            "quantity": row[4],
            "image": row[5],
            "description": row[6],
            "size_guide": row[7],
            "seller_id": row[8]
        })

    return jsonify(data)
@app.route("/api/seller/product/save", methods=["POST"])
def save_seller_product():

    if "user_id" not in session:
        return jsonify({
            "message": "Unauthorized"
        }), 401

    if session.get("role") not in ["seller", "admin"]:
        return jsonify({
            "message": "Forbidden"
        }), 403

    data = request.json

    item_id = data.get("item_id")

    name = data.get("name")
    category = data.get("category")
    price = data.get("price")
    quantity = data.get("quantity")
    image = data.get("image")
    description = data.get("description")
    size_guide = data.get("size_guide")

    conn = get_connection()

    cursor = conn.cursor()

    # UPDATE
    if item_id:

        if session.get("role") == "admin":

            cursor.execute("""
                UPDATE products_real
                SET
                    product_name = ?,
                    main_category = ?,
                    price = ?,
                    quantity = ?,
                    image_url = ?,
                    description = ?,
                    size_guide = ?
                WHERE item_id = ?
            """,
                name,
                category,
                price,
                quantity,
                image,
                description,
                size_guide,
                item_id
            )

        else:

            cursor.execute("""
                UPDATE products_real
                SET
                    product_name = ?,
                    main_category = ?,
                    price = ?,
                    quantity = ?,
                    image_url = ?,
                    description = ?,
                    size_guide = ?
                WHERE item_id = ?
                AND seller_id = ?
            """,
                name,
                category,
                price,
                quantity,
                image,
                description,
                size_guide,
                item_id,
                session["user_id"]
            )

    # INSERT
    else:

        cursor.execute("""
            INSERT INTO products_real
            (
                product_name,
                main_category,
                price,
                quantity,
                image_url,
                description,
                size_guide,
                seller_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            name,
            category,
            price,
            quantity,
            image,
            description,
            size_guide,
            session["user_id"]
        )

    conn.commit()

    conn.close()

    return jsonify({
        "status": "ok"
    })
    
@app.route("/api/seller/product/<int:item_id>/delete", methods=["POST"])
def delete_seller_product(item_id):

    if "user_id" not in session:
        return jsonify({
            "message": "Unauthorized"
        }), 401

    if session.get("role") not in ["seller", "admin"]:
        return jsonify({
            "message": "Forbidden"
        }), 403

    conn = get_connection()

    cursor = conn.cursor()

    if session.get("role") == "admin":

        cursor.execute("""
            DELETE FROM products_real
            WHERE item_id = ?
        """, item_id)

    else:

        cursor.execute("""
            DELETE FROM products_real
            WHERE item_id = ?
            AND seller_id = ?
        """,
            item_id,
            session["user_id"]
        )

    conn.commit()
    conn.close()

    return jsonify({
        "status": "ok"
    })
if __name__ == "__main__":
    app.run(debug=True)