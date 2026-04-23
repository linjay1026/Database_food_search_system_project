from flask import Flask
from routes.auth import auth_bp
from routes.restaurant import restaurant_bp
from routes.review import review_bp
from routes.favorite import favorite_bp
from routes.image import image_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(restaurant_bp)
app.register_blueprint(review_bp)
app.register_blueprint(favorite_bp)
app.register_blueprint(image_bp)

@app.route("/")
def hello():
    return {"message": "✅ API is running."}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)