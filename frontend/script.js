let allProducts = [];
let currentOrderItemId = null;
let currentOrderVariantId = null;
let selectedVariant = null;
let currentVariants = [];
let currentIndex = 0;

const images = [
    "https://down-vn.img.susercontent.com/file/sg-11134258-8261n-mmfw9oka07ig62@resize_w1594_nl.webp",
    "https://down-vn.img.susercontent.com/file/vn-11134258-81ztc-mmeqgc5lb0g832@resize_w1920_nl.webp"
];

/* ================= PRODUCT ================= */

function loadProducts() {

    const box = document.getElementById("products");

    if (!box) return;

    const url =
        window.location.pathname === "/"
            ? "/api/products?limit=15"
            : "/api/products";

    fetch(url)

        .then(res => res.json())

        .then(data => {

            allProducts = data;

            renderProducts(data);

        })

        .catch(() => {

            showMessage(
                "Không tải được sản phẩm",
                "error"
            );

        });
}

function renderProducts(products) {

    const box = document.getElementById("products");

    if (!box) return;

    let html = "";

    products.forEach(p => {

        const outStock = Number(p.quantity) <= 0;

        html += `
            <div class="card">

                <div class="thumb-wrap">

                    <img
                        src="${p.image || ''}"
                        class="product-img"
                        onerror="this.src='https://picsum.photos/300'"
                    >

                    ${
                        outStock
                        ? `<div class="out-stock">Hết hàng</div>`
                        : ``
                    }

                </div>

                <div class="product-info">

                    <div class="product-name">
                        ${p.name}
                    </div>

                    <div class="price">
                        ${Number(p.price || 0).toLocaleString()}₫
                    </div>

                    <div class="stock">
                        Còn lại: ${p.quantity ?? 0}
                    </div>

                    <div class="card-actions">

                        <button onclick="openProduct(${p.item_id})">
                            Xem
                        </button>

                        <button
                            ${outStock ? "disabled" : ""}
                            onclick="openProduct(${p.item_id})"
                        >
                            Giỏ hàng
                        </button>

                        <button
                            ${outStock ? "disabled" : ""}
                            onclick="openProduct(${p.item_id})"
                        >
                            Mua
                        </button>

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
function loadRecommend() {

    const box = document.getElementById("products");

    if (!box) return;

    fetch("/api/recommend")
        .then(res => res.json())
        .then(data => {

            allProducts = data;

            renderProducts(data);

        });
}

function openProduct(id) {

    fetch(`/api/product/${id}`)
        .then(res => res.json())
        .then(p => {

            if (p.status === "error") {
                showMessage(p.message, "error");
                return;
            }

            currentVariants = p.variants || [];
            selectedVariant = null;
            currentOrderItemId = p.item_id;
            currentOrderVariantId = null;

            const colors = [...new Set(currentVariants.map(v => v.color).filter(Boolean))];
            const storages = [...new Set(currentVariants.map(v => v.storage).filter(Boolean))];
            const sizes = [...new Set(currentVariants.map(v => v.size).filter(Boolean))];
            const weights = [...new Set(currentVariants.map(v => v.weight).filter(Boolean))];

            document.getElementById("productDetail").innerHTML = `
                <div class="detail-box">

                    <img
                        id="productImage"
                        class="detail-img"
                        src="${p.image || ''}"
                        onerror="this.src='https://picsum.photos/300'"
                    >

                    <div class="detail-info">

                        <h2>${p.name}</h2>

                        <div class="detail-category">
                            Danh mục: ${p.category || ""}
                        </div>

                        <div id="productPrice" class="detail-price">
                            ${Number(p.price || 0).toLocaleString()}đ
                        </div>

                        <div class="detail-desc">
                            ${p.description || "Chưa có mô tả"}
                        </div>

                        ${
                            colors.length > 0
                            ? `
                                <div class="variant-group">
                                    <b>Màu:</b>
                                    <div>${renderVariantButtons("color", colors)}</div>
                                </div>
                            `
                            : ""
                        }

                        ${
                            storages.length > 0
                            ? `
                                <div class="variant-group">
                                    <b>Bộ nhớ:</b>
                                    <div>${renderVariantButtons("storage", storages)}</div>
                                </div>
                            `
                            : ""
                        }

                        ${
                            sizes.length > 0
                            ? `
                                <div class="variant-group">
                                    <b>Size:</b>
                                    <div>${renderVariantButtons("size", sizes)}</div>
                                </div>
                            `
                            : ""
                        }

                        ${
                            weights.length > 0
                            ? `
                                <div class="variant-group">
                                    <b>Khối lượng:</b>
                                    <div>${renderVariantButtons("weight", weights)}</div>
                                </div>
                            `
                            : ""
                        }

                        ${
                            p.size_guide
                            ? `
                                <div class="size-guide">
                                    <b>Hướng dẫn chọn size:</b>
                                    <p>${p.size_guide}</p>
                                </div>
                            `
                            : ""
                        }

                        <div class="detail-actions">

                            <button
                                class="btn-cart"
                                onclick="addVariantToCart(${p.item_id})">
                                Thêm giỏ hàng
                            </button>

                            <button
                                class="btn-buy"
                                onclick="buyNowWithVariant(${p.item_id})">
                                Mua ngay
                            </button>

                        </div>

                    </div>

                </div>
            `;

            document.getElementById("productModal").style.display = "block";

            saveEvent(id, "view", null);
        });
}
function renderVariantButtons(type, values) {

    let html = "";

    values.forEach(value => {

        html += `
            <button
                class="variant-btn"
                onclick="selectVariant(
                    '${type}',
                    '${value}',
                    this
                )"
            >
                ${value}
            </button>
        `;
    });

    return html;
}

function selectVariant(type, value, btn) {

    if (!selectedVariant) {
        selectedVariant = {};
    }

    selectedVariant[type] = value;

    const group = btn.parentElement;

    group.querySelectorAll(".variant-btn")
        .forEach(b => {
            b.classList.remove("active-variant");
        });

    btn.classList.add("active-variant");

    const variant = currentVariants.find(v => {

        return (
            (!selectedVariant.color || v.color === selectedVariant.color) &&
            (!selectedVariant.storage || v.storage === selectedVariant.storage) &&
            (!selectedVariant.size || v.size === selectedVariant.size) &&
            (!selectedVariant.weight || v.weight === selectedVariant.weight)
        );
    });

    if (!variant) return;

    selectedVariant.variant_id = variant.variant_id;

    currentOrderVariantId = variant.variant_id;

    if (variant.image_url) {

        document.getElementById(
            "productImage"
        ).src = variant.image_url;
    }

    if (variant.price) {

        document.getElementById(
            "productPrice"
        ).innerHTML =
            Number(variant.price).toLocaleString() + "đ";
    }
}

function closeModal() {

    document.getElementById(
        "productModal"
    ).style.display = "none";
}

/* ================= SEARCH ================= */

function searchProducts() {

    const input = document.getElementById(
        "searchInput"
    );

    if (!input) return;

    const keyword =
        input.value.toLowerCase().trim();

    if (!keyword) {

        renderProducts(allProducts);

        return;
    }

    const filtered = allProducts.filter(p => {

        return (
            String(p.name || "")
                .toLowerCase()
                .includes(keyword)

            ||

            String(p.category || "")
                .toLowerCase()
                .includes(keyword)
        );
    });

    renderProducts(filtered);
}

/* ================= EVENT ================= */

function saveEvent(
    itemId,
    type,
    variantId = null
) {

    fetch("/event", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            item_id: itemId,
            variant_id: variantId,
            event_type: type
        })
    }).catch(() => {});
}

/* ================= CART ================= */

function addVariantToCart(itemId) {

    if (
        currentVariants.length > 0 &&
        !selectedVariant?.variant_id
    ) {

        showMessage(
            "Vui lòng chọn phân loại sản phẩm",
            "error"
        );

        return;
    }

    fetch("/cart/add", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            item_id: itemId,

            variant_id:
                selectedVariant?.variant_id || null,

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

            saveEvent(
                itemId,
                "add_to_cart",
                selectedVariant?.variant_id || null
            );

            showMessage(
                "Đã thêm vào giỏ hàng",
                "success"
            );

        } else {

            showMessage(
                data.message || "Thêm thất bại",
                "error"
            );
        }
    });
}

function loadCart() {

    const box = document.getElementById(
        "cartItems"
    );

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

            if (items.length === 0) {

                box.innerHTML = `
                    <div class="empty-cart">
                        Giỏ hàng trống
                    </div>
                `;

                return;
            }

            let html = "";

            let total = 0;

            items.forEach(item => {

                const price =
                    Number(item.price || 0);

                const qty =
                    Number(item.quantity || 0);

                const itemTotal =
                    price * qty;

                total += itemTotal;

                const variantText = [
                    item.color,
                    item.size,
                    item.storage,
                    item.weight
                ]
                .filter(Boolean)
                .join(" | ");

                html += `
                    <div class="cart-item">

                        <img
                            src="${item.image || ''}"
                            onerror="this.src='https://picsum.photos/300'"
                        >

                        <div class="cart-info">

                            <div class="cart-name">
                                ${item.name}
                            </div>

                            ${
                                variantText
                                ? `
                                    <div class="cart-variant">
                                        ${variantText}
                                    </div>
                                `
                                : ``
                            }

                            <div class="cart-stock">
                                Còn lại: ${item.stock}
                            </div>

                        </div>

                        <div class="cart-price-box">

                            <div class="cart-label">
                                Đơn giá
                            </div>

                            <div class="cart-price">
                                ${price.toLocaleString()}₫
                            </div>

                        </div>

                        <div class="cart-qty-box">

                            <div class="cart-label">
                                Số lượng
                            </div>

                            <div class="qty-box">

                                <button onclick="decreaseQty(${item.cart_id})">
                                    -
                                </button>

                                <span>${qty}</span>

                                <button onclick="increaseQty(${item.cart_id})">
                                    +
                                </button>

                            </div>

                        </div>

                        <div class="cart-total-box">

                            <div class="cart-label">
                                Tổng tiền
                            </div>

                            <div class="cart-item-total">
                                ${itemTotal.toLocaleString()}₫
                            </div>

                        </div>

                        <button
                            class="remove-btn"
                            onclick="removeCart(${item.cart_id})"
                        >
                            Xóa
                        </button>

                    </div>
                `;
            });

            box.innerHTML = html;

            const totalBox =
                document.getElementById(
                    "cartTotal"
                );

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

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            cart_id: cartId,
            action: "increase"
        })
    })
    .then(res => res.json())
    .then(() => {
        loadCart();
    });
}

function decreaseQty(cartId) {

    fetch("/cart/update", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            cart_id: cartId,
            action: "decrease"
        })
    })
    .then(res => res.json())
    .then(() => {
        loadCart();
    });
}

function removeCart(cartId) {

    fetch("/cart/remove", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            cart_id: cartId
        })
    })
    .then(res => res.json())
    .then(() => {
        loadCart();
    });
}

/* ================= ORDER ================= */

function buyNowWithVariant(itemId) {

    if (
        currentVariants.length > 0 &&
        !selectedVariant?.variant_id
    ) {

        showMessage(
            "Vui lòng chọn phân loại",
            "error"
        );

        return;
    }

    currentOrderItemId = itemId;

    currentOrderVariantId =
        selectedVariant?.variant_id || null;

    document.getElementById(
        "checkoutModal"
    ).style.display = "block";
}

function closeCheckout() {

    document.getElementById(
        "checkoutModal"
    ).style.display = "none";
}

function submitOrder() {

    fetch("/cart/checkout", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            item_id: currentOrderItemId,

            variant_id: currentOrderVariantId,

            quantity: 1
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "ok") {

            closeCheckout();

            showMessage(
                "Đặt hàng thành công",
                "success",
                "/orders"
            );

        } else {

            showMessage(
                data.message || "Đặt hàng thất bại",
                "error"
            );
        }
    });
}

/* ================= LOGIN ================= */

function login() {

    const username =
        document.getElementById(
            "username"
        ).value.trim();

    const password =
        document.getElementById(
            "password"
        ).value.trim();

    fetch("/api/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username,
            password
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "ok") {

            showMessage(
                "Đăng nhập thành công",
                "success",
                "/"
            );

        } else {

            showMessage(
                data.message,
                "error"
            );
        }
    });
}

/* ================= REGISTER ================= */

function register() {

    const username =
        document.getElementById(
            "username"
        ).value.trim();

    const password =
        document.getElementById(
            "password"
        ).value.trim();

    const confirm =
        document.getElementById(
            "confirmPassword"
        )?.value.trim();

    if (confirm && password !== confirm) {

        showMessage(
            "Mật khẩu không khớp",
            "error"
        );

        return;
    }

    fetch("/api/register", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username,
            password
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "ok") {

            showMessage(
                "Đăng ký thành công",
                "success",
                "/profile"
            );

        } else {

            showMessage(
                data.message,
                "error"
            );
        }
    });
}

/* ================= PROFILE ================= */

function loadProfile() {

    const fullName =
        document.getElementById("fullName");

    if (!fullName) return;

    fetch("/api/profile")
        .then(res => res.json())
        .then(data => {

            document.getElementById(
                "fullName"
            ).value =
                data.full_name || "";

            document.getElementById(
                "phone"
            ).value =
                data.phone || "";

            document.getElementById(
                "address"
            ).value =
                data.address || "";
        });
}

function saveProfile() {

    const full_name =
        document.getElementById(
            "fullName"
        ).value.trim();

    const phone =
        document.getElementById(
            "phone"
        ).value.trim();

    const address =
        document.getElementById(
            "address"
        ).value.trim();

    fetch("/api/profile/update", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            full_name,
            phone,
            address
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "ok") {

            showMessage(
                "Cập nhật thành công",
                "success",
                "/"
            );

        } else {

            showMessage(
                data.message,
                "error"
            );
        }
    });
}

/* ================= ORDERS ================= */

function loadOrders() {

    const box =
        document.getElementById(
            "orders"
        );

    if (!box) return;

    fetch("/api/orders")
        .then(res => res.json())
        .then(items => {

            if (items.length === 0) {

                box.innerHTML = `
                    <div class="empty-cart">
                        Chưa có đơn hàng
                    </div>
                `;

                return;
            }

            let html = "";

            items.forEach(o => {

                const variantText = [
                    o.color,
                    o.size,
                    o.storage,
                    o.weight
                ]
                .filter(Boolean)
                .join(" | ");

                html += `
                    <div class="order-item">

                        <img
                            src="${o.image || ''}"
                            onerror="this.src='https://picsum.photos/300'"
                        >

                        <div class="order-info">

                            <h3>
                                Đơn hàng #${o.order_id}
                            </h3>

                            <p>
                                Ngày đặt:
                                ${o.order_time}
                            </p>

                            <p>
                                Sản phẩm:
                                ${o.product_name}
                            </p>

                            ${
                                variantText
                                ? `
                                    <p>
                                        Phân loại:
                                        ${variantText}
                                    </p>
                                `
                                : ``
                            }

                            <p>
                                Số lượng:
                                ${o.quantity}
                            </p>

                            <p>
                                Giá:
                                ${Number(o.price || 0).toLocaleString()}₫
                            </p>

                            <b>
                                Tổng:
                                ${Number(o.total_price || 0).toLocaleString()}₫
                            </b>

                        </div>

                    </div>
                `;
            });

            box.innerHTML = html;
        });
}

/* ================= MESSAGE ================= */

function showMessage(
    message,
    type = "success",
    redirect = null
) {

    const modal =
        document.getElementById(
            "messageModal"
        );

    if (!modal) {

        alert(message);

        if (redirect) {
            window.location.href = redirect;
        }

        return;
    }

    document.getElementById(
        "messageText"
    ).innerText = message;

    modal.dataset.redirect =
        redirect || "";

    modal.style.display = "flex";
}

function closeMessage() {

    const modal =
        document.getElementById(
            "messageModal"
        );

    const redirect =
        modal.dataset.redirect;

    modal.style.display = "none";

    if (redirect) {
        window.location.href = redirect;
    }
}

/* ================= SLIDER ================= */

function showSlide(index) {

    const banner =
        document.getElementById(
            "banner"
        );

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

/* ================= INIT ================= */

window.addEventListener("load", () => {

    if (
        window.location.pathname === "/recommend"
    ) {

        loadRecommend();

    } else {

        loadProducts();
    }

    loadCart();

    loadProfile();

    loadOrders();

    loadSellerProducts();

    loadAdminUsers();

    showSlide(0);

    setInterval(nextSlide, 3000);
});
/* ================= ADMIN ================= */

function loadAdminUsers() {

    const box = document.getElementById("adminUsers");

    if (!box) return;

    const keyword =
        document.getElementById(
            "adminSearchInput"
        )?.value.toLowerCase() || "";

    fetch("/api/admin/users")

        .then(res => {

            if (res.status === 401) {

                window.location.href = "/login";

                return null;
            }

            if (res.status === 403) {

                showMessage(
                    "Bạn không có quyền admin",
                    "error",
                    "/"
                );

                return null;
            }

            return res.json();
        })

        .then(users => {

            if (!users) return;

            const filtered = users.filter(u => {

                return (
                    String(u.username || "")
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    String(u.full_name || "")
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    String(u.role || "")
                        .toLowerCase()
                        .includes(keyword)
                );
            });

            if (filtered.length === 0) {

                box.innerHTML = `
                    <div class="empty-cart">
                        Không có tài khoản nào
                    </div>
                `;

                return;
            }

            let html = "";

            filtered.forEach(u => {

                html += `
                    <div class="admin-user-item">

                        <div>

                            <h3>${u.username}</h3>

                            <p>
                                Họ tên:
                                ${u.full_name || "Chưa cập nhật"}
                            </p>

                            <p>
                                SĐT:
                                ${u.phone || "Chưa cập nhật"}
                            </p>

                            <p>
                                Địa chỉ:
                                ${u.address || "Chưa cập nhật"}
                            </p>

                            <p>
                                Role:
                                <b>${u.role}</b>
                            </p>

                        </div>

                        <div class="admin-actions">

                            <select id="role-${u.user_id}">

                                <option value="user"
                                    ${u.role === "user" ? "selected" : ""}>
                                    user
                                </option>

                                <option value="seller"
                                    ${u.role === "seller" ? "selected" : ""}>
                                    seller
                                </option>

                                <option value="admin"
                                    ${u.role === "admin" ? "selected" : ""}>
                                    admin
                                </option>

                            </select>

                            <button
                                onclick="updateUserRole(${u.user_id})">
                                Cập nhật
                            </button>

                            <button
                                class="remove-btn"
                                onclick="openDeleteUserModal(${u.user_id})">
                                Xóa
                            </button>

                        </div>

                    </div>
                `;
            });

            box.innerHTML = html;
        });
}

function updateUserRole(userId) {

    const role =
        document.getElementById(
            `role-${userId}`
        ).value;

    fetch(`/api/admin/users/${userId}/role`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            role: role
        })
    })

    .then(res => res.json())

    .then(data => {

        if (data.status === "ok") {

            showMessage(
                "Cập nhật quyền thành công",
                "success"
            );

            loadAdminUsers();

        } else {

            showMessage(
                data.message || "Cập nhật thất bại",
                "error"
            );
        }
    });
}

function logout() {
    window.location.href = "/logout";
}
let deleteUserId = null;

function openDeleteUserModal(userId) {

    deleteUserId = userId;

    document.getElementById(
        "deleteUserModal"
    ).style.display = "flex";
}

function closeDeleteUserModal() {

    deleteUserId = null;

    document.getElementById(
        "deleteUserModal"
    ).style.display = "none";
}

function confirmDeleteUser() {

    if (!deleteUserId) return;

    fetch(`/api/admin/users/${deleteUserId}/delete`, {

        method: "POST"
    })

    .then(res => res.json())

    .then(data => {

        closeDeleteUserModal();

        if (data.status === "ok") {

            showMessage(
                "Xóa tài khoản thành công",
                "success"
            );

            loadAdminUsers();

        } else {

            showMessage(
                data.message || "Xóa thất bại",
                "error"
            );
        }
    });
}
/* ================= SELLER PRODUCT MANAGEMENT ================= */

function loadSellerProducts() {
    const box = document.getElementById("sellerProducts");

    if (!box) return;

    const keyword =
        document.getElementById("sellerSearchInput")?.value.toLowerCase() || "";

    fetch("/api/seller/products")
        .then(res => {
            if (res.status === 401) {
                window.location.href = "/login";
                return null;
            }

            if (res.status === 403) {
                showMessage("Bạn không có quyền seller", "error", "/");
                return null;
            }

            return res.json();
        })
        .then(products => {
            if (!products) return;

            const filtered = products.filter(p => {
                return String(p.name || "").toLowerCase().includes(keyword)
                    || String(p.category || "").toLowerCase().includes(keyword);
            });

            if (filtered.length === 0) {
                box.innerHTML = `
                    <div class="empty-cart">
                        Chưa có sản phẩm nào
                    </div>
                `;
                return;
            }

            let html = "";

            filtered.forEach(p => {
                html += `
                    <div class="seller-product-item">

                        <img src="${p.image || ''}"
                             onerror="this.src='https://picsum.photos/300'">

                        <div class="seller-product-info">
                            <h3>${p.name}</h3>
                            <p>Danh mục: ${p.category}</p>
                            <p>Giá: <b>${Number(p.price || 0).toLocaleString()}₫</b></p>
                            <p>Số lượng: ${p.quantity}</p>
                        </div>

                        <div class="seller-product-actions">

                            <button class="btn-edit-product"
                                    onclick='editSellerProduct(${JSON.stringify(p)})'>
                                Sửa
                            </button>

                            <button class="btn-delete-product"
                                    onclick="deleteSellerProduct(${p.item_id})">
                                Xóa
                            </button>

                        </div>

                    </div>
                `;
            });

            box.innerHTML = html;
        });
}

function editSellerProduct(p) {
    document.getElementById("sellerItemId").value = p.item_id;
    document.getElementById("sellerName").value = p.name || "";
    document.getElementById("sellerCategory").value = p.category || "";
    document.getElementById("sellerPrice").value = p.price || "";
    document.getElementById("sellerQuantity").value = p.quantity || "";
    document.getElementById("sellerImage").value = p.image || "";
    document.getElementById("sellerDesc").value = p.description || "";
    document.getElementById("sellerSizeGuide").value = p.size_guide || "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function resetSellerForm() {
    document.getElementById("sellerItemId").value = "";
    document.getElementById("sellerName").value = "";
    document.getElementById("sellerCategory").value = "";
    document.getElementById("sellerPrice").value = "";
    document.getElementById("sellerQuantity").value = "";
    document.getElementById("sellerImage").value = "";
    document.getElementById("sellerDesc").value = "";
    document.getElementById("sellerSizeGuide").value = "";
}

function saveSellerProduct() {
    const item_id = document.getElementById("sellerItemId").value;
    const name = document.getElementById("sellerName").value.trim();
    const category = document.getElementById("sellerCategory").value.trim();
    const price = document.getElementById("sellerPrice").value.trim();
    const quantity = document.getElementById("sellerQuantity").value.trim();
    const image = document.getElementById("sellerImage").value.trim();
    const description = document.getElementById("sellerDesc").value.trim();
    const size_guide = document.getElementById("sellerSizeGuide").value.trim();

    if (!name || !category || !price || !quantity) {
        showMessage("Vui lòng nhập tên, danh mục, giá và số lượng", "error");
        return;
    }

    fetch("/api/seller/product/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            item_id,
            name,
            category,
            price,
            quantity,
            image,
            description,
            size_guide
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            showMessage("Lưu sản phẩm thành công", "success");
            resetSellerForm();
            loadSellerProducts();
        } else {
            showMessage(data.message || "Lưu sản phẩm thất bại", "error");
        }
    });
}

function deleteSellerProduct(itemId) {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    fetch(`/api/seller/product/${itemId}/delete`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ok") {
            showMessage("Xóa sản phẩm thành công", "success");
            loadSellerProducts();
        } else {
            showMessage(data.message || "Xóa sản phẩm thất bại", "error");
        }
    });
}