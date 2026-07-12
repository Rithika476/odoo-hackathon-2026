import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
import bcrypt
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)


def resolve_database_uri():
    configured = os.getenv('DATABASE_URL')
    if configured:
        return configured
    try:
        from sqlalchemy import create_engine
        engine = create_engine('mysql+pymysql://root:root@localhost:3306/assetflow_db')
        with engine.connect() as connection:
            connection.execute(db.text('SELECT 1'))
        return 'mysql+pymysql://root:root@localhost:3306/assetflow_db'
    except Exception:
        return 'sqlite:///assetflow.db'


app.config['SQLALCHEMY_DATABASE_URI'] = resolve_database_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'assetflow-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)

CORS(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    users = db.relationship('User', backref='role', lazy=True)


class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.String(200))
    head_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    employees = db.relationship('Employee', backref='department', lazy=True)
    assets = db.relationship('Asset', backref='department_ref', lazy=True)


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    employee = db.relationship('Employee', uselist=False, backref='user', passive_deletes=True)


class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    job_title = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30))
    location = db.Column(db.String(100))
    hire_date = db.Column(db.Date, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')
    is_department_head = db.Column(db.Boolean, default=False)
    is_asset_manager = db.Column(db.Boolean, default=False)


class AssetCategory(db.Model):
    __tablename__ = 'asset_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.String(200))
    assets = db.relationship('Asset', backref='category', lazy=True)


class Asset(db.Model):
    __tablename__ = 'assets'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    asset_tag = db.Column(db.String(50), unique=True, nullable=False, index=True)
    serial_number = db.Column(db.String(80), unique=True, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('asset_categories.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(30), default='available')
    purchase_date = db.Column(db.Date, default=datetime.utcnow)
    warranty_end = db.Column(db.Date)
    location = db.Column(db.String(100), default='Main Office')
    value = db.Column(db.Numeric(10, 2), default=0.00)
    description = db.Column(db.Text)
    qr_code = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    images = db.relationship('AssetImage', backref='asset', lazy=True)


class AssetImage(db.Model):
    __tablename__ = 'asset_images'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(120))


class AssetAllocation(db.Model):
    __tablename__ = 'asset_allocations'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_date = db.Column(db.DateTime, default=datetime.utcnow)
    expected_return_date = db.Column(db.DateTime)
    returned_date = db.Column(db.DateTime)
    status = db.Column(db.String(30), default='assigned')


class AssetHistory(db.Model):
    __tablename__ = 'asset_history'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class TransferRequest(db.Model):
    __tablename__ = 'transfer_requests'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    requested_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    from_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    to_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(30), default='pending')
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)


class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_name = db.Column(db.String(100), nullable=False)
    booked_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    purpose = db.Column(db.String(200))
    status = db.Column(db.String(30), default='confirmed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    requested_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    technician_id = db.Column(db.Integer, db.ForeignKey('technicians.id'), nullable=True)
    issue_description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')
    status = db.Column(db.String(30), default='pending')
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)


class Technician(db.Model):
    __tablename__ = 'technicians'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(30))
    specialty = db.Column(db.String(80))
    is_active = db.Column(db.Boolean, default=True)


class AuditCycle(db.Model):
    __tablename__ = 'audit_cycles'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    scheduled_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), default='planned')
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)


