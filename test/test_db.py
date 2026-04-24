import pyodbc
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect(
    "DRIVER={SQL Server};"
    "SERVER=ADMIN\\SQLEXPRESS;"
    "DATABASE=DA2;"
    "UID=sa;"
    "PWD=123123;"
    "TrustServerCertificate=yes;"
)

cursor = conn.cursor()

cursor.execute("SELECT * FROM products")

for row in cursor:
    print(row)

conn.close()