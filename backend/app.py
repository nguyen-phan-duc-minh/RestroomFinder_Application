from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "restroom_finder.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Restroom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_free = db.Column(db.Boolean, default=True)
    price = db.Column(db.Integer, default=0)  # VND
    current_users = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    admin_contact = db.Column(db.String(100), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('owner.id'), nullable=True)
    # Toilet facilities
    male_standing = db.Column(db.Integer, default=0)
    male_sitting = db.Column(db.Integer, default=0)
    female_sitting = db.Column(db.Integer, default=0)
    disabled_access = db.Column(db.Boolean, default=False)
    # Multiple images as JSON string
    images = db.Column(db.Text, nullable=True)  # JSON array of image URLs
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=True)  # nullable for random users
    is_random_user = db.Column(db.Boolean, default=True)
    current_restroom_id = db.Column(db.Integer, db.ForeignKey('restroom.id'), nullable=True)
    is_using = db.Column(db.Boolean, default=False)
    start_time = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restroom_id = db.Column(db.Integer, db.ForeignKey('restroom.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text, nullable=True)
    image_path = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restroom_id = db.Column(db.Integer, db.ForeignKey('restroom.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='normal')  # normal, sos, paper_request
    is_from_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UsageHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restroom_id = db.Column(db.Integer, db.ForeignKey('restroom.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='usage_history')
    restroom = db.relationship('Restroom', backref='usage_history')

class Owner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    restrooms = db.relationship('Restroom', backref='owner', lazy=True)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('owner.id'), nullable=False)
    restroom_id = db.Column(db.Integer, db.ForeignKey('restroom.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    type = db.Column(db.String(50), nullable=False)  # 'navigation_request', 'arrival', 'usage_start', 'usage_end', 'payment_confirmation'
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    restroom = db.relationship('Restroom', backref='notifications')

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restroom_id = db.Column(db.Integer, db.ForeignKey('restroom.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('owner.id'), nullable=False)
    method = db.Column(db.String(20), nullable=False)  # 'cash' or 'transfer'
    amount = db.Column(db.Integer, nullable=False)  # VND
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'rejected'
    transfer_image_path = db.Column(db.String(500), nullable=True)  # for transfer method
    note = db.Column(db.Text, nullable=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships - use different backref names to avoid conflicts
    user = db.relationship('User', backref='user_payments')
    restroom = db.relationship('Restroom', backref='restroom_payments')
    owner = db.relationship('Owner', backref='owner_payments')

# API Routes
@app.route('/api/restrooms', methods=['GET'])
def get_restrooms():
    restrooms = Restroom.query.all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'address': r.address,
        'latitude': r.latitude,
        'longitude': r.longitude,
        'is_free': r.is_free,
        'price': r.price,
        'current_users': r.current_users,
        'rating': r.rating,
        'total_reviews': r.total_reviews,
        'admin_contact': r.admin_contact,
        'image_url': r.image_url,
        'male_standing': r.male_standing or 0,
        'male_sitting': r.male_sitting or 0,
        'female_sitting': r.female_sitting or 0,
        'disabled_access': r.disabled_access or False,
        'images': json.loads(r.images) if r.images else []
    } for r in restrooms])

@app.route('/api/restrooms/<int:restroom_id>', methods=['GET'])
def get_restroom_details(restroom_id):
    restroom = Restroom.query.get_or_404(restroom_id)
    reviews = Review.query.filter_by(restroom_id=restroom_id).order_by(Review.created_at.desc()).limit(10).all()
    
    return jsonify({
        'id': restroom.id,
        'name': restroom.name,
        'address': restroom.address,
        'latitude': restroom.latitude,
        'longitude': restroom.longitude,
        'is_free': restroom.is_free,
        'price': restroom.price,
        'current_users': restroom.current_users,
        'rating': restroom.rating,
        'total_reviews': restroom.total_reviews,
        'admin_contact': restroom.admin_contact,
        'image_url': restroom.image_url,
        'images': json.loads(restroom.images) if restroom.images else [],
        'reviews': [{
            'id': rev.id,
            'rating': rev.rating,
            'comment': rev.comment,
            'image_path': rev.image_path,
            'created_at': rev.created_at.isoformat()
        } for rev in reviews]
    })

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(username=data['username'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'username': user.username
    }), 201

@app.route('/api/reviews', methods=['POST'])
def create_review():
    data = request.get_json()
    
    review = Review(
        restroom_id=data['restroom_id'],
        user_id=data['user_id'],
        rating=data['rating'],
        comment=data.get('comment', ''),
        image_path=data.get('image_path', '')
    )
    
    db.session.add(review)
    
    # Update restroom rating
    restroom = Restroom.query.get(data['restroom_id'])
    reviews = Review.query.filter_by(restroom_id=data['restroom_id']).all()
    total_rating = sum(r.rating for r in reviews) + data['rating']
    total_reviews = len(reviews) + 1
    restroom.rating = total_rating / total_reviews
    restroom.total_reviews = total_reviews
    
    # Send notification to owner if restroom has owner
    if restroom.owner_id:
        user = User.query.get(data['user_id']) if data.get('user_id') else None
        username = user.username if user else "Khách"
        
        notification = Notification(
            owner_id=restroom.owner_id,
            restroom_id=data['restroom_id'],
            user_id=data.get('user_id'),
            type='review',
            message=f'{username} đã đánh giá {data["rating"]} sao cho {restroom.name}'
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': 'Review created successfully'}), 201

@app.route('/api/chat/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    
    message = ChatMessage(
        restroom_id=data['restroom_id'],
        user_id=data['user_id'],
        message=data['message'],
        message_type=data.get('message_type', 'normal'),
        is_from_admin=data.get('is_from_admin', False)
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({'message': 'Message sent successfully'}), 201

@app.route('/api/restrooms/<int:restroom_id>/navigation', methods=['POST'])
def request_navigation(restroom_id):
    data = request.get_json()
    user_id = data.get('user_id')
    
    # Get restroom and owner
    restroom = Restroom.query.get_or_404(restroom_id)
    if not restroom.owner_id:
        return jsonify({'error': 'Restroom has no owner'}), 400
    
    # Get user info for notification
    user = User.query.get(user_id) if user_id else None
    username = user.username if user else "Khách"
    
    # Create notification for owner
    notification = Notification(
        owner_id=restroom.owner_id,
        restroom_id=restroom_id,
        user_id=user_id,
        type='navigation_request',
        message=f'{username} đang xin chỉ đường đến {restroom.name}'
    )
    
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Navigation request sent to owner'}), 201

@app.route('/api/restrooms/<int:restroom_id>/arrival', methods=['POST'])
def notify_arrival(restroom_id):
    data = request.get_json()
    user_id = data.get('user_id')
    
    # Get restroom and owner
    restroom = Restroom.query.get_or_404(restroom_id)
    if not restroom.owner_id:
        return jsonify({'error': 'Restroom has no owner'}), 400
    
    # Get user info for notification
    user = User.query.get(user_id) if user_id else None
    username = user.username if user else "Khách"
    
    # Create notification for owner
    notification = Notification(
        owner_id=restroom.owner_id,
        restroom_id=restroom_id,
        user_id=user_id,
        type='arrival',
        message=f'{username} đã đến {restroom.name}'
    )
    
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Arrival notification sent to owner'}), 201

@app.route('/api/restrooms/<int:restroom_id>/notify-owner', methods=['POST'])
def notify_owner(restroom_id):
    data = request.get_json()
    user_id = data.get('user_id')
    notification_type = data.get('type')
    message = data.get('message')
    
    # Get restroom and owner
    restroom = Restroom.query.get_or_404(restroom_id)
    if not restroom.owner_id:
        return jsonify({'error': 'Restroom has no owner'}), 400
    
    # Get user info for notification
    user = User.query.get(user_id) if user_id else None
    username = user.username if user else "Khách"
    
    # Create notification for owner
    notification = Notification(
        owner_id=restroom.owner_id,
        restroom_id=restroom_id,
        user_id=user_id,
        type=notification_type,
        message=f'{username}: {message}'
    )
    
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Notification sent to owner'}), 201

@app.route('/api/chat/messages/<int:restroom_id>', methods=['GET'])
def get_messages(restroom_id):
    messages = ChatMessage.query.filter_by(restroom_id=restroom_id).order_by(ChatMessage.created_at.asc()).all()
    
    return jsonify([{
        'id': msg.id,
        'user_id': msg.user_id,
        'message': msg.message,
        'message_type': msg.message_type,
        'is_from_admin': msg.is_from_admin,
        'created_at': msg.created_at.isoformat()
    } for msg in messages])

# Authentication APIs
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')  # Default to user if not specified
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    existing_owner = Owner.query.filter_by(email=username).first()
    
    if existing_user or existing_owner:
        return jsonify({'error': 'Username already exists'}), 409
    
    if role == 'owner':
        # For owner, we'll create a basic Owner record 
        # They'll complete it later in OwnerRegistration
        new_owner = Owner(
            name=username,  # Temporary, will be updated later
            email=username,
            phone='',  # Will be updated later
        )
        db.session.add(new_owner)
        db.session.commit()
        
        return jsonify({
            'id': new_owner.id,
            'username': new_owner.email,
            'role': 'owner',
            'email': new_owner.email
        }), 201
    else:
        # Create regular user
        new_user = User(username=username, password=password, is_random_user=False)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'id': new_user.id,
            'username': new_user.username,
            'role': 'user',
            'is_random_user': new_user.is_random_user
        }), 201

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Check if it's a regular user
    user = User.query.filter_by(username=username, password=password, is_random_user=False).first()
    if user:
        return jsonify({
            'id': user.id,
            'username': user.username,
            'role': 'user',
            'is_random_user': user.is_random_user
        })
    
    # Check if it's an owner (using email as username)
    owner = Owner.query.filter_by(email=username).first()
    if owner:
        # For simplicity, we'll just check if username matches email
        # In real app, you'd want proper password hashing
        return jsonify({
            'id': owner.id,
            'username': owner.email,
            'name': owner.name,
            'role': 'owner',
            'email': owner.email,
            'phone': owner.phone
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/check-username/<username>', methods=['GET'])
def check_username(username):
    existing_user = User.query.filter_by(username=username).first()
    return jsonify({'exists': existing_user is not None})

# User history APIs
@app.route('/api/users/<int:user_id>/history', methods=['GET'])
def get_user_history(user_id):
    # Get usage history
    usage_history = db.session.query(UsageHistory, Restroom).join(
        Restroom, UsageHistory.restroom_id == Restroom.id
    ).filter(UsageHistory.user_id == user_id).order_by(
        UsageHistory.created_at.desc()
    ).all()
    
    # Get user reviews
    reviews = db.session.query(Review, Restroom).join(
        Restroom, Review.restroom_id == Restroom.id
    ).filter(Review.user_id == user_id).order_by(
        Review.created_at.desc()
    ).all()
    
    history_data = []
    for usage, restroom in usage_history:
        history_data.append({
            'id': usage.id,
            'type': 'usage',
            'restroom_name': restroom.name,
            'restroom_address': restroom.address,
            'start_time': usage.start_time.isoformat(),
            'end_time': usage.end_time.isoformat() if usage.end_time else None,
            'duration_minutes': usage.duration_minutes,
            'created_at': usage.created_at.isoformat()
        })
    
    review_data = []
    for review, restroom in reviews:
        review_data.append({
            'id': review.id,
            'type': 'review',
            'restroom_name': restroom.name,
            'restroom_address': restroom.address,
            'rating': review.rating,
            'comment': review.comment,
            'image_path': review.image_path,
            'created_at': review.created_at.isoformat()
        })
    
    return jsonify({
        'usage_history': history_data,
        'reviews': review_data
    })

@app.route('/api/users/<int:user_id>/start-using/<int:restroom_id>', methods=['POST'])
def start_using_restroom(user_id, restroom_id):
    user = User.query.get_or_404(user_id)
    restroom = Restroom.query.get_or_404(restroom_id)
    
    # Check if restroom requires payment
    if not restroom.is_free:
        # Check for confirmed payment
        confirmed_payment = Payment.query.filter_by(
            user_id=user_id,
            restroom_id=restroom_id,
            status='confirmed'
        ).order_by(Payment.created_at.desc()).first()
        
        if not confirmed_payment:
            return jsonify({'error': 'Payment required', 'requires_payment': True}), 402
    
    # Update user status
    user.current_restroom_id = restroom_id
    user.is_using = True
    user.start_time = datetime.utcnow()
    
    # Update restroom current users count
    restroom.current_users += 1
    
    # Create usage history record
    usage_history = UsageHistory(
        user_id=user_id,
        restroom_id=restroom_id,
        start_time=datetime.utcnow()
    )
    
    db.session.add(usage_history)
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/users/<int:user_id>/stop-using', methods=['POST'])
def stop_using_restroom(user_id):
    user = User.query.get_or_404(user_id)
    
    if user.current_restroom_id:
        # Update restroom current users count
        restroom = Restroom.query.get(user.current_restroom_id)
        if restroom and restroom.current_users > 0:
            restroom.current_users -= 1
        
        # Update usage history
        if user.start_time:
            usage_history = UsageHistory.query.filter_by(
                user_id=user_id,
                restroom_id=user.current_restroom_id,
                end_time=None
            ).first()
            
            if usage_history:
                usage_history.end_time = datetime.utcnow()
                duration = usage_history.end_time - usage_history.start_time
                usage_history.duration_minutes = int(duration.total_seconds() / 60)
    
    # Reset user status
    user.current_restroom_id = None
    user.is_using = False
    user.start_time = None
    
    db.session.commit()
    
    return jsonify({'success': True})

# Owner API Routes
@app.route('/api/owner/register', methods=['POST'])
def register_owner():
    data = request.get_json()
    owner_data = data.get('owner')
    restrooms_data = data.get('restrooms', [])
    
    try:
        # Check if owner already exists (from auth/register)
        owner = Owner.query.filter_by(email=owner_data['email']).first()
        
        if owner:
            # Update existing owner
            owner.name = owner_data['name']
            owner.phone = owner_data['phone']
        else:
            # Create new owner
            owner = Owner(
                name=owner_data['name'],
                email=owner_data['email'],
                phone=owner_data['phone']
            )
            db.session.add(owner)
        
        db.session.flush()  # Get owner ID
        
        # Create restrooms for owner
        for i, restroom_data in enumerate(restrooms_data):
            restroom = Restroom(
                name=restroom_data['name'],
                address=restroom_data['address'],
                latitude=10.8800 + (i * 0.001),  # Dĩ An, Bình Dương area
                longitude=106.7900 + (i * 0.001),
                owner_id=owner.id,
                is_free=True,
                rating=5.0,  # Default 5 stars
                total_reviews=0,
                admin_contact=owner_data['email']
            )
            db.session.add(restroom)
        
        db.session.commit()
        return jsonify({'status': 'success', 'owner_id': owner.id})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/owner/<int:owner_id>/restrooms', methods=['GET'])
def get_owner_restrooms(owner_id):
    restrooms = Restroom.query.filter_by(owner_id=owner_id).all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'address': r.address,
        'latitude': r.latitude,
        'longitude': r.longitude,
        'is_free': r.is_free,
        'price': r.price,
        'current_users': r.current_users,
        'rating': r.rating,
        'total_reviews': r.total_reviews,
        'admin_contact': r.admin_contact,
        'image_url': r.image_url
    } for r in restrooms])

@app.route('/api/owner/<string:email>/restrooms', methods=['GET'])
def get_owner_restrooms_by_email(email):
    owner = Owner.query.filter_by(email=email).first()
    if not owner:
        return jsonify({'error': 'Owner not found'}), 404
    
    restrooms = Restroom.query.filter_by(owner_id=owner.id).all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'address': r.address,
        'latitude': r.latitude,
        'longitude': r.longitude,
        'is_free': r.is_free,
        'price': r.price,
        'current_users': r.current_users,
        'rating': r.rating,
        'total_reviews': r.total_reviews,
        'admin_contact': r.admin_contact,
        'image_url': r.image_url,
        'male_standing': r.male_standing or 0,
        'male_sitting': r.male_sitting or 0,
        'female_sitting': r.female_sitting or 0,
        'disabled_access': r.disabled_access or False,
        'images': json.loads(r.images) if r.images else [],
        'created_at': r.created_at.isoformat() if r.created_at else None
    } for r in restrooms])

@app.route('/api/owner/restrooms', methods=['POST'])
def create_restroom():
    data = request.get_json()
    
    # Find owner by email instead of using owner_id
    admin_contact = data.get('admin_contact')
    if not admin_contact:
        return jsonify({'error': 'admin_contact (email) is required'}), 400
    
    owner = Owner.query.filter_by(email=admin_contact).first()
    if not owner:
        return jsonify({'error': 'Owner not found with this email'}), 404
    
    # Handle toilet facilities
    male_toilets = data.get('maleToilets', {})
    female_toilets = data.get('femaleToilets', {})
    
    # Handle images - convert array to JSON string
    images_json = None
    if data.get('images'):
        images_json = json.dumps(data.get('images'))
    
    restroom = Restroom(
        name=data['name'],
        address=data['address'],
        latitude=data.get('latitude', 10.8800),  # Dĩ An, Bình Dương area
        longitude=data.get('longitude', 106.7900),
        owner_id=owner.id,  # Use the actual owner ID from database
        is_free=data.get('is_free', True),
        price=data.get('price', 0),
        admin_contact=admin_contact,
        male_standing=male_toilets.get('standing', 0),
        male_sitting=male_toilets.get('sitting', 0), 
        female_sitting=female_toilets.get('sitting', 0),
        disabled_access=data.get('disabledAccess', False),
        images=images_json
    )
    
    db.session.add(restroom)
    db.session.commit()
    
    return jsonify({'status': 'success', 'restroom_id': restroom.id})

@app.route('/api/owner/restrooms/<int:restroom_id>', methods=['PUT'])
def update_restroom(restroom_id):
    data = request.get_json()
    
    # Find the restroom to update
    restroom = Restroom.query.get_or_404(restroom_id)
    
    # Update fields if provided
    if 'name' in data:
        restroom.name = data['name']
    if 'address' in data:
        restroom.address = data['address']
    if 'latitude' in data:
        restroom.latitude = data['latitude']
    if 'longitude' in data:
        restroom.longitude = data['longitude']
    if 'is_free' in data:
        restroom.is_free = data['is_free']
    if 'admin_contact' in data:
        restroom.admin_contact = data['admin_contact']
    if 'disabledAccess' in data:
        restroom.disabled_access = data['disabledAccess']
    
    # Handle toilet facilities
    if 'maleToilets' in data:
        male_toilets = data['maleToilets']
        restroom.male_standing = male_toilets.get('standing', restroom.male_standing)
        restroom.male_sitting = male_toilets.get('sitting', restroom.male_sitting)
    
    if 'femaleToilets' in data:
        female_toilets = data['femaleToilets']
        restroom.female_sitting = female_toilets.get('sitting', restroom.female_sitting)
    
    # Handle images - convert array to JSON string
    if 'images' in data:
        images_json = None
        if data.get('images'):
            images_json = json.dumps(data.get('images'))
        restroom.images = images_json
    
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Restroom updated successfully'})

@app.route('/api/owner/<string:email>/notifications', methods=['GET'])
def get_owner_notifications(email):
    owner = Owner.query.filter_by(email=email).first()
    if not owner:
        return jsonify({'error': 'Owner not found'}), 404
    
    notifications = Notification.query.filter_by(owner_id=owner.id).order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([{
        'id': n.id,
        'type': n.type,
        'message': n.message,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
        'restroom': {
            'id': n.restroom.id,
            'name': n.restroom.name
        } if n.restroom else None
    } for n in notifications])

@app.route('/api/owner/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'})

# Initialize database and seed data
def init_db():
    with app.app_context():
        db.create_all()
        
        # Check if data already exists
        if Restroom.query.count() == 0 and Owner.query.count() == 0:
            # Create sample owners first
            sample_owners = [
                {
                    'name': 'Công ty Highland Coffee Việt Nam',
                    'email': 'admin@highlands.vn',
                    'phone': '0901234567'
                },
                {
                    'name': 'Tập đoàn Central Retail',
                    'email': 'admin@circlek.vn', 
                    'phone': '0902345678'
                },
                {
                    'name': 'KFC Vietnam',
                    'email': 'admin@kfc.vn',
                    'phone': '0903456789'
                },
                {
                    'name': 'The Coffee House',
                    'email': 'admin@thecoffeehouse.vn',
                    'phone': '0904567890'
                },
                {
                    'name': 'Lotte Holdings',
                    'email': 'admin@lotteria.vn',
                    'phone': '0905678901'
                }
            ]
            
            # Add owners to database
            owners = []
            for owner_data in sample_owners:
                owner = Owner(**owner_data)
                db.session.add(owner)
                owners.append(owner)
            
            db.session.commit()  # Commit to get owner IDs
            
            # Sample restroom data for Di An, Binh Duong (near current location ~10.88, 106.79)
            # Khoảng cách từ 100m - 2km
            sample_restrooms = [
                # {
                #     'name': 'Highlands Coffee - Vincom Dĩ An',
                #     'address': 'Vincom Plaza Dĩ An, Đại lộ Bình Dương, Dĩ An, Bình Dương',
                #     'latitude': 10.8815,  # ~400m từ vị trí hiện tại
                #     'longitude': 106.7920,
                #     'is_free': True,
                #     'price': 0,
                #     'rating': 5.0,
                #     'total_reviews': 15,
                #     'admin_contact': 'admin@highlands.vn',
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fproduitsneptune.com%2Ftoilets&psig=AOvVaw3zSC4t7cEkumEmR6XAKuK3&ust=1758949452939000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCPiJpbzT9Y8DFQAAAAAdAAAAABAE',
                #     'owner_id': owners[0].id
                # },
                # {
                #     'name': 'Circle K - Đại học Quốc gia',
                #     'address': 'Khu phố 6, Linh Trung, Thủ Đức',
                #     'latitude': 10.8790,  # ~800m từ vị trí hiện tại
                #     'longitude': 106.7940,
                #     'is_free': True,
                #     'price': 0,
                #     'rating': 5.0,
                #     'total_reviews': 23,
                #     'admin_contact': 'admin@circlek.vn',
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.bhg.com%2Fbest-toilets-6824634&psig=AOvVaw2wqeEZjtTe4NiG58TCY3FE&ust=1758949515098000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCID0hdvT9Y8DFQAAAAAdAAAAABAE',
                #     'owner_id': owners[1].id
                # },
                # {
                #     'name': 'KFC - Aeon Mall Bình Dương',
                #     'address': 'Aeon Mall Bình Dương, số 1 Đại lộ Bình Dương, Dĩ An',
                #     'latitude': 10.8750,  # ~1.5km từ vị trí hiện tại
                #     'longitude': 106.7850,
                #     'is_free': False,
                #     'price': 2000,
                #     'rating': 5.0,
                #     'total_reviews': 8,
                #     'admin_contact': 'admin@kfc.vn',
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fhorow.com%2Fproducts%2Fhorow-12-inch-modern-floor-mounted-toilet-luxury-toilet-design-model-t0337w-g%3Fsrsltid%3DAfmBOoraABORID1BH2fcPy9AdrhEyqQoOR7Xj1o7-f6WLHggvbzWuBUx&psig=AOvVaw2wqeEZjtTe4NiG58TCY3FE&ust=1758949515098000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCID0hdvT9Y8DFQAAAAAdAAAAABAL',
                #     'owner_id': owners[2].id
                # },
                # {
                #     'name': 'The Coffee House - Đại học Bách Khoa',
                #     'address': 'Khu phố Tân Lập, Dĩ An, Bình Dương',
                #     'latitude': 10.8820,  # ~300m từ vị trí hiện tại
                #     'longitude': 106.7880,
                #     'is_free': True,
                #     'price': 0,
                #     'rating': 5.0,
                #     'total_reviews': 31,
                #     'admin_contact': 'admin@thecoffeehouse.vn',
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fmatcha-jp.com%2Fen%2F1256&psig=AOvVaw2wqeEZjtTe4NiG58TCY3FE&ust=1758949515098000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCID0hdvT9Y8DFQAAAAAdAAAAABAW',
                #     'owner_id': owners[3].id
                # },
                # {
                #     'name': 'Lotteria - Dĩ An',
                #     'address': 'QL1A, Dĩ An, Bình Dương',
                #     'latitude': 10.8850,  # ~1km từ vị trí hiện tại
                #     'longitude': 106.7960,
                #     'is_free': True,
                #     'price': 0,
                #     'rating': 5.0,
                #     'total_reviews': 12,
                #     'admin_contact': 'admin@lotteria.vn',
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fanaba-japan.net%2Fen%2Fmanners%2Fmanner_f_toilet-en%2F&psig=AOvVaw2wqeEZjtTe4NiG58TCY3FE&ust=1758949515098000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCID0hdvT9Y8DFQAAAAAdAAAAABAd',
                #     'owner_id': owners[4].id
                # },
                # {
                #     'name': 'Phúc Long Coffee - Dĩ An',
                #     'address': 'Đường Nguyễn Tri Phương, Dĩ An, Bình Dương', 
                #     'latitude': 10.8805,  # ~200m từ vị trí hiện tại
                #     'longitude': 106.7900,
                #     'is_free': False,
                #     'price': 3000,
                #     'rating': 5.0,
                #     'total_reviews': 19,
                #     'admin_contact': 'admin@highlands.vn',  # Reuse owner
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fhalalmedia.jp%2Farchives%2F18823%2Fpublic-toilet-japan%2F2%2F&psig=AOvVaw2wqeEZjtTe4NiG58TCY3FE&ust=1758949515098000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCID0hdvT9Y8DFQAAAAAdAAAAABAn',
                #     'owner_id': owners[0].id
                # },
                # {
                #     'name': 'Ministop - Tân Lập',
                #     'address': 'Khu phố Tân Lập, Dĩ An, Bình Dương',
                #     'latitude': 10.8770,  # ~1.2km từ vị trí hiện tại  
                #     'longitude': 106.7860,
                #     'is_free': True,
                #     'price': 0,
                #     'rating': 5.0,
                #     'total_reviews': 7,
                #     'admin_contact': 'admin@circlek.vn',  # Reuse owner
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.domusweb.it%2Fen%2Fspeciali%2Fdesign-essentials%2Fgallery%2F2021%2Fthe-essentials-20-of-the-best-toilets.html&psig=AOvVaw2wqeEZjtTe4NiG58TCY3FE&ust=1758949515098000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCID0hdvT9Y8DFQAAAAAdAAAAABA7',
                #     'owner_id': owners[1].id
                # },
                # {
                #     'name': 'Trung tâm thương mại Dĩ An',
                #     'address': 'Đường Đại lộ Bình Dương, Dĩ An, Bình Dương',
                #     'latitude': 10.8840,  # ~600m từ vị trí hiện tại
                #     'longitude': 106.7890,
                #     'is_free': False,
                #     'price': 5000,
                #     'admin_contact': 'admin@kfc.vn',  # Reuse owner
                #     'image_url': 'https://www.google.com/url?sa=i&url=https%3A%2F%2Ftheconversation.com%2Fwhat-goes-into-the-toilet-doesnt-always-stay-there-and-other-coronavirus-risks-in-public-bathrooms-139637&psig=AOvVaw3tttQVruktUuMyFlQMtOCy&ust=1758949665942000&source=images&cd=vfe&opi=89978449&ved=0CBYQjRxqFwoTCKjSo6LU9Y8DFQAAAAAdAAAAABAE',
                #     'owner_id': owners[2].id
                # }
            ]
            
            for restroom_data in sample_restrooms:
                restroom = Restroom(**restroom_data)
                db.session.add(restroom)
            
            db.session.commit()
            print("Database initialized with sample data!")

def reset_db():
    """Reset database with new sample data"""
    with app.app_context():
        # Drop all tables
        db.drop_all()
        # Recreate all tables  
        db.create_all()
        print("Database tables recreated!")
        
        # Call init_db to populate with new data
        init_db()

# Payment APIs
@app.route('/api/payments', methods=['POST'])
def create_payment():
    data = request.json
    
    # Get the restroom and owner info
    restroom = Restroom.query.get(data['restroom_id'])
    if not restroom:
        return jsonify({'error': 'Restroom not found'}), 404
    
    owner = Owner.query.get(restroom.owner_id)
    if not owner:
        return jsonify({'error': 'Owner not found'}), 404
    
    # Create payment record
    payment = Payment(
        user_id=data['user_id'],
        restroom_id=data['restroom_id'],
        owner_id=owner.id,
        method=data['method'],
        amount=data['amount'],
        transfer_image_path=data.get('transfer_image_path'),
        note=data.get('note', ''),
        status='pending' if data['method'] == 'transfer' else 'confirmed'
    )
    
    db.session.add(payment)
    
    # If transfer payment, create notification for owner
    if data['method'] == 'transfer':
        notification = Notification(
            owner_id=owner.id,
            restroom_id=data['restroom_id'],
            user_id=data['user_id'],
            type='payment_confirmation',
            message=f'Yêu cầu xác nhận thanh toán chuyển khoản {data["amount"]}₫ cho {restroom.name}',
            is_read=False
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'payment_id': payment.id,
        'status': payment.status
    })

@app.route('/api/payments/<int:payment_id>/confirm', methods=['POST'])
def confirm_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    
    data = request.json
    action = data.get('action')  # 'confirm' or 'reject'
    
    if action == 'confirm':
        payment.status = 'confirmed'
        payment.confirmed_at = datetime.utcnow()
        message = f'Thanh toán {payment.amount}₫ đã được xác nhận'
    else:
        payment.status = 'rejected'
        message = f'Thanh toán {payment.amount}₫ bị từ chối'
    
    db.session.commit()
    
    # Create notification for user
    notification = Notification(
        owner_id=payment.owner_id,
        restroom_id=payment.restroom_id,
        user_id=payment.user_id,
        type='payment_status',
        message=message,
        is_read=False
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'success': True, 'status': payment.status})

@app.route('/api/owner/<int:owner_id>/payments', methods=['GET'])
def get_owner_payments(owner_id):
    payments = db.session.query(Payment, User, Restroom).join(
        User, Payment.user_id == User.id
    ).join(
        Restroom, Payment.restroom_id == Restroom.id
    ).filter(Payment.owner_id == owner_id).order_by(
        Payment.created_at.desc()
    ).all()
    
    payments_data = []
    for payment, user, restroom in payments:
        payments_data.append({
            'id': payment.id,
            'user_name': user.username,
            'restroom_name': restroom.name,
            'method': payment.method,
            'amount': payment.amount,
            'status': payment.status,
            'transfer_image_path': payment.transfer_image_path,
            'note': payment.note,
            'created_at': payment.created_at.isoformat(),
            'confirmed_at': payment.confirmed_at.isoformat() if payment.confirmed_at else None
        })
    
    return jsonify(payments_data)

@app.route('/api/users/<int:user_id>/payments', methods=['GET'])
def get_user_payments(user_id):
    payments = db.session.query(Payment, Restroom).join(
        Restroom, Payment.restroom_id == Restroom.id
    ).filter(Payment.user_id == user_id).order_by(
        Payment.created_at.desc()
    ).all()
    
    payments_data = []
    for payment, restroom in payments:
        payments_data.append({
            'id': payment.id,
            'restroom_name': restroom.name,
            'method': payment.method,
            'amount': payment.amount,
            'status': payment.status,
            'note': payment.note,
            'created_at': payment.created_at.isoformat(),
            'confirmed_at': payment.confirmed_at.isoformat() if payment.confirmed_at else None
        })
    
    return jsonify(payments_data)

@app.route('/api/users/<int:user_id>/payment-status/<int:restroom_id>', methods=['GET'])
def check_payment_status(user_id, restroom_id):
    """Check if user has confirmed payment for a specific restroom"""
    confirmed_payment = Payment.query.filter_by(
        user_id=user_id,
        restroom_id=restroom_id,
        status='confirmed'
    ).order_by(Payment.created_at.desc()).first()
    
    if confirmed_payment:
        return jsonify({
            'payment_confirmed': True,
            'payment_id': confirmed_payment.id,
            'confirmed_at': confirmed_payment.confirmed_at.isoformat() if confirmed_payment.confirmed_at else None
        })
    else:
        # Check for pending payment
        pending_payment = Payment.query.filter_by(
            user_id=user_id,
            restroom_id=restroom_id,
            status='pending'
        ).order_by(Payment.created_at.desc()).first()
        
        return jsonify({
            'payment_confirmed': False,
            'has_pending_payment': pending_payment is not None,
            'pending_payment_id': pending_payment.id if pending_payment else None
        })



if __name__ == '__main__':
    # Reset database with new location data (100m - 2km range)
    reset_db()
    app.run(host='0.0.0.0', port=5002, debug=True)