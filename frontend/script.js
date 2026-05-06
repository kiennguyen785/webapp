function renderProducts(products) {
    const box = document.getElementById("products");
    let html = "";

    products.forEach(p => {
        const isOut = Number(p.quantity) <= 0;

        html += `
            <div class="card">
                <div class="thumb-wrap">
                    <img src="${p.image}" class="product-img"
                         onerror="this.src='https://picsum.photos/300'">
                    ${isOut ? `<div class="out-stock">Hết hàng</div>` : ""}
                </div>

                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="price">${Number(p.price).toLocaleString()}₫</div>
                    <div class="stock">Còn lại: ${p.quantity}</div>

                    <div class="card-actions">
                        <button onclick="openProduct(${p.item_id})">Xem</button>
                        <button ${isOut ? "disabled" : ""} onclick="addToCart(${p.item_id})">Giỏ hàng</button>
                        <button ${isOut ? "disabled" : ""} onclick="openCheckout(${p.item_id})">Đặt hàng</button>
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
                <div class="detail-box">
                    <div>
                        <img src="${p.image}" class="detail-img"
                             onerror="this.src='https://picsum.photos/500'">
                    </div>

                    <div class="detail-info">
                        <h2>${p.name}</h2>
                        <div class="detail-category">Danh mục: ${p.category}</div>

                        <div class="detail-price">
                            ${Number(p.price).toLocaleString()}₫
                        </div>

                        <p class="detail-desc">
                            ${p.description || "Sản phẩm hiện chưa có mô tả chi tiết."}
                        </p>

                        <div class="detail-actions">
                            <button class="btn-back" onclick="closeModal()">Quay lại</button>
                            <button class="btn-cart" onclick="addToCart(${p.item_id})">Giỏ hàng</button>
                            <button class="btn-buy" onclick="openCheckout(${p.item_id})">Đặt hàng</button>
                        </div>
                    </div>
                </div>
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
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    if (!name || !phone || !address) {
        showToast("Vui lòng nhập đầy đủ thông tin đặt hàng");
        return;
    }

    if (name.length < 2) {
        showToast("Tên người nhận không hợp lệ");
        return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
        showToast("Số điện thoại không hợp lệ");
        return;
    }

    if (address.length < 5) {
        showToast("Địa chỉ nhận hàng quá ngắn");
        return;
    }

    closeCheckout();
    showToast("Đặt hàng thành công");

    document.getElementById("customerName").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("customerAddress").value = "";
}
function closeModal() {
    document.getElementById("productModal").style.display = "none";
}

function saveEvent(itemId, type) {
    const userId = getCurrentUserId();

    if (!userId) {
        return;
    }

    fetch("/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: Number(userId),
            item_id: itemId,
            event_type: type
        })
    });
}

function addToCart(id) {
    const userId = getCurrentUserId();

    if (!userId) {
        alert("Vui lòng đăng nhập trước khi thêm giỏ hàng");
        window.location.href = "/login";
        return;
    }

    fetch("/cart/add", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: Number(userId),
            item_id: id,
            quantity: 1
        })
    }).then(() => {
        saveEvent(id, "add_to_cart");
        showToast("Đã thêm vào giỏ hàng");
    });
}

function buyNow(id) {
    saveEvent(id, "purchase");
    alert("Đặt hàng thành công");
}

window.addEventListener("load", loadProducts);
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
let allProducts = [];
function loadProducts() {
    fetch("/products")
        .then(res => res.json())
        .then(data => {
            allProducts = data;
            renderProducts(data);
        });
}
function searchProducts() {
    const input = document.getElementById("searchInput");
    const title = document.getElementById("search-result-title");

    const keyword = input.value.toLowerCase().trim();

    if (!keyword) {
        title.innerHTML = "";
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.category.toLowerCase().includes(keyword)
    );

    renderProducts(filtered);

    document.getElementById("products").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
window.addEventListener("load", function () {
    const input = document.getElementById("searchInput");
    if (input) {
        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                searchProducts();
            }
        });
    }
});
function selectCategory(element, category) {
    document.querySelectorAll(".cat-item").forEach(item => {
        item.classList.remove("active");
    });

    element.classList.add("active");

    if (category === null) {
        loadProducts();
    } else {
        loadCategory(category);
    }
}
function showToast(message) {
    const toast = document.getElementById("toast");
    const msg = document.getElementById("toast-msg");

    msg.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function closeToast() {
    document.getElementById("toast").classList.remove("show");
}

function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    if (!username || !password || !confirm) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự");
        return;
    }

    if (password !== confirm) {
        alert("Mật khẩu nhập lại không khớp");
        return;
    }

    fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);

        if (data.status === "ok") {
            localStorage.setItem("user_id", data.user_id);
            localStorage.setItem("username", data.username);
            window.location.href = "/profile";
        }
    });
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập tài khoản và mật khẩu");
        return;
    }

    fetch("/api/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status !== "ok") {
            alert(data.message);
            return;
        }

        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);

        if (data.profile_completed) {
            window.location.href = "/";
        } else {
            window.location.href = "/profile";
        }
    });
}

function getCurrentUserId() {
    return localStorage.getItem("user_id");
}

function updateAuthArea() {
    const authArea = document.getElementById("authArea");
    if (!authArea) return;

    const username = localStorage.getItem("username");

    if (username) {
        authArea.innerHTML = `
            <div class="user-menu" onclick="window.location.href='/profile'">
                👤 ${username}
            </div>
        `;
    } else {
        authArea.innerHTML = `
            <a href="/login">Đăng nhập</a>
            <a href="/register">Đăng ký</a>
        `;
    }
}
window.addEventListener("load", updateAuthArea);
function saveProfile() {

    const userId = localStorage.getItem("user_id");

    const full_name =
        document.getElementById("fullName").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const address =
        document.getElementById("address").value.trim();

    if (!full_name || !phone || !address) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const phoneRegex = /^0\d{9}$/;

    if (!phoneRegex.test(phone)) {
        alert("Số điện thoại không hợp lệ");
        return;
    }

    fetch("/api/profile/update", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            user_id: Number(userId),
            full_name,
            phone,
            address
        })
    })

    .then(res => res.json())

    .then(data => {

        if (data.status === "ok") {

            alert("Cập nhật thành công");

            window.location.href = "/";
        }
    });
}
window.addEventListener("load", updateAuthArea);
function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");

    window.location.href = "/";
}
