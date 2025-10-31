# 🚉 Hyderabad Metro Tracker
A full-stack web application that allows users to plan, track, and manage their metro journeys across Hyderabad's *Red, **Blue, and **Green* lines. Built using *React.js, **FastAPI/MongoDB, and styled with **Tailwind CSS*.

## 🧭 Features
✅ *Search & Track Journeys:* Select *source* and *destination* metro stations to find route and travel details.</br>
✅ *Dynamic Metro Lines:* Covers *Red, **Blue, and **Green* lines of Hyderabad Metro.</br>
✅ *Station Data from MongoDB:* Fetches real-time metro stations from a *MongoDB* database.</br>
✅ *Journey History:* Automatically stores your past journeys for quick access.</br>
✅ *Favourites:* Mark your most used or preferred routes as favourites.</br>
✅ *Interactive UI:* Built with *React + Tailwind CSS* for a modern and responsive experience.</br>

## 🧩 Tech Stack
🖥 *Frontend*
- React.js
- Tailwind CSS
- Axios
- React Router DOM
- Radix UI Components

⚙ *Backend*
- FastAPI (Python)
- MongoDB (local)
- Pydantic, Motor, and Dotenv

## ⚙ Installation & Setup
1️⃣ Clone the repository
bash
git clone https://github.com/<your-username>/hyderabad-metro-tracker.git
cd hyderabad-metro-tracker


2️⃣ Backend Setup
bash
cd backend
pip install -r requirements.txt

# Create .env file inside backend:
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hyderabad_metro"
CORS_ORIGINS="*"

# Start MongoDB (local):
mongod --dbpath "C:\data\db"

# Run the backend:
uvicorn server:app --reload --port 8001


3️⃣ Frontend Setup
bash
cd ../frontend
yarn install
yarn start


🗂 Folder Structure
bash
hyderabad-metro-tracker/
│
├── backend/
│   ├── server.py
│   ├── models/
│   ├── routes/
│   ├── .env
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── App.js
    │   └── index.js
    ├── tailwind.config.js
    └── package.json


🧠 How It Works
- The frontend provides a search and dropdown for source & destination stations.
- The backend fetches station data from *MongoDB*.
- On selecting stations, the route is completed and displayed.
- The user can save routes as favourites or view journey history.

## 📸 Demo Screenshots
