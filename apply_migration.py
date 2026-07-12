import os
os.environ['DATABASE_URL'] = 'mysql+pymysql://root:@localhost:3306/assetflow_db'

from app import app, db
from flask_migrate import upgrade

with app.app_context():
    print("Verifying database connection...")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    db.create_all()
    print("All tables created successfully!")
    print("\nTables in database:")
    inspector = db.inspect(db.engine)
    for table_name in inspector.get_table_names():
        print(f"  - {table_name}")
