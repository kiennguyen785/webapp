CREATE DATABASE sports_shop1;
USE sports_shop1;

CREATE TABLE users (
	user_id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	email VARCHAR(100) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	phone VARCHAR(20),
	address TEXT,
	role_id INT NOT NULL,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

CREATE TABLE products (
	product_id INT AUTO_INCREMENT PRIMARY KEY,
	product_name VARCHAR(200) NOT NULL,
	brand_id INT NOT NULL,
	category_id INT NOT NULL,
	description TEXT,
	specifications TEXT,
	image_url VARCHAR(255),
	is_promotion BOOLEAN DEFAULT FALSE,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

CREATE TABLE carts (
	cart_id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL UNIQUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

CREATE TABLE cart_items (
	cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
	cart_id INT NOT NULL,
	variant_id INT NOT NULL,
	quantity INT NOT NULL DEFAULT 1,
	unit_price DECIMAL(15,2) NOT NULL,
);

CREATE TABLE orders (
	order_id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	order_code VARCHAR(50) NOT NULL UNIQUE,
	receiver_name VARCHAR(100) NOT NULL,
	receiver_phone VARCHAR(20) NOT NULL,
	shipping_address TEXT NOT NULL,
	payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
	status VARCHAR(50) NOT NULL DEFAULT 'pending',
	total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
);

CREATE TABLE order_items (
	order_item_id INT AUTO_INCREMENT PRIMARY KEY,
	order_id INT NOT NULL,
	variant_id INT NOT NULL,
	quantity INT NOT NULL,
	unit_price DECIMAL(15,2) NOT NULL,
	subtotal DECIMAL(15,2) NOT NULL,
);
USE sports_shop1;
ALTER TABLE users
ADD role VARCHAR(20) DEFAULT 'user';

ALTER TABLE products
ADD seller_id INT;

UPDATE users
SET role = 'admin'
WHERE email = 'admin@gmail.com';

UPDATE users
SET role = 'seller'
WHERE email = 'seller@gmail.com';

UPDATE products
SET seller_id = 2
WHERE id IN (1,2,3);
UPDATE users

SET role = 'admin'
WHERE email = 'admin1@gmail.com';

SHOW TABLES;
DESCRIBE users;
DESCRIBE products;

ALTER TABLE products
ADD quantity INT DEFAULT 100;

UPDATE products
SET quantity = 100
WHERE quantity IS NULL;