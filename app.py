import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from sqlalchemy import func, text
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
        engine = create_engine('mysql+pymysql://root:@localhost:3306/assetflow_db')
        with engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        return 'mysql+pymysql://root:@localhost:3306/assetflow_db'
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
    approved_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    rejected_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    rejected_at = db.Column(db.DateTime)


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


def validate_required_fields(data, required_fields):
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def record_activity(user_id, action, details):
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))
    db.session.commit()


def notify_user(user_id, title, message):
    if not user_id:
        return
    db.session.add(Notification(user_id=user_id, title=title, message=message))
    db.session.commit()


def enqueue_overdue_return_notifications():
    today = datetime.utcnow()
    allocations = AssetAllocation.query.filter(
        AssetAllocation.status == 'assigned',
        AssetAllocation.expected_return_date.is_not(None),
        AssetAllocation.expected_return_date < today,
    ).all()
    for allocation in allocations:
        if allocation.assigned_to_user_id:
            existing = Notification.query.filter_by(
                user_id=allocation.assigned_to_user_id,
                title='Return Overdue',
                message=f'Asset {allocation.asset_id} is overdue for return.'
            ).first()
            if not existing:
                notify_user(allocation.assigned_to_user_id, 'Return Overdue', f'Asset {allocation.asset_id} is overdue for return.')


def process_booking_updates():
    now = datetime.utcnow()
    reminder_threshold = now + timedelta(hours=1)
    upcoming = Booking.query.filter(
        Booking.status == 'upcoming',
        Booking.start_time <= reminder_threshold,
        Booking.start_time > now
    ).all()
    for b in upcoming:
        msg = f"Reminder: Your booking for {b.resource_name} starts at {b.start_time.strftime('%H:%M')}."
        existing = Notification.query.filter_by(user_id=b.booked_by_user_id, title='Booking Reminder', message=msg).first()
        if not existing:
            notify_user(b.booked_by_user_id, 'Booking Reminder', msg)

    starting_now = Booking.query.filter(Booking.status == 'upcoming', Booking.start_time <= now).all()
    for b in starting_now:
        b.status = 'ongoing'

    ending_now = Booking.query.filter(Booking.status == 'ongoing', Booking.end_time <= now).all()
    for b in ending_now:
        b.status = 'completed'

    if starting_now or ending_now:
        db.session.commit()


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
        'available_assets': Asset.query.filter_by(status='available').count(),
        'allocated_assets': Asset.query.filter_by(status='assigned').count(),
        'pending_transfers': TransferRequest.query.filter_by(status='pending').count(),
        'audit_cycles': AuditCycle.query.count(),
        'bookings': Booking.query.count(),
    }
    recent = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(8).all()
    return jsonify({
        'counts': counts,
        'recent_activity': [{'action': item.action, 'details': item.details, 'created_at': item.created_at.isoformat()} for item in recent],
    })


@app.get('/api/departments')
@jwt_required()
def departments():
    data = Department.query.all()
    return jsonify([{'id': item.id, 'name': item.name, 'code': item.code, 'description': item.description} for item in data])


