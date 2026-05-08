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
ADD CONSTRAINT UQ_cart_user_item UNIQUE (user_id, item_id);


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