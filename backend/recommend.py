from model_loader import predict_next_items


RECENT_CATEGORY_WINDOW = 5


def product_to_dict(row):
    return {
        "item_id": row[0],
        "name": row[1],
        "category": row[2],
        "price": row[3],
        "image": row[4],
        "quantity": row[5]
    }


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


def get_recent_categories(cursor, sequence):
    if not sequence:
        return []

    recent_items = sequence[-RECENT_CATEGORY_WINDOW:]

    placeholders = ",".join(["?"] * len(recent_items))

    cursor.execute(f"""
        SELECT main_category
        FROM products_real
        WHERE item_id IN ({placeholders})
    """, *recent_items)

    rows = cursor.fetchall()

    categories = []

    for row in rows:
        if row[0] and row[0] not in categories:
            categories.append(row[0])

    return categories


def get_products_by_ids(
    cursor,
    item_ids,
    allowed_categories=None
):
    if not item_ids:
        return []

    placeholders = ",".join(["?"] * len(item_ids))

    params = list(item_ids)

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

    if allowed_categories:
        category_placeholders = ",".join(
            ["?"] * len(allowed_categories)
        )

        query += f"""
            AND main_category IN ({category_placeholders})
        """

        params.extend(allowed_categories)

    cursor.execute(query, params)

    rows = cursor.fetchall()

    product_map = {}

    for row in rows:
        product_map[row[0]] = product_to_dict(row)

    result = []

    for item_id in item_ids:
        if item_id in product_map:
            result.append(product_map[item_id])

    return result


def get_recent_category_products(
    cursor,
    sequence,
    exclude_ids,
    limit
):
    if not sequence or limit <= 0:
        return []

    recent_items = sequence[-RECENT_CATEGORY_WINDOW:]

    placeholders_recent = ",".join(
        ["?"] * len(recent_items)
    )

    cursor.execute(f"""
        SELECT TOP 1
            main_category,
            COUNT(*) AS cnt
        FROM products_real
        WHERE item_id IN ({placeholders_recent})
        GROUP BY main_category
        ORDER BY cnt DESC
    """, *recent_items)

    cat_row = cursor.fetchone()

    if not cat_row:
        return []

    target_category = cat_row[0]

    placeholders_exclude = ",".join(
        ["?"] * len(exclude_ids)
    )

    cursor.execute(f"""
        SELECT TOP (?)
            item_id,
            product_name,
            main_category,
            price,
            image_url,
            quantity
        FROM products_real
        WHERE main_category = ?
          AND item_id NOT IN ({placeholders_exclude})
        ORDER BY NEWID()
    """, limit, target_category, *exclude_ids)

    rows = cursor.fetchall()

    return [
        product_to_dict(row)
        for row in rows
    ]


def merge_unique(result, new_items, max_count):
    existing = set(
        item["item_id"]
        for item in result
    )

    for item in new_items:
        if item["item_id"] in existing:
            continue

        result.append(item)
        existing.add(item["item_id"])

        if len(result) >= max_count:
            break

    return result


def get_recommend_products(cursor, user_id, top_k=20):
    sequence = get_user_sequence(
        cursor,
        user_id,
        limit=20
    )

    print("USER SEQUENCE =", sequence)

    if not sequence:
        return []

    lstm_count = int(top_k * 0.8)
    category_count = top_k - lstm_count

    data = []

    allowed_categories = get_recent_categories(
        cursor,
        sequence
    )

    print("ALLOWED CATEGORIES =", allowed_categories)

    # ================= 80% LSTM =================

    try:
        recommended_item_ids = predict_next_items(
            sequence,
            top_k=top_k * 5
        )
    except Exception as e:
        print("LỖI MODEL:", e)
        recommended_item_ids = []

    print("MODEL RECOMMEND IDS =", recommended_item_ids[:30])

    seen_ids = set(sequence)

    filtered_ids = [
        item_id for item_id in recommended_item_ids
        if item_id not in seen_ids
    ]

    lstm_products = get_products_by_ids(
        cursor,
        filtered_ids,
        allowed_categories
    )

    data = merge_unique(
        data,
        lstm_products,
        lstm_count
    )

    # ================= 20% CATEGORY GẦN ĐÂY =================

    exclude_ids = list(seen_ids)
    exclude_ids.extend(
        [p["item_id"] for p in data]
    )

    category_products = get_recent_category_products(
        cursor,
        sequence,
        exclude_ids,
        category_count
    )

    data = merge_unique(
        data,
        category_products,
        top_k
    )

    # ================= FALLBACK THEO CATEGORY GẦN ĐÂY =================

    if len(data) < top_k:
        exclude_ids = list(seen_ids)
        exclude_ids.extend(
            [p["item_id"] for p in data]
        )

        fallback = get_recent_category_products(
            cursor,
            sequence,
            exclude_ids,
            top_k - len(data)
        )

        data = merge_unique(
            data,
            fallback,
            top_k
        )

    return data[:top_k]