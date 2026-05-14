CREATE DATABASE DA2;
GO

USE DA2;
GO

CREATE TABLE products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    main_category NVARCHAR(100) NOT NULL,
    price INT NOT NULL,
    image_url NVARCHAR(500) NULL
);
GO
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL
);

CREATE TABLE events (
    event_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    item_id INT,
    event_type NVARCHAR(50),
    event_time DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE cart (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    item_id INT,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
/*UNIQUE cho products*/
ALTER TABLE products
ADD CONSTRAINT UQ_products_item_id UNIQUE (item_id);
GO
/*Khóa ngoại từ events sang products*/
ALTER TABLE events
ADD CONSTRAINT FK_events_products
FOREIGN KEY (item_id) REFERENCES products(item_id);
GO
/*Khóa ngoại từ cart sang products*/
ALTER TABLE cart
ADD CONSTRAINT FK_cart_products
FOREIGN KEY (item_id) REFERENCES products(item_id);
GO
ALTER TABLE users ADD
    full_name NVARCHAR(255) NULL,
    phone NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    is_profile_completed BIT DEFAULT 0;

ALTER TABLE products_real ADD
    quantity INT DEFAULT 100;

CREATE TABLE orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name NVARCHAR(255),
    phone NVARCHAR(20),
    address NVARCHAR(500),
    note NVARCHAR(500),
    payment_method NVARCHAR(100),
    total_price INT,
    order_time DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price INT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
UPDATE products_real
SET quantity = 123;


IF OBJECT_ID('users', 'U') IS NULL
BEGIN
    CREATE TABLE users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(100) NOT NULL,
        full_name NVARCHAR(255) NULL,
        phone NVARCHAR(20) NULL,
        address NVARCHAR(500) NULL,
        is_profile_completed BIT DEFAULT 0
    );
END

SELECT*
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'products_real';

SELECT TOP 5 * FROM users;
ALTER TABLE users
ADD role NVARCHAR(20) DEFAULT 'user';
UPDATE users
SET role = 'user'
WHERE role IS NULL;
SELECT * FROM users;
INSERT INTO users (
    username,
    password,
    role,
    is_profile_completed
)
VALUES (
    'admin',
    '123456',
    'admin',
    1
);
ALTER TABLE cart
DROP CONSTRAINT FK_cart_products;

ALTER TABLE cart
ADD CONSTRAINT FK_cart_products_real
FOREIGN KEY (item_id)
REFERENCES products_real(item_id);

ALTER TABLE events
DROP CONSTRAINT FK_events_products;


SELECT TOP 10 * FROM cart ORDER BY cart_id DESC;
ALTER TABLE events
ADD CONSTRAINT FK_events_products_real
FOREIGN KEY (item_id)
REFERENCES products_real(item_id);

SELECT item_id, COUNT(*) AS so_lan_trung
FROM products_real
GROUP BY item_id
HAVING COUNT(*) > 1;

ALTER TABLE products_real
ADD CONSTRAINT UQ_products_real_item_id UNIQUE (item_id);
GO

ALTER TABLE events
ADD CONSTRAINT FK_events_products_real
FOREIGN KEY (item_id)
REFERENCES products_real(item_id);
GO

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('events', 'products_real')
  AND COLUMN_NAME = 'item_id';

  SELECT item_id
FROM products_real
WHERE TRY_CAST(item_id AS INT) IS NULL;

ALTER TABLE products_real
ADD CONSTRAINT UQ_products_real_item_id UNIQUE (item_id);
GO
ALTER TABLE products_real
DROP CONSTRAINT UQ_products_real_item_id;
GO

ALTER TABLE events
ADD CONSTRAINT FK_events_products_real
FOREIGN KEY (item_id)
REFERENCES products_real(item_id);
GO

ALTER TABLE cart
ADD CONSTRAINT FK_cart_products_real
FOREIGN KEY (item_id)
REFERENCES products_real(item_id);
GO
use DA2
GO
ALTER TABLE order_items
ADD CONSTRAINT FK_order_items_products_real
FOREIGN KEY (item_id)
REFERENCES products_real(item_id);


ALTER TABLE cart
ADD CONSTRAINT CK_cart_quantity CHECK (quantity > 0);

ALTER TABLE order_items
ADD CONSTRAINT CK_order_items_quantity CHECK (quantity > 0);
use DA2
go
SELECT 
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS Table_Name
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) = 'events';
SELECT TOP 20 *
FROM events
ORDER BY event_time DESC;

