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
INSERT INTO products (item_id, product_name, main_category, price, image_url)
VALUES
(1, N'iPhone 13 128GB', N'Điện thoại', 13990000, N'https://picsum.photos/300?1'),
(2, N'Samsung Galaxy A15', N'Điện thoại', 4990000, N'https://picsum.photos/300?2'),
(3, N'Tai nghe Bluetooth JBL', N'Phụ kiện điện thoại', 790000, N'https://picsum.photos/300?3'),
(4, N'Sạc nhanh Anker 20W', N'Phụ kiện điện thoại', 350000, N'https://picsum.photos/300?4');
SELECT * FROM products;

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