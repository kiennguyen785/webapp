from flask import Flask, jsonify, render_template
import pyodbc
import torch
import pickle
from pathlib import Path

# =========================
# Flask config
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent  # nếu app.py nằm trong /test
FRONTEND_DIR = BASE_DIR / "frontend"
MODEL_DIR = BASE_DIR / "model"

app = Flask(
    __name__,
    template_folder="../frontend",
    static_folder="../frontend"
)

# =========================
# Database
# =========================
def get_connection():
    return pyodbc.connect(
        "DRIVER={SQL Server};"
        "SERVER=ADMIN\\SQLEXPRESS;"
        "DATABASE=DA2;"
        "UID=sa;"
        "PWD=123123;"          # đổi lại đúng mật khẩu của bạn
        "TrustServerCertificate=yes;"
    )

# =========================
# Load mapping/config
# =========================
with open(MODEL_DIR / "item2idx.pkl", "rb") as f:
    item2idx = pickle.load(f)

with open(MODEL_DIR / "idx2item.pkl", "rb") as f:
    idx2item = pickle.load(f)

with open(MODEL_DIR / "config.pkl", "rb") as f:
    config = pickle.load(f)

# =========================
# Load model
# IMPORTANT:
# Bạn phải thay YourModel bằng class model thật của bạn
# ví dụ: from recommend import LSTMRecModel
# =========================
# from recommend import YourRealModelClass
# model = YourRealModelClass(config)
# model.load_state_dict(torch.load(MODEL_DIR / "model.pth", map_location="cpu"))
# model.eval()

model = None  # tạm để web /products chạy trước

# =========================
# Routes render HTML
# =========================
@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/register")
def register():
    return render_template("register.html")

# =========================
# API: products
# =========================
@app.route("/products")
def get_products():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT item_id, product_name, main_category, price, image_url
        FROM products
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

# =========================
# API: recommend (tạm demo)
# Sau này mới nối model thật
# =========================
@app.route("/recommend")
def recommend():
    # tạm trả vài item có sẵn để test giao diện
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT TOP 4 item_id, product_name, main_category, price, image_url
        FROM products
        ORDER BY product_id DESC
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

if __name__ == "__main__":
    app.run(debug=True)