SELECT TOP 20 e.*, p.product_name
FROM events e
JOIN products_real p
ON e.item_id = p.item_id
ORDER BY e.event_time DESC;
use da2
go
SELECT TOP 50 *
FROM events
ORDER BY event_time DESC;

use da2
go

/* =========================================
   ROLE + SELLER
========================================= */

ALTER TABLE users
ADD avatar_url NVARCHAR(500) NULL;

UPDATE users
SET role = 'user'
WHERE role IS NULL;





/* =========================================
   SELLER CHO SẢN PHẨM
========================================= */

ALTER TABLE products_real
ADD seller_id INT NULL;

ALTER TABLE products_real
ADD CONSTRAINT FK_products_real_seller
FOREIGN KEY (seller_id)
REFERENCES users(user_id);





/* =========================================
   BẢNG VARIANT
========================================= */

CREATE TABLE product_variants (

    variant_id INT IDENTITY(1,1) PRIMARY KEY,

    item_id INT NOT NULL,

    color NVARCHAR(50) NULL,

    size NVARCHAR(50) NULL,

    storage NVARCHAR(50) NULL,

    weight NVARCHAR(50) NULL,

    stock INT DEFAULT 0,

    price INT,

    image_url NVARCHAR(500),

    FOREIGN KEY (item_id)
    REFERENCES products_real(item_id)
);





/* =========================================
   THÔNG SỐ CHI TIẾT
========================================= */

CREATE TABLE product_attributes (

    attribute_id INT IDENTITY(1,1) PRIMARY KEY,

    item_id INT NOT NULL,

    attribute_name NVARCHAR(100),

    attribute_value NVARCHAR(500),

    FOREIGN KEY (item_id)
    REFERENCES products_real(item_id)
);





/* =========================================
   HƯỚNG DẪN SIZE
========================================= */

ALTER TABLE products_real
ADD size_guide NVARCHAR(MAX);


/* =========================================
   CART HỖ TRỢ VARIANT
========================================= */

ALTER TABLE cart
ADD variant_id INT NULL;

ALTER TABLE cart
ADD CONSTRAINT FK_cart_variant
FOREIGN KEY (variant_id)
REFERENCES product_variants(variant_id);





/* =========================================
   ORDER ITEMS HỖ TRỢ VARIANT
========================================= */

ALTER TABLE order_items
ADD variant_id INT NULL;

ALTER TABLE order_items
ADD CONSTRAINT FK_order_items_variant
FOREIGN KEY (variant_id)
REFERENCES product_variants(variant_id);





/* =========================================
   EVENT HỖ TRỢ VARIANT
========================================= */

ALTER TABLE events
ADD variant_id INT NULL;

ALTER TABLE events
ADD CONSTRAINT FK_events_variant
FOREIGN KEY (variant_id)
REFERENCES product_variants(variant_id);
SELECT TOP 20 item_id, product_name
FROM products_real;
INSERT INTO product_variants (
    item_id,
    color,
    storage,
    stock,
    price
)
VALUES
(3, N'Đen', N'128GB', 10, 22000000),
(3, N'Trắng', N'256GB', 5, 25000000);


SELECT
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS Table_Name
FROM sys.foreign_keys fk
ORDER BY Table_Name;

SELECT
    kc.name AS Constraint_Name,
    OBJECT_NAME(kc.parent_object_id) AS Table_Name
