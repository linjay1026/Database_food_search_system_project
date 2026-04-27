import argparse
import json
import re
import sys
from pathlib import Path


CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from db_config import get_db_connection


def read_json_file(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize_text(value, default=""):
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def normalize_cuisine(value):
    if isinstance(value, list):
        return ", ".join([normalize_text(v) for v in value if normalize_text(v)])
    return normalize_text(value)


def normalize_station_name(value):
    if isinstance(value, dict):
        return normalize_text(value.get("cn") or value.get("en"))
    return normalize_text(value)


def normalize_district(value):
    county = ""
    district = ""
    if isinstance(value, dict):
        county = normalize_text(value.get("county"))
        district = normalize_text(value.get("district"))
    return county, district


def normalize_rating(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def normalize_review_rating(value):
    try:
        rating = int(round(float(value)))
    except (TypeError, ValueError):
        return 5
    return max(1, min(5, rating))


def normalize_review_date(value):
    if not isinstance(value, str):
        return None
    text = value.strip()
    # Accept only YYYY-MM-DD; otherwise store NULL to match DATE column.
    if re.match(r"^\d{4}-\d{2}-\d{2}$", text):
        return text
    return None


def ensure_user(cursor, username, cache):
    username = normalize_text(username)
    if not username:
        username = "anonymous"
    username = username[:100]

    if username in cache:
        return cache[username]

    cursor.execute("SELECT user_id FROM User WHERE username = %s", (username,))
    row = cursor.fetchone()
    if row:
        cache[username] = row[0]
        return row[0]

    cursor.execute(
        "INSERT INTO User (username, password, role) VALUES (%s, %s, %s)",
        (username, "seed_import_password", "user"),
    )
    user_id = cursor.lastrowid
    cache[username] = user_id
    return user_id


def upsert_restaurant(cursor, item):
    restaurant_id = normalize_text(item.get("restaurant_id"))
    name = normalize_text(item.get("name"))
    if not restaurant_id or not name:
        return None

    address = normalize_text(item.get("address"), "未提供地址")
    phone = normalize_text(item.get("phone"), "未提供電話")
    price_range = normalize_text(item.get("price_range"))
    cuisine_type = normalize_cuisine(item.get("cuisine_type"))
    rating = normalize_rating(item.get("rating"))
    cover = normalize_text(item.get("image"))
    station_name = normalize_station_name(item.get("station_name"))
    county, district = normalize_district(item.get("district"))

    cursor.execute(
        """
        INSERT INTO Restaurant (
            restaurant_id, owner_id, name, address, phone,
            price_range, cuisine_type, rating, cover,
            county, district, station_name
        ) VALUES (%s, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            address = VALUES(address),
            phone = VALUES(phone),
            price_range = VALUES(price_range),
            cuisine_type = VALUES(cuisine_type),
            rating = VALUES(rating),
            cover = VALUES(cover),
            county = VALUES(county),
            district = VALUES(district),
            station_name = VALUES(station_name)
        """,
        (
            restaurant_id,
            name,
            address,
            phone,
            price_range,
            cuisine_type,
            rating,
            cover,
            county,
            district,
            station_name,
        ),
    )
    return restaurant_id


def insert_images(cursor, restaurant_id, item):
    urls = []
    cover = normalize_text(item.get("image"))
    if cover:
        urls.append(cover)

    photos = item.get("photos")
    if isinstance(photos, list):
        for p in photos:
            text = normalize_text(p)
            if text:
                urls.append(text)

    # Keep order and remove duplicates.
    deduped = list(dict.fromkeys(urls))
    inserted = 0
    for url in deduped:
        cursor.execute(
            """
            INSERT INTO Image (restaurant_id, image_url)
            SELECT %s, %s
            FROM DUAL
            WHERE NOT EXISTS (
                SELECT 1 FROM Image WHERE restaurant_id = %s AND image_url = %s
            )
            """,
            (restaurant_id, url, restaurant_id, url),
        )
        inserted += cursor.rowcount
    return inserted


def insert_reviews(cursor, restaurant_id, item, user_cache):
    reviews = item.get("reviews")
    if not isinstance(reviews, list):
        return 0

    inserted = 0
    for review in reviews:
        if not isinstance(review, dict):
            continue

        reviewer_name = normalize_text(
            review.get("user_name") or review.get("user_id") or review.get("review_id")
        )
        user_id = ensure_user(cursor, reviewer_name, user_cache)
        rating = normalize_review_rating(review.get("rating"))
        comment = normalize_text(review.get("comment"))
        review_date = normalize_review_date(review.get("review_date"))

        # Idempotency check to avoid duplicated reviews in repeated imports.
        cursor.execute(
            """
            SELECT 1
            FROM Reviews
            WHERE user_id = %s AND restaurant_id = %s AND comment = %s
            LIMIT 1
            """,
            (user_id, restaurant_id, comment),
        )
        exists = cursor.fetchone()
        if exists:
            continue

        cursor.execute(
            """
            INSERT INTO Reviews (user_id, restaurant_id, rating, comment, review_date)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, restaurant_id, rating, comment, review_date),
        )
        inserted += 1

    return inserted


def import_from_file(cursor, json_path, user_cache):
    data = read_json_file(json_path)
    if not isinstance(data, list):
        raise ValueError(f"File is not a JSON array: {json_path}")

    restaurants = 0
    images = 0
    reviews = 0
    skipped = 0

    for item in data:
        if not isinstance(item, dict):
            skipped += 1
            continue

        restaurant_id = upsert_restaurant(cursor, item)
        if not restaurant_id:
            skipped += 1
            continue

        restaurants += 1
        images += insert_images(cursor, restaurant_id, item)
        reviews += insert_reviews(cursor, restaurant_id, item, user_cache)

    return restaurants, images, reviews, skipped


def main():
    parser = argparse.ArgumentParser(description="Import raw_data JSON into MySQL schema.")
    parser.add_argument(
        "--file",
        action="append",
        help="JSON file path to import. Can be used multiple times.",
    )
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    raw_data_dir = project_root / "raw_data"

    default_files = [
        raw_data_dir / "new_restaurant_data.json",
        raw_data_dir / "restaurant_raw_data.json",
    ]

    if args.file:
        files = [Path(p).resolve() for p in args.file]
    else:
        files = [p for p in default_files if p.exists()]

    if not files:
        raise FileNotFoundError("No input JSON files found. Use --file to provide one.")

    conn = get_db_connection()
    cursor = conn.cursor()

    total_restaurants = 0
    total_images = 0
    total_reviews = 0
    total_skipped = 0
    user_cache = {}

    try:
        for file_path in files:
            r, i, v, s = import_from_file(cursor, file_path, user_cache)
            total_restaurants += r
            total_images += i
            total_reviews += v
            total_skipped += s
            print(f"Imported from {file_path.name}: restaurants={r}, images={i}, reviews={v}, skipped={s}")

        conn.commit()
        print("Import completed successfully.")
        print(
            f"Summary: restaurants={total_restaurants}, images={total_images}, "
            f"reviews={total_reviews}, skipped={total_skipped}"
        )
        print("Note: MRT_station.json was not imported because current schema has no station table.")
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
