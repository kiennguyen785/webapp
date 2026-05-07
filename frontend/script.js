let allProducts = [];
let currentOrderItemId = null;
let currentIndex = 0;

const images = [
    "https://down-vn.img.susercontent.com/file/sg-11134258-8261n-mmfw9oka07ig62@resize_w1594_nl.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134258-81ztc-mmeqgc5lb0g832@resize_w1920_nl.webp"
];

/* ================= PRODUCT ================= */

function loadProducts() {
    const box = document.getElementById("products");
    if (!box) return;

    fetch("api/products")
        .then(res => res.json())
        .then(data => {
            allProducts = data;
            renderProducts(data);
        });
}

function renderProducts(products) {
    const box = document.getElementById("products");
    if (!box) return;

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
        .then(data => {
            allProducts = data;
            renderProducts(data);
        });
}
function loadRecommend() {

    const box = document.getElementById("products");

    if (!box) return;

    fetch("/api/recommend")

        .then(res => res.json())

        .then(data => {

            if (data.length === 0) {

                box.innerHTML = "";

                const empty = document.getElementById("emptyRecommend");

                if (empty) {
                    empty.style.display = "block";
                }

                return;
            }

            const empty = document.getElementById("emptyRecommend");

            if (empty) {
                empty.style.display = "none";
            }

            allProducts = data;

            renderProducts(data);
        });
}
function openProduct(id) {
    fetch(`/api/product/${id}`)
        .then(res => res.json())
        .then(p => {
            if (p.status === "error") {
                showToast("Không tìm thấy sản phẩm");
                return;
            }

            document.getElementById("productDetail").innerHTML = `
                <div class="detail-box">
                    <div>
                        <img src="${p.image}" class="detail-img"
                             onerror="this.src='https://picsum.photos/500'">
                    </div>

                    <div class="detail-info">
                        <h2>${p.name}</h2>
                        <div class="detail-category">Danh mục: ${p.category}</div>
                        <div class="detail-price">${Number(p.price).toLocaleString()}₫</div>
                        <div class="detail-stock">Còn lại: ${p.quantity}</div>

                        <p class="detail-desc">
                            ${p.description || "Sản phẩm hiện chưa có mô tả chi tiết."}
                        </p>

                        <div class="detail-actions">
                            <button class="btn-back" onclick="closeModal()">Quay lại</button>
                            <button class="btn-cart" ${Number(p.quantity) <= 0 ? "disabled" : ""} onclick="addToCart(${p.item_id})">Giỏ hàng</button>
                            <button class="btn-buy" ${Number(p.quantity) <= 0 ? "disabled" : ""} onclick="openCheckout(${p.item_id})">Đặt hàng</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById("productModal").style.display = "block";
            saveEvent(id, "view");
        });
}

function closeModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.style.display = "none";
}

/* ================= SEARCH ================= */

function searchProducts() {
    const input = document.getElementById("searchInput");
    const title = document.getElementById("search-result-title");

    if (!input) return;

    const keyword = input.value.toLowerCase().trim();

    if (!keyword) {
        if (title) title.innerHTML = "";
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.category.toLowerCase().includes(keyword)
    );

    renderProducts(filtered);

    const productsBox = document.getElementById("products");
    if (productsBox) {
        productsBox.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

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

/* ================= EVENT ================= */

function saveEvent(itemId, type) {
    fetch("/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            item_id: itemId,
            event_type: type
        })
    });
}

/* ================= CART ================= */

function addToCart(id) {
    fetch("/cart/add", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            item_id: id,
            quantity: 1
        })
    })
    .then(res => {
        if (res.status === 401) {
            window.location.href = "/login";
            return null;
        }

        return res.json();
    })
    .then(data => {
        if (!data) return;

        if (data.status === "error") {
            showToast(data.message);
            return;
        }

        saveEvent(id, "add_to_cart");
        showToast("Đã thêm vào giỏ hàng");
    });
}

function goToCart() {
    window.location.href = "/cart";
}

function loadCart() {
    const box = document.getElementById("cartItems");
    if (!box) return;

    fetch("/api/cart")
        .then(res => {
            if (res.status === 401) {
                window.location.href = "/login";
                return null;
            }
            return res.json();
        })
        .then(items => {
            if (!items) return;

            const totalBox = document.getElementById("cartTotal");

            if (items.length === 0) {
                box.innerHTML = `<div class="empty-cart">Giỏ hàng đang trống</div>`;
                if (totalBox) totalBox.innerHTML = `Tổng tiền: <b>0₫</b>`;
                return;
            }

            let html = "";
            let total = 0;

            items.forEach(item => {
                const price = Number(item.price);
                const quantity = Number(item.quantity);
                const itemTotal = price * quantity;

                total += itemTotal;

                html += `
                    <div class="cart-item">
                        <img src="${item.image}" onerror="this.src='https://picsum.photos/300'">

                        <div class="cart-info">
                            <div class="cart-name">${item.name}</div>
                            <div class="cart-stock">Còn lại: ${item.stock}</div>
                        </div>

                        <div class="cart-price-box">
                            <div class="cart-label">Đơn giá</div>
                            <div class="cart-price">${price.toLocaleString()}₫</div>
                        </div>

                        <div class="cart-qty-box">
                            <div class="cart-label">Số lượng</div>
                            <div class="qty-box">
                                <button onclick="decreaseQty(${item.cart_id})">-</button>
                                <span>${quantity}</span>
                                <button onclick="increaseQty(${item.cart_id})">+</button>
                            </div>
                        </div>

                        <div class="cart-total-box">
                            <div class="cart-label">Tổng tiền</div>
                            <div class="cart-item-total">${itemTotal.toLocaleString()}₫</div>
                        </div>

                        <button class="remove-btn" onclick="removeCart(${item.cart_id})">
                            Xóa
                        </button>
                    </div>
                `;
            });

            box.innerHTML = html;

            if (totalBox) {
                totalBox.innerHTML = `
                    Tổng tiền:
                    <b>${total.toLocaleString()}₫</b>
                `;
            }
        });
}
function increaseQty(cartId) {
    fetch("/cart/update", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            cart_id: cartId,
            action: "increase"
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            loadCart();
        } else {
            showToast(data.message);
        }
    });
}

function decreaseQty(cartId) {
    fetch("/cart/update", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            cart_id: cartId,
            action: "decrease"
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            loadCart();
        } else {
            showToast(data.message);
        }
    });
}

function removeCart(cartId) {
    fetch("/cart/remove", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            cart_id: cartId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            loadCart();
        } else {
            showToast(data.message);
        }
    });
}

function checkoutCart() {
    fetch("/cart/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    })
    .then(res => {
        if (res.status === 401) {
            window.location.href = "/login";
            return null;
        }

        return res.json();
    })
    .then(data => {
        if (!data) return;

        if (data.status === "ok") {
            showToast("Đặt hàng thành công");

            setTimeout(() => {
                window.location.href = "/orders";
            }, 1000);

            return;
        }

        showToast(data.message);
    });
}

/* ================= CHECKOUT MODAL ================= */

function openCheckout(itemId) {
    currentOrderItemId = itemId;

    fetch("/api/profile")
        .then(res => {
            if (res.status === 401) {
                window.location.href = "/login";
                return null;
            }

            return res.json();
        })
        .then(data => {
            if (!data) return;

            const nameInput = document.getElementById("customerName");
            const phoneInput = document.getElementById("customerPhone");
            const addressInput = document.getElementById("customerAddress");

            if (nameInput) nameInput.value = data.full_name || "";
            if (phoneInput) phoneInput.value = data.phone || "";
            if (addressInput) addressInput.value = data.address || "";

            const checkoutModal = document.getElementById("checkoutModal");
            if (checkoutModal) checkoutModal.style.display = "block";
        });
}

function closeCheckout() {
    const checkoutModal = document.getElementById("checkoutModal");
    if (checkoutModal) checkoutModal.style.display = "none";
}

function submitOrder() {
    if (!currentOrderItemId) {
        showToast("Không tìm thấy sản phẩm cần đặt");
        return;
    }

    fetch("/cart/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            item_id: currentOrderItemId,
            quantity: 1
        })
    })
    .then(res => {
        if (res.status === 401) {
            window.location.href = "/login";
            return null;
        }

        return res.json();
    })
    .then(data => {
        if (!data) return;

        if (data.status === "ok") {
            showToast("Đặt hàng thành công");

            setTimeout(() => {
                window.location.href = "/orders";
            }, 1000);

            return;
        }

        showToast(data.message);
    });
}

function buyNow(id) {
    openCheckout(id);
}

/* ================= AUTH ================= */

function register() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmInput = document.getElementById("confirmPassword");
    const confirm = confirmInput ? confirmInput.value.trim() : password;
    const errorBox = document.getElementById("register-error");

    if (errorBox) errorBox.innerText = "";

    if (!username || !password || !confirm) {
        if (errorBox) errorBox.innerText = "Vui lòng nhập đầy đủ thông tin";
        else alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    if (password.length < 6) {
        if (errorBox) errorBox.innerText = "Mật khẩu phải có ít nhất 6 ký tự";
        else alert("Mật khẩu phải có ít nhất 6 ký tự");
        return;
    }

    if (password !== confirm) {
        if (errorBox) errorBox.innerText = "Mật khẩu nhập lại không khớp";
        else alert("Mật khẩu nhập lại không khớp");
        return;
    }

    fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username,
            password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "error") {
            if (errorBox) errorBox.innerText = data.message;
            else alert(data.message);
            return;
        }

        window.location.href = "/profile";
    });
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("login-error");

    if (errorBox) errorBox.innerText = "";

    if (!username || !password) {
        if (errorBox) errorBox.innerText = "Vui lòng nhập tài khoản và mật khẩu";
        else alert("Vui lòng nhập tài khoản và mật khẩu");
        return;
    }

    fetch("/api/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username,
            password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status !== "ok") {
            if (errorBox) errorBox.innerText = data.message;
            else alert(data.message);
            return;
        }

        if (data.profile_completed) {
            window.location.href = "/";
        } else {
            window.location.href = "/profile";
        }
    });
}

function logout() {
    window.location.href = "/logout";
}

/* ================= PROFILE ================= */

function loadProfile() {
    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const address = document.getElementById("address");

    if (!fullName || !phone || !address) return;

    fetch("/api/profile")
        .then(res => {
            if (res.status === 401) {
                window.location.href = "/login";
                return null;
            }

            return res.json();
        })
        .then(data => {
            if (!data) return;

            fullName.value = data.full_name || "";
            phone.value = data.phone || "";
            address.value = data.address || "";
        });
}

function saveProfile() {
    const full_name = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const errorBox = document.getElementById("profile-error");

    if (errorBox) errorBox.innerText = "";

    if (!full_name || !phone || !address) {
        if (errorBox) errorBox.innerText = "Vui lòng nhập đầy đủ thông tin";
        else alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const phoneRegex = /^0\d{9}$/;

    if (!phoneRegex.test(phone)) {
        if (errorBox) errorBox.innerText = "Số điện thoại không hợp lệ";
        else alert("Số điện thoại không hợp lệ");
        return;
    }

    fetch("/api/profile/update", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            full_name,
            phone,
            address
        })
    })
    .then(res => {
        if (res.status === 401) {
            window.location.href = "/login";
            return null;
        }

        return res.json();
    })
    .then(data => {
        if (!data) return;

        if (data.status === "ok") {
            showToast("Cập nhật thành công");
            setTimeout(() => {
                window.location.href = "/";
            }, 800);
        } else {
            if (errorBox) errorBox.innerText = data.message;
            else alert(data.message);
        }
    });
}

/* ================= ORDERS ================= */

function loadOrders() {
    const box = document.getElementById("orders");
    if (!box) return;

    fetch("/api/orders")
        .then(res => res.json())
        .then(items => {
            if (items.length === 0) {
                box.innerHTML = `
                    <div class="empty-cart">
                        Bạn chưa có đơn hàng nào
                    </div>
                `;
                return;
            }

            let html = "";

            items.forEach(o => {
                html += `
                    <div class="order-item">
                        <img src="${o.image}" onerror="this.src='https://picsum.photos/300'">

                        <div class="order-info">
                            <h3>Đơn hàng #${o.order_id}</h3>
                            <p>Ngày đặt: ${o.order_time}</p>
                            <p>Sản phẩm: ${o.product_name}</p>
                            <p>Số lượng: ${o.quantity}</p>
                            <p>Giá: ${Number(o.price).toLocaleString()}₫</p>
                            <b>Tổng đơn: ${Number(o.total_price).toLocaleString()}₫</b>
                        </div>
                    </div>
                `;
            });

            box.innerHTML = html;
        });
}
/* ================= SLIDER ================= */

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

/* ================= TOAST ================= */

function showToast(message) {
    const toast = document.getElementById("toast");
    const msg = document.getElementById("toast-msg");

    if (!toast || !msg) {
        alert(message);
        return;
    }

    msg.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function closeToast() {
    const toast = document.getElementById("toast");
    if (toast) toast.classList.remove("show");
}

/* ================= INIT ================= */

window.addEventListener("load", function () {

    if (window.location.pathname === "/recommend") {
        loadRecommend();
    }
    else {
        loadProducts();
    }

    loadCart();
    loadProfile();
    loadOrders();

    showSlide(0);

    const input = document.getElementById("searchInput");

    if (input) {
        input.addEventListener("keydown", function (e) {

            if (e.key === "Enter") {
                searchProducts();
            }

        });
    }

    setInterval(nextSlide, 3000);

});