FROM sys.key_constraints kc
WHERE kc.type = 'UQ'
ORDER BY Table_Name;
ALTER TABLE cart
DROP CONSTRAINT UQ_cart_user_item;

ALTER TABLE cart
ADD CONSTRAINT UQ_cart_user_item_variant
UNIQUE (user_id, item_id, variant_id);

SELECT 
    TABLE_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN (
    'users',
    'products_real',
    'cart',
    'events',
    'order_items'
)
ORDER BY TABLE_NAME;

SELECT 
    TABLE_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN (
    'product_variants',
    'product_attributes'
)
ORDER BY TABLE_NAME;

SELECT
    kc.name AS Constraint_Name,
    OBJECT_NAME(kc.parent_object_id) AS Table_Name
FROM sys.key_constraints kc
WHERE kc.type = 'UQ'
ORDER BY Table_Name;
use da2;
go

ALTER TABLE users
ADD role NVARCHAR(20) DEFAULT 'user';

INSERT INTO users (
    username,
    password,
    role,
    is_profile_completed
)
VALUES (
    'admin',
    '123456',
    'admin',
    1
);
INSERT INTO product_variants (
    item_id,
    color,
    storage,
    stock,
    price,
    image_url
)
SELECT
    p.item_id,
    v.color,
    v.storage,
    20 AS stock,
    p.price + v.extra_price,
    p.image_url
FROM products_real p
CROSS APPLY (
    VALUES
        (N'Đen', N'128GB', 0),
        (N'Trắng', N'256GB', 1000000)
) v(color, storage, extra_price)
WHERE p.main_category = N'Điện thoại'
  AND NOT EXISTS (
      SELECT 1
      FROM product_variants pv
      WHERE pv.item_id = p.item_id
  );

  INSERT INTO product_variants (
    item_id,
    color,
    size,
    stock,
    price,
    image_url
)
SELECT
    p.item_id,
    v.color,
    v.size,
    30 AS stock,
    p.price,
    p.image_url
FROM products_real p
CROSS APPLY (
    VALUES
        (N'Đen', N'M'),
        (N'Đen', N'L'),
        (N'Trắng', N'M'),
        (N'Trắng', N'L')
) v(color, size)
WHERE p.main_category = N'Thời trang'
  AND NOT EXISTS (
      SELECT 1
      FROM product_variants pv
      WHERE pv.item_id = p.item_id
  );


  INSERT INTO product_variants (
    item_id,
    color,
    stock,
    price,
    image_url
)
SELECT
    p.item_id,
    v.color,
    25 AS stock,
    p.price,
    p.image_url
FROM products_real p
CROSS APPLY (
    VALUES
        (N'Đen'),
        (N'Trắng'),
        (N'Xanh')
) v(color)
WHERE p.main_category = N'Phụ kiện điện thoại'
  AND NOT EXISTS (
      SELECT 1
      FROM product_variants pv
      WHERE pv.item_id = p.item_id
  );

  INSERT INTO product_variants (
    item_id,
    color,
    size,
    stock,
    price,
    image_url
)
SELECT
    p.item_id,
    v.color,
    v.size,
    15 AS stock,
    p.price + v.extra_price,
    p.image_url
FROM products_real p
CROSS APPLY (
    VALUES
        (N'Đen', N'40mm', 0),
        (N'Bạc', N'44mm', 500000),
        (N'Vàng', N'44mm', 800000)
) v(color, size, extra_price)
WHERE p.main_category = N'Đồng hồ'
  AND NOT EXISTS (
      SELECT 1
      FROM product_variants pv
      WHERE pv.item_id = p.item_id

  );

UPDATE users
SET role = 'admin'
WHERE username = 'admin';

UPDATE users
SET role = 'user'
WHERE role = 'seller';
use da2;
go
UPDATE products_real
SET image_url =
'https://source.unsplash.com/600x600/?' +
REPLACE(product_name, ' ', ',')