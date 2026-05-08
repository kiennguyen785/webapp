from model_loader import predict_next_items

def get_user_sequence(cursor, user_id, limit=5):
    cursor.execute("""
        SELECT TOP (?) item_id
        FROM events
        WHERE user_id = ?
          AND event_type IN ('view', 'add_to_cart', 'purchase')
        ORDER BY event_time DESC
    """, limit, user_id)

    rows = cursor.fetchall()

    sequence = [row[0] for row in rows]

    if len(sequence) < 2:
        return []

    sequence.reverse()

    return sequence

def get_recommend_products(cursor, user_id, top_k=5):
    sequence = get_user_sequence(
        cursor,
        user_id,
        limit=5
    )

    if not sequence:
        return []

    recommended_item_ids = predict_next_items(
        sequence,
        top_k=top_k
    )

    if not recommended_item_ids:
        return []

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

    data = []

    for row in rows:
        data.append({
            "item_id": row[0],
            "name": row[1],
            "category": row[2],
            "price": row[3],
            "image": row[4],
            "quantity": row[5]
        })

    return data