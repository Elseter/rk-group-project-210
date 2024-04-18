from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS  # Import CORS from flask_cors

app = Flask(__name__)

# Configure MySQL connection parameters
app.config['MYSQL_HOST'] = 'mysql'  # This should match the service name defined in docker-compose.yml
app.config['MYSQL_USER'] = 'rking'
app.config['MYSQL_PASSWORD'] = 'entrance'
app.config['MYSQL_DB'] = 'users'
app.config['MYSQL_PORT'] = 3306  # Default MySQL port

# Initialize MySQL
mysql = MySQL(app)
CORS(app)

# -------------------------------------------------------
# Define the routes

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Username, email, and password are required'}), 400

    hashed_password = generate_password_hash(password)
    print(hashed_password)

    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)", (username, email, hashed_password))
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT password FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()

    if user is None:
        return jsonify({'message': 'Invalid username or password'}), 401

    hashed_password = user[0]
    if not check_password_hash(hashed_password, password):
        return jsonify({'message': 'Invalid username or password'}), 401

    return jsonify({'message': 'Login successful'}), 200


@app.route('/')
def index():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users")
    data = cur.fetchall()
    cur.close()
    return str(data)


@app.route('/add_location', methods=['POST'])
def add_location():
    data = request.json
    username = data.get('username')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not username or not latitude or not longitude:
        return jsonify({'message': 'Username, latitude, and longitude are required'}), 400

    # Retrieve user_id based on the username
    cur = mysql.connection.cursor()
    cur.execute("SELECT user_id FROM users WHERE username = %s", (username,))
    user_id = cur.fetchone()
    cur.close()

    if user_id is None:
        return jsonify({'message': 'User not found'}), 404

    # Insert the provided latitude and longitude into the saved_locations table
    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO saved_locations (user_id, latitude, longitude) VALUES (%s, %s, %s)",
                (user_id[0], latitude, longitude))
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Location added successfully'}), 201


@app.route('/get_locations', methods=['POST'])
def get_locations():
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'message': 'Username is required'}), 400

    # Retrieve user_id based on the username
    cur = mysql.connection.cursor()
    cur.execute("SELECT user_id FROM users WHERE username = %s", (username,))
    user_id = cur.fetchone()
    cur.close()

    if user_id is None:
        return jsonify({'message': 'User not found'}), 404

    # Retrieve all saved locations based on the user_id
    cur = mysql.connection.cursor()
    cur.execute("SELECT latitude, longitude FROM saved_locations WHERE user_id = %s", (user_id[0],))
    data = cur.fetchall()
    cur.close()

    return jsonify(data), 200

@app.route('/remove_location', methods=['POST'])
def remove_location():
    data = request.json
    username = data.get('username')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not username or not latitude or not longitude:
        return jsonify({'message': 'Username, latitude, and longitude are required'}), 400

    # Retrieve user_id based on the username
    cur = mysql.connection.cursor()
    cur.execute("SELECT user_id FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()

    if user is None:
        return jsonify({'message': 'User not found'}), 404

    # Check if the location exists for the user
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM saved_locations WHERE user_id = %s AND latitude = %s AND longitude = %s",
                (user[0], latitude, longitude))
    location = cur.fetchone()
    cur.close()

    if location is None:
        return jsonify({'message': 'Location not found for the user'}), 404

    # Remove the location
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM saved_locations WHERE user_id = %s AND latitude = %s AND longitude = %s",
                (user[0], latitude, longitude))
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Location removed successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')  # Listen on all network interfaces