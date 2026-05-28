# WeatherWise Travel Dashboard

Built by Ramsey Qishta for the PM Accelerator AI Engineer Internship Technical Assessment.

---

# Completed Assessments

This project completes both:

- Tech Assessment #1: Frontend Weather App
- Tech Assessment #2: Backend Weather App

---

# Overview

WeatherWise Travel Dashboard is a full-stack weather intelligence app that allows users to search for real-time weather information by city, ZIP code, or GPS coordinates.

The application retrieves live weather data, displays a 5-day forecast, provides weather icons, shows Google Maps location data, adds air quality information, stores weather searches in a SQLite database, supports CRUD operations, and allows exporting data to JSON and CSV.

---

# Features

## Frontend

- Built with Next.js, TypeScript, and Tailwind CSS
- Responsive layout for desktop, tablet, and mobile
- Search by city, ZIP code, or coordinates
- Current location button using browser geolocation
- Current weather display
- 5-day forecast grid
- Weather icons
- Google Maps embed
- Air quality display
- Travel and health recommendations
- Saved weather history table
- Edit and delete saved weather records
- Export JSON and CSV buttons
- PM Accelerator information section

---

## Backend

- Built with FastAPI and Python
- RESTful API architecture
- SQLite database persistence
- SQLAlchemy ORM
- OpenWeatherMap API integration
- Open-Meteo Air Quality API integration
- Full CRUD operations
- Location validation
- Date range validation
- Error handling
- JSON export
- CSV export

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

- Python
- FastAPI
- SQLite
- SQLAlchemy
- Pandas

---

# APIs Used

- OpenWeatherMap API
- Open-Meteo Air Quality API
- Google Maps Embed

---

# Project Structure

txt weatherwise-ai-intern-assessment/ ├── backend/ │   ├── main.py │   └── requirements.txt │ ├── frontend/ │   ├── app/ │   │   ├── page.tsx │   │   ├── layout.tsx │   │   └── globals.css │   └── package.json │ └── README.md 

---

# Running the Backend

bash cd backend python3 -m venv venv source venv/bin/activate pip install -r requirements.txt uvicorn main:app --reload 

Backend runs at:

txt http://127.0.0.1:8000 

---

# Running the Frontend

bash cd frontend npm install npm run dev 

Frontend runs at:

txt http://localhost:3000 

---

# Notes

- The .env file is intentionally excluded from the repository for security purposes.
- API keys must be added locally before running the backend.
- The SQLite database is generated automatically when the backend starts.

---

# Author

Ramsey Qishta