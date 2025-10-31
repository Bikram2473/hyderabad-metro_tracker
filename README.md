# 🚉 Hyderabad Metro Tracker
_A full-stack web application that allows users to plan, track, and manage their metro journeys across Hyderabad's _**Red**_, _**Blue**_, and **_Green_** lines. Built using **_React.js_**, **_FastAPI/MongoDB_**, and styled with **_Tailwind CSS_**._

## 🧭 Features
✅ _**Search & Track Journeys:**_ _Select _**source**_ and _**destination**_ metro stations to find route and travel details.</br>_
✅ _**Dynamic Metro Lines:**_ _Covers **_Red_**, **_Blue_**, and **_Green_** lines of Hyderabad Metro.</br>_
✅ _**Station Data from MongoDB:**_ _Fetches real-time metro stations from a **_MongoDB_** database.</br>_
✅ **_Journey History:_** _Automatically stores your past journeys for quick access.</br>_
✅ _**Favourites:**_ _Mark your most used or preferred routes as favourites.</br>_
✅ _**Interactive UI:**_ _Built with _**React + Tailwind CSS**_ for a modern and responsive experience.</br>_

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
```bash
git clone https://github.com/<your-username>/hyderabad-metro-tracker.git
cd hyderabad-metro-tracker
```

2️⃣ Backend Setup
```bash
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
```

3️⃣ Frontend Setup
```bash
cd ../frontend
yarn install
yarn start
```

🗂 Folder Structure
```bash
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
```

🧠 How It Works
- The frontend provides a search and dropdown for source & destination stations.
- The backend fetches station data from *MongoDB*.
- On selecting stations, the route is completed and displayed.
- The user can save routes as favourites or view journey history.

## 📸 Demo Screenshots
![**_image_alt_**](https://github.com/Bikram2473/hyderabad-metro_tracker/blob/main/HomeScreen.png)</br>
![**_image_alt_**](https://github.com/Bikram2473/hyderabad-metro_tracker/blob/main/FavouritesPage.png)</br>
![**_image_alt_**](https://github.com/Bikram2473/hyderabad-metro_tracker/blob/main/JourneyAnimation.png)</br>
![**_image_alt_**](https://github.com/Bikram2473/hyderabad-metro_tracker/blob/main/JourneyScreen2.png)</br>
![**_image_alt_**](https://github.com/Bikram2473/hyderabad-metro_tracker/blob/main/JourneyScreen3.png)</br>
![**_image_alt_**](https://github.com/Bikram2473/hyderabad-metro_tracker/blob/main/HistoryPage.png)</br>
