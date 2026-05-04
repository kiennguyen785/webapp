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
        SELECT item_id, product_name, main_category, price, image_url
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
            "image": row[4]
        })

    return jsonify(data)
@app.route("/product/<int:item_id>")
def get_product_detail(item_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT item_id, product_name, main_category, price, description, image_url
        FROM products
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

@app.route("/category/<category_name>")
def get_products_by_category(category_name):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT item_id, product_name, main_category, price, image_url
        FROM products
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
            "image": row[4]
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

if __name__ == "__main__":
    app.run(debug=True)