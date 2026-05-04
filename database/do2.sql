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