@app.post('/api/departments')
@jwt_required()
def create_department():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['name', 'code'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    if Department.query.filter((Department.name == data['name']) | (Department.code == data['code'])).first():
        return jsonify({'error': 'Department already exists'}), 400
    department = Department(name=data['name'], code=data['code'], description=data.get('description', ''))
    db.session.add(department)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Department Created', f"Created department {department.name}")
    return jsonify({'id': department.id, 'name': department.name, 'code': department.code})


@app.patch('/api/departments/<int:department_id>')
@jwt_required()
def update_department(department_id):
    department = Department.query.get_or_404(department_id)
    data = request.get_json() or {}
    if 'name' in data:
        existing = Department.query.filter(Department.name == data['name'], Department.id != department_id).first()
        if existing:
            return jsonify({'error': 'Department name already exists'}), 400
        department.name = data['name']
    if 'code' in data:
        existing = Department.query.filter(Department.code == data['code'], Department.id != department_id).first()
        if existing:
            return jsonify({'error': 'Department code already exists'}), 400
        department.code = data['code']
    if 'description' in data:
        department.description = data['description']
    if 'head_user_id' in data:
        if data['head_user_id'] and not User.query.get(data['head_user_id']):
            return jsonify({'error': 'User not found'}), 400
        department.head_user_id = data['head_user_id']
    db.session.commit()
    record_activity(get_jwt_identity(), 'Department Updated', f"Updated department {department.name}")
    return jsonify({'id': department.id, 'name': department.name, 'code': department.code})


@app.delete('/api/departments/<int:department_id>')
@jwt_required()
def delete_department(department_id):
    department = Department.query.get_or_404(department_id)
    if Employee.query.filter_by(department_id=department_id).first():
        return jsonify({'error': 'Cannot delete department with employees'}), 400
    if Asset.query.filter_by(department_id=department_id).first():
        return jsonify({'error': 'Cannot delete department with assets'}), 400
    db.session.delete(department)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Department Deleted', f"Deleted department {department.name}")
    return jsonify({'ok': True})


@app.get('/api/employees')
@jwt_required()
def employees():
    data = db.session.query(Employee, User, Department).join(User, Employee.user_id == User.id).join(Department, Employee.department_id == Department.id).all()
    return jsonify([{'id': emp.id, 'full_name': user.full_name, 'job_title': emp.job_title, 'department': dept.name, 'status': emp.status} for emp, user, dept in data])


@app.post('/api/employees')
@jwt_required()
def create_employee():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['email', 'job_title'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    if data.get('department_id') and not Department.query.get(data['department_id']):
        return jsonify({'error': 'Department not found'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        user = User(
            full_name=data.get('full_name', data['email']),
            email=data['email'],
            password_hash=hash_password(data.get('password', 'Welcome123!')),
            role_id=Role.query.filter_by(name='Employee').first().id,
            department_id=data.get('department_id'),
        )
        db.session.add(user)
        db.session.commit()
    employee = Employee(user_id=user.id, department_id=data.get('department_id'), job_title=data.get('job_title', 'Employee'), phone=data.get('phone', ''), location=data.get('location', ''), status=data.get('status', 'active'))
    db.session.add(employee)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Employee Registered', f"Registered {user.full_name}")
    return jsonify({'id': employee.id})


@app.patch('/api/employees/<int:employee_id>')
@jwt_required()
def update_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    data = request.get_json() or {}
    if 'department_id' in data:
        if not Department.query.get(data['department_id']):
            return jsonify({'error': 'Department not found'}), 400
        employee.department_id = data['department_id']
    if 'job_title' in data:
        employee.job_title = data['job_title']
    if 'phone' in data:
        employee.phone = data['phone']
    if 'location' in data:
        employee.location = data['location']
    if 'status' in data:
        employee.status = data['status']
    if 'is_department_head' in data:
        employee.is_department_head = data['is_department_head']
    if 'is_asset_manager' in data:
        employee.is_asset_manager = data['is_asset_manager']
    db.session.commit()
    record_activity(get_jwt_identity(), 'Employee Updated', f"Updated employee {employee_id}")
    return jsonify({'id': employee.id})


@app.delete('/api/employees/<int:employee_id>')
@jwt_required()
def delete_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    if AssetAllocation.query.filter_by(assigned_to_user_id=employee.user_id).filter(AssetAllocation.status == 'assigned').first():
        return jsonify({'error': 'Cannot delete employee with active asset allocations'}), 400
    user = User.query.get(employee.user_id)
    db.session.delete(employee)
    if user:
        user.is_active = False
    db.session.commit()
    record_activity(get_jwt_identity(), 'Employee Deleted', f"Deleted employee {employee_id}")
    return jsonify({'ok': True})


@app.get('/api/categories')
@jwt_required()
def categories():
    data = AssetCategory.query.all()
    return jsonify([{'id': item.id, 'name': item.name, 'code': item.code, 'description': item.description} for item in data])


@app.get('/api/users')
@jwt_required()
def users():
    data = User.query.order_by(User.full_name.asc()).all()
    return jsonify([{'id': item.id, 'full_name': item.full_name, 'email': item.email, 'role': item.role.name if item.role else ''} for item in data])


@app.post('/api/categories')
@jwt_required()
def create_category():
    data = request.get_json() or {}
    if AssetCategory.query.filter((AssetCategory.name == data['name']) | (AssetCategory.code == data['code'])).first():
        return jsonify({'error': 'Category already exists'}), 400
    category = AssetCategory(name=data['name'], code=data['code'], description=data.get('description', ''))
    db.session.add(category)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Category Created', f"Created category {category.name}")
    return jsonify({'id': category.id, 'name': category.name})


@app.patch('/api/categories/<int:category_id>')
@jwt_required()
def update_category(category_id):
    category = AssetCategory.query.get_or_404(category_id)
    data = request.get_json() or {}
    if 'name' in data:
        existing = AssetCategory.query.filter(AssetCategory.name == data['name'], AssetCategory.id != category_id).first()
        if existing:
            return jsonify({'error': 'Category name already exists'}), 400
        category.name = data['name']
    if 'code' in data:
        existing = AssetCategory.query.filter(AssetCategory.code == data['code'], AssetCategory.id != category_id).first()
        if existing:
            return jsonify({'error': 'Category code already exists'}), 400
        category.code = data['code']
    if 'description' in data:
        category.description = data['description']
    db.session.commit()
    record_activity(get_jwt_identity(), 'Category Updated', f"Updated category {category.name}")
    return jsonify({'id': category.id, 'name': category.name})


@app.delete('/api/categories/<int:category_id>')
@jwt_required()
def delete_category(category_id):
    category = AssetCategory.query.get_or_404(category_id)
    if Asset.query.filter_by(category_id=category_id).first():
        return jsonify({'error': 'Cannot delete category with assets'}), 400
    db.session.delete(category)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Category Deleted', f"Deleted category {category.name}")
    return jsonify({'ok': True})


@app.get('/api/assets')
@jwt_required()
def assets():
    data = db.session.query(Asset, AssetCategory, Department).join(AssetCategory, Asset.category_id == AssetCategory.id).join(Department, Asset.department_id == Department.id).all()
    return jsonify([{'id': asset.id, 'name': asset.name, 'asset_tag': asset.asset_tag, 'status': asset.status, 'category': category.name, 'department': department.name} for asset, category, department in data])


@app.get('/api/assets/<int:asset_id>')
@jwt_required()
def asset_detail(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    category = AssetCategory.query.get(asset.category_id)
    department = Department.query.get(asset.department_id)
    assigned_user = User.query.get(asset.assigned_to_user_id) if asset.assigned_to_user_id else None
    images = AssetImage.query.filter_by(asset_id=asset_id).all()
    history = AssetHistory.query.filter_by(asset_id=asset_id).order_by(AssetHistory.created_at.desc()).limit(10).all()
    
    return jsonify({
        'id': asset.id,
        'name': asset.name,
        'asset_tag': asset.asset_tag,
        'serial_number': asset.serial_number,
        'status': asset.status,
        'category': {'id': category.id, 'name': category.name, 'code': category.code} if category else None,
        'department': {'id': department.id, 'name': department.name, 'code': department.code} if department else None,
        'assigned_to': {'id': assigned_user.id, 'full_name': assigned_user.full_name, 'email': assigned_user.email} if assigned_user else None,
        'purchase_date': asset.purchase_date.isoformat() if asset.purchase_date else None,
        'warranty_end': asset.warranty_end.isoformat() if asset.warranty_end else None,
        'location': asset.location,
        'value': float(asset.value) if asset.value else 0,
        'description': asset.description,
        'qr_code': asset.qr_code,
        'created_at': asset.created_at.isoformat() if asset.created_at else None,
        'images': [{'id': img.id, 'image_url': img.image_url, 'caption': img.caption} for img in images],
        'history': [{'id': h.id, 'action': h.action, 'details': h.details, 'created_at': h.created_at.isoformat()} for h in history]
    })


@app.post('/api/assets')
@jwt_required()
def create_asset():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['name', 'asset_tag', 'serial_number'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    if Asset.query.filter((Asset.asset_tag == data['asset_tag']) | (Asset.serial_number == data['serial_number'])).first():
        return jsonify({'error': 'Asset tag or serial number already exists'}), 400
    category = AssetCategory.query.get(int(data.get('category_id', 1)))
    department = Department.query.get(int(data.get('department_id', 1)))
    if not category or not department:
        return jsonify({'error': 'Category or department not found'}), 400
    asset = Asset(
        name=data['name'],
        asset_tag=data['asset_tag'],
        serial_number=data['serial_number'],
        category_id=category.id,
        department_id=department.id,
        assigned_to_user_id=data.get('assigned_to_user_id'),
        status=data.get('status', 'available'),
        value=float(data.get('value', 0.0)),
        location=data.get('location', 'Main Office'),
        description=data.get('description', ''),
        qr_code=data.get('asset_tag', ''),
    )
    db.session.add(asset)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Asset Registered', f"Registered asset {asset.name}")
    return jsonify({'id': asset.id, 'asset_tag': asset.asset_tag})


@app.patch('/api/assets/<int:asset_id>')
@jwt_required()
def update_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data = request.get_json() or {}
    for field in ['status', 'location', 'description']:
        if field in data:
            setattr(asset, field, data[field])
    if 'department_id' in data:
        if not Department.query.get(data['department_id']):
            return jsonify({'error': 'Department not found'}), 400
        asset.department_id = data['department_id']
    if 'assigned_to_user_id' in data:
        if data['assigned_to_user_id'] and not User.query.get(data['assigned_to_user_id']):
            return jsonify({'error': 'User not found'}), 400
        asset.assigned_to_user_id = data['assigned_to_user_id']
    if 'value' in data:
        asset.value = float(data['value'])
    if 'category_id' in data:
        if not AssetCategory.query.get(data['category_id']):
            return jsonify({'error': 'Category not found'}), 400
        asset.category_id = data['category_id']
    if 'warranty_end' in data:
        asset.warranty_end = datetime.fromisoformat(data['warranty_end']).date() if data['warranty_end'] else None
    db.session.commit()
    record_activity(get_jwt_identity(), 'Asset Updated', f"Updated asset {asset.name}")
    return jsonify({'ok': True})


@app.delete('/api/assets/<int:asset_id>')
@jwt_required()
def delete_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    if AssetAllocation.query.filter_by(asset_id=asset_id).filter(AssetAllocation.status == 'assigned').first():
        return jsonify({'error': 'Cannot delete asset with active allocations'}), 400
    AssetImage.query.filter_by(asset_id=asset_id).delete()
    AssetHistory.query.filter_by(asset_id=asset_id).delete()
    db.session.delete(asset)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Asset Deleted', f"Deleted asset {asset.name}")
    return jsonify({'ok': True})


@app.get('/api/bookings')
@jwt_required()
def bookings():
    data = Booking.query.order_by(Booking.start_time.desc()).all()
    return jsonify([
        {
            'id': item.id,
            'resource_type': item.resource_type,
            'resource_name': item.resource_name,
            'purpose': item.purpose,
            'status': item.status,
            'start_time': item.start_time.isoformat() if item.start_time else None,
            'end_time': item.end_time.isoformat() if item.end_time else None,
            'booked_by_user_id': item.booked_by_user_id,
        } for item in data
    ])


@app.post('/api/bookings')
@jwt_required()
def create_booking():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['resource_type', 'resource_name', 'start_time', 'end_time'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    
    start_time = datetime.fromisoformat(data['start_time'])
    end_time = datetime.fromisoformat(data['end_time'])
    
    if end_time <= start_time:
        return jsonify({'error': 'End time must be after start time'}), 400
    
    if start_time < datetime.utcnow():
        return jsonify({'error': 'Start time must be in the future'}), 400
    
    overlapping = Booking.query.filter(
        Booking.resource_name == data['resource_name'],
        Booking.status.in_({'upcoming', 'ongoing'}),
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).first()
    
    if overlapping:
        return jsonify({'error': 'Resource is already booked for this time slot'}), 400
    
    booking = Booking(
        resource_type=data['resource_type'],
        resource_name=data['resource_name'],
        booked_by_user_id=get_jwt_identity(),
        start_time=start_time,
        end_time=end_time,
        purpose=data.get('purpose', ''),
        status='upcoming',
    )
    db.session.add(booking)
    db.session.commit()
    
    record_activity(get_jwt_identity(), 'Booking Created', f"Booked {booking.resource_name} from {start_time} to {end_time}")
    notify_user(get_jwt_identity(), 'Booking Confirmed', f"Your booking for {booking.resource_name} is confirmed for {start_time.strftime('%Y-%m-%d %H:%M')}.")
    
    return jsonify({'id': booking.id})


@app.patch('/api/bookings/<int:booking_id>')
@jwt_required()
def update_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    data = request.get_json() or {}
    
    if booking.booked_by_user_id != get_jwt_identity():
        return jsonify({'error': 'You can only modify your own bookings'}), 400
    
    if booking.status in {'completed', 'cancelled'}:
        return jsonify({'error': 'Cannot modify completed or cancelled bookings'}), 400
    
    if 'start_time' in data or 'end_time' in data:
        new_start = datetime.fromisoformat(data['start_time']) if 'start_time' in data else booking.start_time
        new_end = datetime.fromisoformat(data['end_time']) if 'end_time' in data else booking.end_time
        
        if new_end <= new_start:
            return jsonify({'error': 'End time must be after start time'}), 400
        
        if new_start < datetime.utcnow():
            return jsonify({'error': 'Start time must be in the future'}), 400
        
        overlapping = Booking.query.filter(
            Booking.resource_name == booking.resource_name,
            Booking.status.in_({'upcoming', 'ongoing'}),
            Booking.id != booking_id,
            Booking.start_time < new_end,
            Booking.end_time > new_start
        ).first()
        
        if overlapping:
            return jsonify({'error': 'Resource is already booked for this time slot'}), 400
        
        booking.start_time = new_start
        booking.end_time = new_end
    
    if 'purpose' in data:
        booking.purpose = data['purpose']
    
    if 'status' in data:
        valid_statuses = {'upcoming', 'ongoing', 'completed', 'cancelled'}
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        booking.status = data['status']
    
    db.session.commit()
    record_activity(get_jwt_identity(), 'Booking Updated', f"Updated booking for {booking.resource_name}")
    notify_user(get_jwt_identity(), 'Booking Updated', f"Your booking for {booking.resource_name} has been updated.")
    
    return jsonify({'id': booking.id, 'status': booking.status})


@app.delete('/api/bookings/<int:booking_id>')
@jwt_required()
def delete_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    
    if booking.booked_by_user_id != get_jwt_identity():
        return jsonify({'error': 'You can only cancel your own bookings'}), 400
    
    if booking.status in {'completed', 'cancelled'}:
        return jsonify({'error': 'Cannot cancel completed or already cancelled bookings'}), 400
    
    booking.status = 'cancelled'
    db.session.commit()
    
    record_activity(get_jwt_identity(), 'Booking Cancelled', f"Cancelled booking for {booking.resource_name}")
    notify_user(get_jwt_identity(), 'Booking Cancelled', f"Your booking for {booking.resource_name} has been cancelled.")
    
    return jsonify({'ok': True})


@app.get('/api/maintenance')
@jwt_required()
def maintenance():
    data = MaintenanceRequest.query.order_by(MaintenanceRequest.created_at.desc()).all()
    return jsonify([
        {
            'id': item.id,
            'asset_id': item.asset_id,
            'issue_description': item.issue_description,
            'priority': item.priority,
            'status': item.status,
            'requested_by_user_id': item.requested_by_user_id,
            'assigned_technician_id': item.assigned_technician_id,
            'created_at': item.created_at.isoformat() if item.created_at else None,
            'completed_at': item.completed_at.isoformat() if item.completed_at else None,
        } for item in data
    ])


@app.post('/api/maintenance')
@jwt_required()
def create_maintenance():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['asset_id', 'issue_description'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    
    asset = Asset.query.get_or_404(data['asset_id'])
    
    existing_pending = MaintenanceRequest.query.filter_by(
        asset_id=data['asset_id'],
        status='pending'
    ).first()
    if existing_pending:
        return jsonify({'error': 'Asset already has a pending maintenance request'}), 400
    
    request_item = MaintenanceRequest(
        asset_id=data['asset_id'],
        requested_by_user_id=get_jwt_identity(),
        issue_description=data['issue_description'],
        priority=data.get('priority', 'medium'),
        status='pending',
    )
    db.session.add(request_item)
    db.session.commit()
    
    record_activity(get_jwt_identity(), 'Maintenance Requested', f"Reported issue for asset {asset.name}")
    notify_user(get_jwt_identity(), 'Maintenance Request Submitted', f"Maintenance request for asset {asset.name} is pending review.")
    
    return jsonify({'id': request_item.id})


@app.patch('/api/maintenance/<int:maintenance_id>')
@jwt_required()
def update_maintenance(maintenance_id):
    data = request.get_json() or {}
    item = MaintenanceRequest.query.get_or_404(maintenance_id)
    asset = Asset.query.get(item.asset_id)
    
    valid_statuses = {'pending', 'approved', 'rejected', 'in_progress', 'resolved'}
    valid_transitions = {
        'pending': {'approved', 'rejected'},
        'approved': {'in_progress'},
        'in_progress': {'resolved'},
        'rejected': set(),
        'resolved': set(),
    }
    
    if 'status' in data:
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        if item.status != data['status']:
            if data['status'] not in valid_transitions.get(item.status, set()):
                return jsonify({'error': f'Invalid status transition from {item.status} to {data["status"]}'}), 400
            
            old_status = item.status
            item.status = data['status']
            
            if data['status'] == 'approved':
                item.approved_by_user_id = get_jwt_identity()
                item.approved_at = datetime.utcnow()
                if asset:
                    asset.status = 'under_maintenance'
                    history = AssetHistory(
                        asset_id=asset.id,
                        action='Under Maintenance',
                        details=f"Asset placed under maintenance for: {item.issue_description}"
                    )
                    db.session.add(history)
            
            elif data['status'] == 'rejected':
                item.rejected_by_user_id = get_jwt_identity()
                item.rejected_at = datetime.utcnow()
            
            elif data['status'] == 'in_progress':
                if 'assigned_technician_id' in data:
                    if not Technician.query.get(data['assigned_technician_id']):
                        return jsonify({'error': 'Technician not found'}), 400
                    item.assigned_technician_id = data['assigned_technician_id']
                item.started_at = datetime.utcnow()
            
            elif data['status'] == 'resolved':
                item.completed_at = datetime.utcnow()
                if asset:
                    asset.status = 'available'
                    history = AssetHistory(
                        asset_id=asset.id,
                        action='Maintenance Resolved',
                        details=f"Maintenance completed for: {item.issue_description}"
                    )
                    db.session.add(history)
    
    if 'priority' in data:
        valid_priorities = {'low', 'medium', 'high'}
        if data['priority'] not in valid_priorities:
            return jsonify({'error': f'Invalid priority. Must be one of: {", ".join(valid_priorities)}'}), 400
        item.priority = data['priority']
    
    if 'issue_description' in data:
        item.issue_description = data['issue_description']
    
    if 'assigned_technician_id' in data and 'status' not in data:
        if not Technician.query.get(data['assigned_technician_id']):
            return jsonify({'error': 'Technician not found'}), 400
        item.assigned_technician_id = data['assigned_technician_id']
    
    db.session.commit()
    record_activity(get_jwt_identity(), 'Maintenance Updated', f"Updated maintenance request {item.id} from {old_status if 'old_status' in locals() else item.status} to {item.status}")
    
    if item.status in {'approved', 'rejected', 'resolved'}:
        notify_user(item.requested_by_user_id, 'Maintenance Update', f"Maintenance request {item.id} is now {item.status}.")
    
    return jsonify({'id': item.id, 'status': item.status})


@app.get('/api/notifications')
@jwt_required()
def notifications():
    enqueue_overdue_return_notifications()
    process_booking_updates()
    data = Notification.query.filter_by(user_id=get_jwt_identity()).order_by(Notification.created_at.desc()).all()
    return jsonify([{'id': item.id, 'title': item.title, 'message': item.message, 'is_read': item.is_read, 'created_at': item.created_at.isoformat()} for item in data])


@app.post('/api/notifications/<int:notification_id>/read')
@jwt_required()
def mark_notification_read(notification_id):
    item = Notification.query.filter_by(id=notification_id, user_id=get_jwt_identity()).first_or_404()
    item.is_read = True
    db.session.commit()
    return jsonify({'ok': True})


@app.get('/api/activity')
@jwt_required()
def activity():
    data = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(10).all()
    return jsonify([{'action': item.action, 'details': item.details, 'created_at': item.created_at.isoformat()} for item in data])


@app.get('/api/allocations')
@jwt_required()
def allocations():
    data = AssetAllocation.query.order_by(AssetAllocation.assigned_date.desc()).all()
    return jsonify([
        {
            'id': item.id,
            'asset_id': item.asset_id,
            'assigned_to_user_id': item.assigned_to_user_id,
            'assigned_by_user_id': item.assigned_by_user_id,
            'status': item.status,
            'assigned_date': item.assigned_date.isoformat() if item.assigned_date else None,
            'expected_return_date': item.expected_return_date.isoformat() if item.expected_return_date else None,
        } for item in data
    ])


@app.post('/api/allocations')
@jwt_required()
def create_allocation():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['asset_id', 'assigned_to_user_id'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    
    asset = Asset.query.get_or_404(data['asset_id'])
    if asset.status != 'available':
        return jsonify({'error': 'Asset is not available for allocation'}), 400
    
    existing_allocation = AssetAllocation.query.filter_by(
        asset_id=data['asset_id'],
        status='assigned'
    ).first()
    if existing_allocation:
        return jsonify({'error': 'Asset is already allocated'}), 400
    
    if not User.query.get(data['assigned_to_user_id']):
        return jsonify({'error': 'User not found'}), 400
    
    expected_return_date = datetime.fromisoformat(data['expected_return_date']) if data.get('expected_return_date') else None
    if expected_return_date and expected_return_date <= datetime.utcnow():
        return jsonify({'error': 'Expected return date must be in the future'}), 400
    
    allocation = AssetAllocation(
        asset_id=asset.id,
        assigned_to_user_id=data['assigned_to_user_id'],
        assigned_by_user_id=get_jwt_identity(),
        expected_return_date=expected_return_date,
        status='assigned',
    )
    
    asset.status = 'assigned'
    asset.assigned_to_user_id = data['assigned_to_user_id']
    
    db.session.add(allocation)
    
    history = AssetHistory(
        asset_id=asset.id,
        action='Allocated',
        details=f"Allocated to user {data['assigned_to_user_id']} by {get_jwt_identity()}"
    )
    db.session.add(history)
    
    db.session.commit()
    record_activity(get_jwt_identity(), 'Asset Allocated', f"Allocated {asset.name} to user {data['assigned_to_user_id']}")
    notify_user(data['assigned_to_user_id'], 'Asset Assigned', f"Asset {asset.name} has been assigned to you.")
    
    if allocation.expected_return_date:
        notify_user(data['assigned_to_user_id'], 'Return Date', f"Expected return date: {allocation.expected_return_date.strftime('%Y-%m-%d')}")
    
    return jsonify({'id': allocation.id})


@app.post('/api/allocations/<int:allocation_id>/return')
@jwt_required()
def return_allocation(allocation_id):
    allocation = AssetAllocation.query.get_or_404(allocation_id)
    if allocation.status != 'assigned':
        return jsonify({'error': 'Allocation is not active'}), 400
    
    allocation.returned_date = datetime.utcnow()
    allocation.status = 'returned'
    
    asset = Asset.query.get(allocation.asset_id)
    if asset:
        asset.status = 'available'
        asset.assigned_to_user_id = None
        
        history = AssetHistory(
            asset_id=asset.id,
            action='Returned',
            details=f"Returned by user {allocation.assigned_to_user_id}, processed by {get_jwt_identity()}"
        )
        db.session.add(history)
    
    db.session.commit()
    record_activity(get_jwt_identity(), 'Asset Returned', f"Returned asset {asset.name if asset else allocation.asset_id}")
    notify_user(allocation.assigned_to_user_id, 'Asset Returned', f"Asset {asset.name if asset else allocation.asset_id} has been returned.")
    return jsonify({'ok': True})


@app.get('/api/transfers')
@jwt_required()
def transfers():
    data = TransferRequest.query.order_by(TransferRequest.requested_at.desc()).all()
    return jsonify([
        {
            'id': item.id,
            'asset_id': item.asset_id,
            'from_department_id': item.from_department_id,
            'to_department_id': item.to_department_id,
            'reason': item.reason,
            'status': item.status,
            'requested_at': item.requested_at.isoformat() if item.requested_at else None,
        } for item in data
    ])


@app.post('/api/transfers')
@jwt_required()
def create_transfer():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['asset_id', 'from_department_id', 'to_department_id'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    
    if data['from_department_id'] == data['to_department_id']:
        return jsonify({'error': 'Transfer destination must differ from source department'}), 400
    
    asset = Asset.query.get_or_404(data['asset_id'])
    if asset.department_id != data['from_department_id']:
        return jsonify({'error': 'Asset is not in the source department'}), 400
    
    if not Department.query.get(data['to_department_id']):
        return jsonify({'error': 'Destination department not found'}), 400
    
    existing_pending = TransferRequest.query.filter_by(
        asset_id=data['asset_id'],
        status='pending'
    ).first()
    if existing_pending:
        return jsonify({'error': 'Asset already has a pending transfer request'}), 400
    
    transfer = TransferRequest(
        asset_id=data['asset_id'],
        requested_by_user_id=get_jwt_identity(),
        from_department_id=data['from_department_id'],
        to_department_id=data['to_department_id'],
        reason=data.get('reason', ''),
        status='pending',
    )
    db.session.add(transfer)
    db.session.commit()
    
    record_activity(get_jwt_identity(), 'Transfer Requested', f"Requested transfer for asset {asset.name}")
    notify_user(get_jwt_identity(), 'Transfer Requested', f"Transfer requested for asset {asset.name}.")
    
    if asset.assigned_to_user_id:
        notify_user(asset.assigned_to_user_id, 'Transfer Requested', f"Asset {asset.name} is pending transfer to another department.")
    
    return jsonify({'id': transfer.id})


@app.post('/api/transfers/<int:transfer_id>/approve')
@jwt_required()
def approve_transfer(transfer_id):
    transfer = TransferRequest.query.get_or_404(transfer_id)
    if transfer.status != 'pending':
        return jsonify({'error': 'Transfer is not pending'}), 400
    
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 400
    
    is_manager = current_user.role and current_user.role.name in {'Asset Manager', 'Admin'}
    is_dept_head = Employee.query.filter_by(user_id=current_user_id, department_id=transfer.from_department_id, is_department_head=True).first()
    
    if not (is_manager or is_dept_head):
        return jsonify({'error': 'Only Asset Manager or Department Head can approve transfers'}), 400
    
    transfer.status = 'approved'
    transfer.approved_by_user_id = current_user_id
    transfer.approved_at = datetime.utcnow()
    
    asset = Asset.query.get(transfer.asset_id)
    if asset:
        old_department = asset.department_id
        asset.department_id = transfer.to_department_id
        
        history = AssetHistory(
            asset_id=asset.id,
            action='Transferred',
            details=f"Transferred from department {old_department} to {transfer.to_department_id}, approved by {current_user.full_name}"
        )
        db.session.add(history)
    
    db.session.commit()
    record_activity(current_user_id, 'Transfer Approved', f"Approved transfer for asset {asset.name if asset else transfer.asset_id}")
    notify_user(transfer.requested_by_user_id, 'Transfer Approved', f"Transfer for asset {asset.name if asset else transfer.asset_id} was approved.")
    
    return jsonify({'ok': True})


@app.post('/api/transfers/<int:transfer_id>/reject')
@jwt_required()
def reject_transfer(transfer_id):
    transfer = TransferRequest.query.get_or_404(transfer_id)
    if transfer.status != 'pending':
        return jsonify({'error': 'Transfer is not pending'}), 400
    
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 400
    
    is_manager = current_user.role and current_user.role.name in {'Asset Manager', 'Admin'}
    is_dept_head = Employee.query.filter_by(user_id=current_user_id, department_id=transfer.from_department_id, is_department_head=True).first()
    
    if not (is_manager or is_dept_head):
        return jsonify({'error': 'Only Asset Manager or Department Head can reject transfers'}), 400
    
    transfer.status = 'rejected'
    transfer.rejected_by_user_id = current_user_id
    transfer.rejected_at = datetime.utcnow()
    
    db.session.commit()
    record_activity(current_user_id, 'Transfer Rejected', f"Rejected transfer for asset {transfer.asset_id}")
    notify_user(transfer.requested_by_user_id, 'Transfer Rejected', f"Transfer for asset {transfer.asset_id} was rejected.")
    
    return jsonify({'ok': True})


@app.get('/api/audits')
@jwt_required()
def audits():
    data = AuditCycle.query.order_by(AuditCycle.scheduled_date.desc()).all()
    return jsonify([
        {
            'id': item.id,
            'title': item.title,
            'department_id': item.department_id,
            'scheduled_date': item.scheduled_date.isoformat() if item.scheduled_date else None,
            'status': item.status,
        } for item in data
    ])


@app.post('/api/audits')
@jwt_required()
def create_audit():
    data = request.get_json() or {}
    try:
        validate_required_fields(data, ['title', 'department_id'])
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    if not Department.query.get(data['department_id']):
        return jsonify({'error': 'Department not found'}), 400
    audit = AuditCycle(
        title=data['title'],
        department_id=data['department_id'],
        scheduled_date=datetime.fromisoformat(data['scheduled_date']).date() if data.get('scheduled_date') else datetime.utcnow().date(),
        status=data.get('status', 'planned'),
        created_by_user_id=get_jwt_identity(),
    )
    db.session.add(audit)
    db.session.commit()
    record_activity(get_jwt_identity(), 'Audit Scheduled', f"Scheduled audit {audit.title}")
    if data.get('status') in {'discrepancy', 'needs_follow_up'}:
        notify_user(get_jwt_identity(), 'Audit Discrepancy', f"Audit {audit.title} flagged a discrepancy that requires follow-up.")
    return jsonify({'id': audit.id})


@app.get('/api/reports')
@jwt_required()
def reports():
    asset_status_counts = db.session.query(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()
    maintenance_counts = db.session.query(MaintenanceRequest.status, func.count(MaintenanceRequest.id)).group_by(MaintenanceRequest.status).all()
    latest_allocations = AssetAllocation.query.order_by(AssetAllocation.assigned_date.desc()).limit(5).all()
    return jsonify({
        'asset_status_counts': [{'status': status, 'count': count} for status, count in asset_status_counts],
        'maintenance_counts': [{'status': status, 'count': count} for status, count in maintenance_counts],
        'latest_allocations': [
            {'asset_id': item.asset_id, 'assigned_to_user_id': item.assigned_to_user_id, 'status': item.status} for item in latest_allocations
        ],
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
