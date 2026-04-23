from db_config import get_db_connection

def query_all(sql, params=None):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params or [])
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def execute(sql, params=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params or [])
    conn.commit()
    cursor.close()
    conn.close()