import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")
    port = int(os.getenv("DB_PORT", "3306"))

    if not all([host, user, password, database]):
        raise ValueError("Missing required DB environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME")

    return mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset="utf8mb4"
    )