class AuditDetail(db.Model):
    __tablename__ = 'audit_details'
    id = db.Column(db.Integer, primary_key=True)
    audit_cycle_id = db.Column(db.Integer, db.ForeignKey('audit_cycles.id'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    status = db.Column(db.String(30), default='verified')
    notes = db.Column(db.Text)
    verified_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(120), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def seed_database():
    if Role.query.count() > 0:
        return
    admin_role = Role(name='Admin', description='Platform administrator')
    asset_manager_role = Role(name='Asset Manager', description='Asset lifecycle manager')
    department_head_role = Role(name='Department Head', description='Department lead')
    employee_role = Role(name='Employee', description='Regular employee')
    db.session.add_all([admin_role, asset_manager_role, department_head_role, employee_role])
    db.session.commit()

    department = Department(name='Operations', code='OPS', description='Core operations')
    db.session.add(department)
    db.session.commit()

    admin_user = User(full_name='System Administrator', email='admin@assetflow.com', password_hash=hash_password('admin123'), role_id=admin_role.id, department_id=department.id)
    db.session.add(admin_user)
    db.session.commit()

    employee = Employee(user_id=admin_user.id, department_id=department.id, job_title='Administrator', phone='555-0100', location='Head Office', is_department_head=True, is_asset_manager=True)
    db.session.add(employee)
    db.session.commit()

    category = AssetCategory(name='Laptop', code='LAP', description='Portable computing devices')
    db.session.add(category)
    db.session.commit()

    asset = Asset(name='Dell Latitude 7420', asset_tag='AF-1001', serial_number='SN-1001', category_id=category.id, department_id=department.id, assigned_to_user_id=admin_user.id, status='assigned', value=1200.00, location='Head Office', qr_code='AF-1001')
    db.session.add(asset)
    db.session.commit()

    db.session.add_all([
        AssetImage(asset_id=asset.id, image_url='https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', caption='Asset preview'),
        AssetAllocation(asset_id=asset.id, assigned_to_user_id=admin_user.id, assigned_by_user_id=admin_user.id, expected_return_date=datetime.utcnow() + timedelta(days=30), status='assigned'),
        AssetHistory(asset_id=asset.id, user_id=admin_user.id, action='Registered', details='Initial asset registration'),
        TransferRequest(asset_id=asset.id, requested_by_user_id=admin_user.id, from_department_id=department.id, to_department_id=department.id, reason='Internal transfer review', status='approved'),
        Booking(resource_type='Meeting Room', resource_name='Boardroom A', booked_by_user_id=admin_user.id, start_time=datetime.utcnow() + timedelta(days=1), end_time=datetime.utcnow() + timedelta(days=1, hours=2), purpose='Planning session', status='confirmed'),
        MaintenanceRequest(asset_id=asset.id, requested_by_user_id=admin_user.id, issue_description='Keyboard intermittent', priority='medium', status='pending'),
        Technician(name='Ravi Shah', email='ravi@assetflow.com', phone='555-0123', specialty='Hardware'),
        Notification(user_id=admin_user.id, title='Welcome', message='AssetFlow is ready for your team.'),
        ActivityLog(user_id=admin_user.id, action='Login', details='Initial system access')
    ])
    db.session.commit()


@app.before_request
def ensure_tables():
    if not app.config.get('TABLES_READY', False):
        db.create_all()
        seed_database()
        app.config['TABLES_READY'] = True


@app.get('/')
def index():
    return jsonify({'message': 'AssetFlow API is running'})


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


@app.post('/api/auth/register')
def register():
    data = request.get_json() or {}
    email = data.get('email')
    full_name = data.get('full_name') or data.get('name')
    password = data.get('password')
    if not email or not full_name or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 400
    role = Role.query.filter_by(name=(data.get('role') or 'Employee')).first() or Role.query.filter_by(name='Employee').first()
    department = Department.query.filter_by(name=data.get('department') or 'Operations').first() or Department.query.first()
    user = User(full_name=full_name, email=email, password_hash=hash_password(password), role_id=role.id, department_id=department.id if department else None)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=user.id)
    return jsonify({'token': token, 'user': {'id': user.id, 'full_name': user.full_name, 'email': user.email, 'role': role.name}})


@app.post('/api/auth/login')
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = create_access_token(identity=user.id)
    role = user.role.name if user.role else 'Employee'
    return jsonify({'token': token, 'user': {'id': user.id, 'full_name': user.full_name, 'email': user.email, 'role': role}})


@app.get('/api/auth/me')
@jwt_required()
def current_user():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': {'id': user.id, 'full_name': user.full_name, 'email': user.email, 'role': user.role.name if user.role else 'Employee'}})


@app.get('/api/dashboard')
@jwt_required()
def dashboard():
    counts = {
        'assets': Asset.query.count(),
        'departments': Department.query.count(),
        'employees': Employee.query.count(),
        'maintenance': MaintenanceRequest.query.count(),
    }
    recent = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(5).all()
    return jsonify({'counts': counts, 'recent_activity': [{'action': item.action, 'details': item.details, 'created_at': item.created_at.isoformat()} for item in recent]})


@app.get('/api/departments')
@jwt_required()
def departments():
    data = Department.query.all()
    return jsonify([{'id': item.id, 'name': item.name, 'code': item.code, 'description': item.description} for item in data])


@app.post('/api/departments')
@jwt_required()
def create_department():
    data = request.get_json() or {}
    department = Department(name=data['name'], code=data['code'], description=data.get('description', ''))
    db.session.add(department)
    db.session.commit()
    return jsonify({'id': department.id, 'name': department.name, 'code': department.code})


@app.get('/api/employees')
@jwt_required()
def employees():
    data = db.session.query(Employee, User, Department).join(User, Employee.user_id == User.id).join(Department, Employee.department_id == Department.id).all()
    return jsonify([{'id': emp.id, 'full_name': user.full_name, 'job_title': emp.job_title, 'department': dept.name, 'status': emp.status} for emp, user, dept in data])


@app.post('/api/employees')
@jwt_required()
def create_employee():
    data = request.get_json() or {}
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    employee = Employee(user_id=user.id, department_id=data['department_id'], job_title=data.get('job_title', 'Employee'), phone=data.get('phone', ''), location=data.get('location', ''), status=data.get('status', 'active'))
    db.session.add(employee)
    db.session.commit()
    return jsonify({'id': employee.id})


@app.get('/api/categories')
@jwt_required()
def categories():
    data = AssetCategory.query.all()
    return jsonify([{'id': item.id, 'name': item.name, 'code': item.code, 'description': item.description} for item in data])


@app.post('/api/categories')
@jwt_required()
def create_category():
    data = request.get_json() or {}
    category = AssetCategory(name=data['name'], code=data['code'], description=data.get('description', ''))
    db.session.add(category)
    db.session.commit()
    return jsonify({'id': category.id, 'name': category.name})


@app.get('/api/assets')
@jwt_required()
def assets():
    data = db.session.query(Asset, AssetCategory, Department).join(AssetCategory, Asset.category_id == AssetCategory.id).join(Department, Asset.department_id == Department.id).all()
    return jsonify([{'id': asset.id, 'name': asset.name, 'asset_tag': asset.asset_tag, 'status': asset.status, 'category': category.name, 'department': department.name} for asset, category, department in data])


@app.post('/api/assets')
@jwt_required()
def create_asset():
    data = request.get_json() or {}
    asset = Asset(name=data['name'], asset_tag=data['asset_tag'], serial_number=data['serial_number'], category_id=data['category_id'], department_id=data['department_id'], status=data.get('status', 'available'), value=data.get('value', 0.0), location=data.get('location', 'Main Office'))
    db.session.add(asset)
    db.session.commit()
    return jsonify({'id': asset.id, 'asset_tag': asset.asset_tag})


@app.get('/api/bookings')
@jwt_required()
def bookings():
    data = Booking.query.all()
    return jsonify([{'id': item.id, 'resource_type': item.resource_type, 'resource_name': item.resource_name, 'purpose': item.purpose, 'status': item.status} for item in data])


@app.post('/api/bookings')
@jwt_required()
def create_booking():
    data = request.get_json() or {}
    booking = Booking(resource_type=data['resource_type'], resource_name=data['resource_name'], booked_by_user_id=get_jwt_identity(), start_time=datetime.fromisoformat(data['start_time']), end_time=datetime.fromisoformat(data['end_time']), purpose=data.get('purpose', ''), status='confirmed')
    db.session.add(booking)
    db.session.commit()
    return jsonify({'id': booking.id})


@app.get('/api/maintenance')
@jwt_required()
def maintenance():
    data = MaintenanceRequest.query.all()
    return jsonify([{'id': item.id, 'issue_description': item.issue_description, 'priority': item.priority, 'status': item.status} for item in data])


@app.post('/api/maintenance')
@jwt_required()
def create_maintenance():
    data = request.get_json() or {}
    request_item = MaintenanceRequest(asset_id=data['asset_id'], requested_by_user_id=get_jwt_identity(), issue_description=data['issue_description'], priority=data.get('priority', 'medium'))
    db.session.add(request_item)
    db.session.commit()
    return jsonify({'id': request_item.id})


@app.get('/api/notifications')
@jwt_required()
def notifications():
    data = Notification.query.filter_by(user_id=get_jwt_identity()).all()
    return jsonify([{'id': item.id, 'title': item.title, 'message': item.message, 'is_read': item.is_read} for item in data])


@app.get('/api/activity')
@jwt_required()
def activity():
    data = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(10).all()
    return jsonify([{'action': item.action, 'details': item.details, 'created_at': item.created_at.isoformat()} for item in data])


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
