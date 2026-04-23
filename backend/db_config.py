import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="140.122.184.128",         # 或者你的資料庫伺服器 IP，例如 "127.0.0.1"
        user="team2",   # 例如 "root"
        password="T7d@Vm28qL", # 例如 "123456"
        database="team2", # 例如 "restaurant_db"
        charset="utf8mb4"         # 支援中文資料
    )