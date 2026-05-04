function loadProducts() {
    fetch("/products")
        .then(res => res.json())
        .then(data => renderProducts(data));
}
window.onload = function () {
    loadProducts();
};
function renderProducts(products) {
    const box = document.getElementById("products");
    let html = "";

    products.forEach(p => {
        html += `
            <div class="card">
                <div class="thumb-wrap">
                    <img src="${p.image}" class="product-img"
                         onerror="this.src='https://picsum.photos/300'">
                </div>

                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="price">${Number(p.price).toLocaleString()}₫</div>

                    <div class="card-actions">
                        <button onclick="openProduct(${p.item_id})">Xem</button>
                        <button onclick="addToCart(${p.item_id})">Giỏ hàng</button>
                        <button onclick="openCheckout(${p.item_id})">Đặt hàng</button>
                    </div>
                </div>
            </div>
        `;
    });

    box.innerHTML = html;
}

function loadCategory(category) {
    fetch(`/category/${encodeURIComponent(category)}`)
        .then(res => res.json())
        .then(data => renderProducts(data));
}

function openProduct(id) {
    fetch(`/product/${id}`)
        .then(res => res.json())
        .then(p => {
            document.getElementById("productDetail").innerHTML = `
                <img src="${p.image}" width="250">
                <h2>${p.name}</h2>
                <p>Danh mục: ${p.category}</p>
                <h3>${Number(p.price).toLocaleString()}đ</h3>
                <p>${p.description || "Chưa có mô tả"}</p>

                <button onclick="addToCart(${p.item_id})">Thêm giỏ hàng</button>
                <button onclick="buyNow(${p.item_id})">Mua ngay</button>
            `;

            document.getElementById("productModal").style.display = "block";

            saveEvent(id, "view");
        });
}
let currentOrderItemId = null;

function openCheckout(itemId) {
    currentOrderItemId = itemId;
    document.getElementById("checkoutModal").style.display = "block";
    saveEvent(itemId, "purchase");
}

function closeCheckout() {
    document.getElementById("checkoutModal").style.display = "none";
}

function submitOrder() {
    const name = document.getElementById("customerName").value;
    const phone = document.getElementById("customerPhone").value;
    const address = document.getElementById("customerAddress").value;

    if (!name || !phone || !address) {
        alert("Vui lòng nhập đầy đủ thông tin đặt hàng");
        return;
    }

    alert("Đặt hàng thành công!");

    closeCheckout();
}
function closeModal() {
    document.getElementById("productModal").style.display = "none";
}

function saveEvent(itemId, type) {
    fetch("/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: 1,
            item_id: itemId,
            event_type: type
        })
    });
}

function addToCart(id) {
    fetch("/cart/add", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: 1,
            item_id: id,
            quantity: 1
        })
    }).then(() => {
        saveEvent(id, "add_to_cart");
        alert("Đã thêm vào giỏ hàng");
    });
}

function buyNow(id) {
    saveEvent(id, "purchase");
    alert("Đặt hàng thành công");
}

window.onload = loadProducts;
function goToCart() {
    window.location.href = "/cart";
}

function goToCheckout(itemId) {
    window.location.href = `/checkout/${itemId}`;
}
let currentIndex = 0;

const images = [
    "https://down-vn.img.susercontent.com/file/sg-11134258-8261n-mmfw9oka07ig62@resize_w1594_nl.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134258-81ztc-mmeqgc5lb0g832@resize_w1920_nl.webp"
];

function showSlide(index) {
    const banner = document.getElementById("banner");

    if (!banner) return;

    if (index >= images.length) {
        currentIndex = 0;
    } else if (index < 0) {
        currentIndex = images.length - 1;
    } else {
        currentIndex = index;
    }

    banner.src = images[currentIndex];
}

function nextSlide() {
    showSlide(currentIndex + 1);
}

function prevSlide() {
    showSlide(currentIndex - 1);
}

setInterval(nextSlide, 3000);

window.addEventListener("load", function () {
    showSlide(0);
});