from flask import Blueprint, jsonify, request
from utils.db import query_all, execute

image_bp = Blueprint('image', __name__)

@image_bp.route('/api/images', methods=['GET'])
def get_all_images():
    print("🔍 查詢所有圖片")
    sql = "SELECT * FROM Image"
    return jsonify(query_all(sql))

@image_bp.route('/api/images/<restaurant_id>', methods=['GET'])
def get_images_by_restaurant(restaurant_id):
    print(f"🔍 查詢餐廳 {restaurant_id} 的所有圖片")
    sql = "SELECT * FROM Image WHERE restaurant_id = %s"
    return jsonify(query_all(sql, (restaurant_id,)))

@image_bp.route('/api/images/delete', methods=['DELETE'])
def delete_image():
    print("🔍 刪除圖片")
    data = request.get_json()
    restaurant_id = data.get("restaurant_id")
    image_url = data.get("image_url")

    if not restaurant_id or not image_url:
        return jsonify({"error": "缺少 restaurant_id 或 image_url"}), 400

    sql = "DELETE FROM Image WHERE restaurant_id = %s AND image_url = %s"
    execute(sql, (restaurant_id, image_url))
    return jsonify({"message": "✅ 圖片已刪除"})

@image_bp.route('/api/images', methods=['POST'])
def add_image():
    print("🔍 新增圖片")
    data = request.get_json()
    restaurant_id = data.get("restaurant_id")
    image_url = data.get("image_url")

    if not restaurant_id or not image_url:
        return jsonify({"error": "缺少 restaurant_id 或 image_url"}), 400

    sql = "INSERT INTO Image (restaurant_id, image_url) VALUES (%s, %s)"
    execute(sql, (restaurant_id, image_url))
    return jsonify({"message": "✅ 圖片已新增"})