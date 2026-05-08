from model_loader import predict_next_items


def get_user_sequence(cursor, user_id, limit=20):
    cursor.execute("""
        SELECT TOP (?) item_id
        FROM events
        WHERE user_id = ?
          AND event_type IN ('view', 'add_to_cart', 'purchase')
        ORDER BY event_time DESC
    """, limit, user_id)

    rows = cursor.fetchall()
    sequence = [row[0] for row in rows]

    sequence.reverse()

    return sequence


def get_recommend_products(cursor, user_id, top_k=20):
    sequence = get_user_sequence(cursor, user_id, limit=20)

    print("USER SEQUENCE =", sequence)

    if not sequence:
        return []

    recommended_item_ids = predict_next_items(sequence, top_k=30)

    print("MODEL RECOMMEND IDS =", recommended_item_ids[:20])

    data = []

    if recommended_item_ids:
        placeholders = ",".join(["?"] * len(recommended_item_ids))

        query = f"""
            SELECT
                item_id,
                product_name,
                main_category,
                price,
                image_url,
                quantity
            FROM products_real
            WHERE item_id IN ({placeholders})
        """

        cursor.execute(query, recommended_item_ids)

        rows = cursor.fetchall()

        print("PRODUCTS FOUND =", len(rows))

        for row in rows:
            data.append({
                "item_id": row[0],
                "name": row[1],
                "category": row[2],
                "price": row[3],
                "image": row[4],
                "quantity": row[5]
            })

    if len(data) >= top_k:
        return data[:top_k]

    # fallback không random: lấy sản phẩm cùng danh mục user đã tương tác
    placeholders = ",".join(["?"] * len(sequence))

    cursor.execute(f"""
        SELECT TOP (?)
            p.item_id,
            p.product_name,
            p.main_category,
            p.price,
            p.image_url,
            p.quantity
        FROM products_real p
        WHERE p.main_category IN (
            SELECT DISTINCT pr.main_category
            FROM products_real pr
            WHERE pr.item_id IN ({placeholders})
        )
        AND p.item_id NOT IN ({placeholders})
    """, top_k, *sequence, *sequence)

    rows = cursor.fetchall()

    for row in rows:
        data.append({
            "item_id": row[0],
            "name": row[1],
            "category": row[2],
            "price": row[3],
            "image": row[4],
            "quantity": row[5]
        })

    return data[:top_k]
