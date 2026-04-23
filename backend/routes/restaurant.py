from flask import Blueprint, request, jsonify
from utils.db import query_all, execute, get_db_connection
import os, base64

restaurant_bp = Blueprint("restaurant", __name__, url_prefix="/api/restaurants")

# ✅ 產生類似 Google Place ID 的亂碼 restaurant_id
def generate_unique_restaurant_id():
    print("🔍 產生唯一的 restaurant_id")
    while True:
        rand = os.urandom(9)
        candidate = "ChIJ" + base64.urlsafe_b64encode(rand).decode("utf-8").rstrip("=")
        exists = query_all("SELECT 1 FROM Restaurant WHERE restaurant_id = %s", (candidate,))
        print("🔍 檢查 restaurant_id 是否存在:", candidate, "=>", exists)
        if not exists:
            return candidate

# 📌 新增店家
@restaurant_bp.route("", methods=["POST"])
def create_restaurant():
    print("🔍 新增店家")
    data = request.get_json()
    restaurant_id = generate_unique_restaurant_id()

    sql = """
        INSERT INTO Restaurant (
            restaurant_id, owner_id, name, address, phone,
            price_range, cuisine_type, rating, cover,
            county, district, station_name
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        restaurant_id,
        data.get("owner_id"),
        data.get("name"),
        data.get("address"),
        data.get("phone"),
        data.get("price_range"),
        data.get("cuisine_type"),
        data.get("rating", 0),
        data.get("cover"),
        data.get("county"),
        data.get("district"),
        data.get("station_name"),
    )
    print("✅ 新產生的 restaurant_id:", restaurant_id)
    execute(sql, params)
    return jsonify({"message": "✅ 店家新增成功", "restaurant_id": restaurant_id}), 201

# ✏️ 編輯店家
@restaurant_bp.route("/<restaurant_id>", methods=["PUT"])
def update_restaurant(restaurant_id):
    print(f"🔍 更新店家 {restaurant_id}")
    data = request.get_json()
    sql = """
        UPDATE Restaurant SET
            name=%s, address=%s, phone=%s,
            price_range=%s, cuisine_type=%s, rating=%s, cover=%s,
            county=%s, district=%s, station_name=%s
        WHERE restaurant_id = %s
    """
    params = (
        data.get("name"),
        data.get("address"),
        data.get("phone"),
        data.get("price_range"),
        data.get("cuisine_type"),
        data.get("rating"),
        data.get("cover"),
        data.get("county"),
        data.get("district"),
        data.get("station_name"),
        restaurant_id
    )
    execute(sql, params)
    return jsonify({"message": "✅ 店家資訊已更新"})

# 🔍 查詢店家（支援條件篩選）
# restaurant.py 中的 get_restaurants()
@restaurant_bp.route("", methods=["GET"])
def get_restaurants():
    print("🔍 查詢店家")
    conditions = []
    values = []

    if q := request.args.get("q"):
        conditions.append("name LIKE %s")
        values.append(f"%{q}%")
    if county := request.args.get("county"):
        conditions.append("county = %s")
        values.append(county)
    if district := request.args.get("district"):
        conditions.append("district = %s")
        values.append(district)
    if station := request.args.get("station"):
        conditions.append("station_name = %s")
        values.append(station)
    if cuisine := request.args.get("cuisine"):
        conditions.append("cuisine_type LIKE %s")
        values.append(f"%{cuisine}%")
    if owner_id := request.args.get("owner_id"):
        conditions.append("owner_id = %s")
        values.append(owner_id)

    sql = "SELECT * FROM Restaurant"
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    results = query_all(sql, values)
    return jsonify(results)


# 🔍 查詢單一店家
@restaurant_bp.route("/<restaurant_id>", methods=["GET"])
def get_restaurant(restaurant_id):
    print(f"🔍 查詢店家 {restaurant_id}")
    sql = "SELECT * FROM Restaurant WHERE restaurant_id = %s"
    result = query_all(sql, (restaurant_id,))
    if not result:
        return jsonify({"message": "找不到該店家"}), 404
    return jsonify(result[0])

# ❌ 刪除店家
@restaurant_bp.route("/<restaurant_id>", methods=["DELETE"])
def delete_restaurant(restaurant_id):
    print(f"🔍 刪除店家 {restaurant_id}")
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Restaurant WHERE restaurant_id = %s", (restaurant_id,))
        conn.commit()
        return jsonify({"message": "餐廳刪除成功"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()