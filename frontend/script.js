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

    fetch("/api/products")
        .then(res => res.json())
        .then(data => {
            allProducts = data;
            renderProducts(data);
        })
        .catch(() => {
            showMessage("Không tải được danh sách sản phẩm", "error");
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
        })
        .catch(() => {
            showMessage("Không tải được danh mục sản phẩm", "error");
        });
}

function loadRecommend() {
    const box = document.getElementById("products");
    if (!box) return;

    fetch("/api/recommend")
        .then(res => res.json())
        .then(data => {
            const empty = document.getElementById("emptyRecommend");

            if (!data || data.length === 0) {
                box.innerHTML = "";

                if (empty) {
                    empty.style.display = "block";
                }

                return;
            }

            if (empty) {
                empty.style.display = "none";
            }

            allProducts = data;
            renderProducts(data);
        })
        .catch(() => {
            showMessage("Không tải được sản phẩm gợi ý", "error");
        });
}

function openProduct(id) {
    fetch(`/api/product/${id}`)
        .then(res => res.json())
        .then(p => {
            if (p.status === "error") {
                showMessage("Không tìm thấy sản phẩm", "error");
                return;
            }

            const detail = document.getElementById("productDetail");
            const modal = document.getElementById("productModal");

            if (!detail || !modal) return;

            detail.innerHTML = `
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

            modal.style.display = "block";
            saveEvent(id, "view");
        })
        .catch(() => {
            showMessage("Lỗi mở chi tiết sản phẩm", "error");
        });
}

function closeModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.style.display = "none";
}

/* ================= SEARCH ================= */

function searchProducts() {
    const input = document.getElementById("searchInput");

    if (!input) return;

    const keyword = input.value.toLowerCase().trim();

    if (!keyword) {
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p =>
        String(p.name || "").toLowerCase().includes(keyword) ||
        String(p.category || "").toLowerCase().includes(keyword)
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

    if (element) {
        element.classList.add("active");
    }

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
    }).catch(() => {});
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
            showMessage(data.message || "Thêm vào giỏ hàng thất bại", "error");
            return;
        }

        saveEvent(id, "add_to_cart");
        showMessage("Đã thêm vào giỏ hàng", "success");
    })
    .catch(() => {
        showMessage("Thêm vào giỏ hàng thất bại", "error");
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

                if (totalBox) {
                    totalBox.innerHTML = `Tổng tiền: <b>0₫</b>`;
                }

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
        })
        .catch(() => {
            showMessage("Không tải được giỏ hàng", "error");
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
            showMessage(data.message || "Không thể tăng số lượng", "error");
        }
    })
    .catch(() => {
        showMessage("Không thể tăng số lượng", "error");
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
            showMessage(data.message || "Không thể giảm số lượng", "error");
        }
    })
    .catch(() => {
        showMessage("Không thể giảm số lượng", "error");
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
            showMessage(data.message || "Không thể xoá sản phẩm", "error");
        }
    })
    .catch(() => {
        showMessage("Không thể xoá sản phẩm", "error");
    });
}

function checkoutCart() {
    fetch("/cart/checkout", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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
            showMessage("Đặt hàng thành công", "success", "/orders");
            return;
        }

        showMessage(data.message || "Đặt hàng thất bại", "error");
    })
    .catch(() => {
        showMessage("Đặt hàng thất bại", "error");
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

            if (checkoutModal) {
                checkoutModal.style.display = "block";
            } else {
                showMessage("Không tìm thấy form đặt hàng", "error");
            }
        })
        .catch(() => {
            showMessage("Không tải được thông tin đặt hàng", "error");
        });
}

function closeCheckout() {
    const checkoutModal = document.getElementById("checkoutModal");
    if (checkoutModal) checkoutModal.style.display = "none";
}

function submitOrder() {
    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");
    const addressInput = document.getElementById("customerAddress");

    if (!nameInput || !phoneInput || !addressInput) {
        showMessage("Không tìm thấy form đặt hàng", "error");
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    if (!name || !phone || !address) {
        showMessage("Vui lòng nhập đầy đủ thông tin đặt hàng", "error");
        return;
    }

    if (!currentOrderItemId) {
        showMessage("Không tìm thấy sản phẩm cần đặt", "error");
        return;
    }

    fetch("/cart/checkout", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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
            closeCheckout();
            showMessage("Đặt hàng thành công", "success", "/orders");
            return;
        }

        showMessage(data.message || "Đặt hàng thất bại", "error");
    })
    .catch(() => {
        showMessage("Lỗi xác nhận đặt hàng", "error");
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
        else showMessage("Vui lòng nhập đầy đủ thông tin", "error");
        return;
    }

    if (password.length < 6) {
        if (errorBox) errorBox.innerText = "Mật khẩu phải có ít nhất 6 ký tự";
        else showMessage("Mật khẩu phải có ít nhất 6 ký tự", "error");
        return;
    }

    if (password !== confirm) {
        if (errorBox) errorBox.innerText = "Mật khẩu nhập lại không khớp";
        else showMessage("Mật khẩu nhập lại không khớp", "error");
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
            else showMessage(data.message, "error");
            return;
        }

        showMessage("Đăng ký thành công", "success", "/profile");
    })
    .catch(() => {
        showMessage("Đăng ký thất bại", "error");
    });
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("login-error");

    if (errorBox) errorBox.innerText = "";

    if (!username || !password) {
        if (errorBox) errorBox.innerText = "Vui lòng nhập tài khoản và mật khẩu";
        else showMessage("Vui lòng nhập tài khoản và mật khẩu", "error");
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
            else showMessage(data.message || "Đăng nhập thất bại", "error");
            return;
        }

        if (data.profile_completed) {
            showMessage("Đăng nhập thành công", "success", "/");
        } else {
            showMessage("Đăng nhập thành công", "success", "/profile");
        }
    })
    .catch(() => {
        showMessage("Đăng nhập thất bại", "error");
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
        else showMessage("Vui lòng nhập đầy đủ thông tin", "error");
        return;
    }

    const phoneRegex = /^0\d{9}$/;

    if (!phoneRegex.test(phone)) {
        if (errorBox) errorBox.innerText = "Số điện thoại không hợp lệ";
        else showMessage("Số điện thoại không hợp lệ", "error");
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
            showMessage("Cập nhật thành công", "success", "/");
        } else {
            if (errorBox) errorBox.innerText = data.message;
            else showMessage(data.message || "Cập nhật thất bại", "error");
        }
    })
    .catch(() => {
        showMessage("Cập nhật thất bại", "error");
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
        })
        .catch(() => {
            showMessage("Không tải được lịch sử mua hàng", "error");
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

/* ================= MESSAGE MODAL ================= */

function showMessage(message, type = "success", redirectUrl = null) {
    const modal = document.getElementById("messageModal");
    const box = document.getElementById("messageBox");
    const title = document.getElementById("messageTitle");
    const text = document.getElementById("messageText");
    const icon = document.getElementById("messageIcon");

    if (!modal || !box || !title || !text || !icon) {
        console.log(message);

        if (redirectUrl) {
            window.location.href = redirectUrl;
        }

        return;
    }

    box.classList.remove("message-success", "message-error");

    if (type === "error") {
        title.innerText = "Thất bại";
        icon.innerHTML = "×";
        box.classList.add("message-error");
    } else {
        title.innerText = "Thành công";
        icon.innerHTML = "✓";
        box.classList.add("message-success");
    }

    text.innerText = message;

    modal.dataset.redirect = redirectUrl || "";
    modal.style.display = "flex";

    setTimeout(() => {
        modal.style.opacity = "1";
    }, 10);
}

function closeMessage() {
    const modal = document.getElementById("messageModal");

    if (!modal) return;

    const redirectUrl = modal.dataset.redirect || "";

    modal.dataset.redirect = "";
    document.body.style.overflow = "auto";
    modal.style.opacity = "0";

    setTimeout(() => {
        modal.style.display = "none";

        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    }, 200);
}

/* ================= INIT ================= */

window.addEventListener("load", function () {
    if (window.location.pathname === "/recommend") {
        loadRecommend();
    } else {
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