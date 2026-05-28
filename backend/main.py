import os
import json
import re
from datetime import datetime
from io import StringIO

import requests
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

DATABASE_URL = "sqlite:///./weather.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

app = FastAPI(title="WeatherWise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    temperature = Column(Float)
    humidity = Column(Integer)
    wind_speed = Column(Float)
    description = Column(String)
    icon = Column(String)
    forecast_data = Column(Text)
    air_quality_data = Column(Text)
    recommendation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


class WeatherRequest(BaseModel):
    location: str
    start_date: str
    end_date: str


class WeatherUpdate(BaseModel):
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None


def validate_dates(start_date, end_date):
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Dates must be formatted as YYYY-MM-DD."
        )

    if start > end:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date."
        )


def is_zip_code(location):
    return re.fullmatch(r"\d{5}", location.strip()) is not None


def is_coordinates(location):
    pattern = r"^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$"
    return re.fullmatch(pattern, location.strip()) is not None


def build_params(location):
    location = location.strip()

    if is_coordinates(location):
        lat, lon = location.split(",")
        return {
            "lat": lat.strip(),
            "lon": lon.strip(),
            "appid": OPENWEATHER_API_KEY,
            "units": "imperial"
        }

    if is_zip_code(location):
        return {
            "zip": f"{location},US",
            "appid": OPENWEATHER_API_KEY,
            "units": "imperial"
        }

    return {
        "q": location,
        "appid": OPENWEATHER_API_KEY,
        "units": "imperial"
    }


def get_current_weather(location):
    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenWeather API key is missing. Check your .env file."
        )

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = build_params(location)

    response = requests.get(url, params=params)

    if response.status_code != 200:
        try:
            error_data = response.json()
        except Exception:
            error_data = {}

        message = error_data.get("message", "Weather API request failed.")

        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenWeather error: {message}"
        )

    return response.json()


def get_forecast(location):
    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenWeather API key is missing. Check your .env file."
        )

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = build_params(location)

    response = requests.get(url, params=params)

    if response.status_code != 200:
        try:
            error_data = response.json()
        except Exception:
            error_data = {}

        message = error_data.get("message", "Forecast API request failed.")

        raise HTTPException(
            status_code=response.status_code,
            detail=f"OpenWeather forecast error: {message}"
        )

    data = response.json()
    forecast = []

    for item in data["list"]:
        if "12:00:00" in item["dt_txt"]:
            forecast.append({
                "date": item["dt_txt"].split(" ")[0],
                "temperature": item["main"]["temp"],
                "description": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"]
            })

    return forecast[:5]


def get_air_quality(lat, lon):
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "us_aqi,pm2_5,pm10"
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return {
            "aqi": "Unavailable",
            "pm2_5": "Unavailable",
            "pm10": "Unavailable",
            "recommendation": "Air quality data is currently unavailable."
        }

    data = response.json().get("current", {})

    aqi = data.get("us_aqi", "Unavailable")
    pm2_5 = data.get("pm2_5", "Unavailable")
    pm10 = data.get("pm10", "Unavailable")

    if isinstance(aqi, (int, float)):
        if aqi <= 50:
            recommendation = "Air quality is good for outdoor activities."
        elif aqi <= 100:
            recommendation = "Air quality is moderate. Sensitive groups should be cautious."
        else:
            recommendation = "Air quality may be unhealthy. Limit long outdoor activity."
    else:
        recommendation = "Air quality recommendation unavailable."

    return {
        "aqi": aqi,
        "pm2_5": pm2_5,
        "pm10": pm10,
        "recommendation": recommendation
    }


def generate_recommendation(temp, description, wind_speed, humidity):
    description = description.lower()
    recommendations = []

    if temp >= 85:
        recommendations.append("Wear light clothing and stay hydrated.")

    if temp <= 50:
        recommendations.append("Bring a jacket or warm layers.")

    if "rain" in description or "storm" in description:
        recommendations.append("Bring an umbrella and consider indoor plans.")

    if wind_speed >= 20:
        recommendations.append("Wind is high, so outdoor activities may be less comfortable.")

    if humidity >= 75:
        recommendations.append("Humidity is high, so it may feel warmer than the actual temperature.")

    if not recommendations:
        recommendations.append("Weather conditions are comfortable for most activities.")

    return " ".join(recommendations)


@app.get("/")
def root():
    return {
        "message": "WeatherWise API is running."
    }


@app.post("/weather")
def create_weather(data: WeatherRequest):
    if not data.location.strip():
        raise HTTPException(
            status_code=400,
            detail="Location cannot be empty."
        )

    validate_dates(data.start_date, data.end_date)

    current = get_current_weather(data.location)
    forecast = get_forecast(data.location)

    temp = current["main"]["temp"]
    humidity = current["main"]["humidity"]
    wind_speed = current["wind"]["speed"]
    description = current["weather"][0]["description"]
    icon = current["weather"][0]["icon"]

    lat = current["coord"]["lat"]
    lon = current["coord"]["lon"]
    air_quality = get_air_quality(lat, lon)

    recommendation = generate_recommendation(
        temp,
        description,
        wind_speed,
        humidity
    )

    db = SessionLocal()

    record = WeatherRecord(
        location=current["name"],
        start_date=data.start_date,
        end_date=data.end_date,
        temperature=temp,
        humidity=humidity,
        wind_speed=wind_speed,
        description=description,
        icon=icon,
        forecast_data=json.dumps(forecast),
        air_quality_data=json.dumps(air_quality),
        recommendation=recommendation
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    db.close()

    return {
        "id": record.id,
        "location": record.location,
        "start_date": record.start_date,
        "end_date": record.end_date,
        "temperature": record.temperature,
        "humidity": record.humidity,
        "wind_speed": record.wind_speed,
        "description": record.description,
        "icon": record.icon,
        "forecast": forecast,
        "air_quality": air_quality,
        "recommendation": record.recommendation
    }


@app.get("/weather/history")
def get_history():
    db = SessionLocal()
    records = db.query(WeatherRecord).order_by(WeatherRecord.id.desc()).all()
    db.close()

    return [
        {
            "id": r.id,
            "location": r.location,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "wind_speed": r.wind_speed,
            "description": r.description,
            "icon": r.icon,
            "forecast": json.loads(r.forecast_data),
            "air_quality": json.loads(r.air_quality_data) if r.air_quality_data else None,
            "recommendation": r.recommendation,
            "created_at": str(r.created_at)
        }
        for r in records
    ]


@app.put("/weather/history/{record_id}")
def update_weather(record_id: int, update: WeatherUpdate):
    db = SessionLocal()

    record = db.query(WeatherRecord).filter(
        WeatherRecord.id == record_id
    ).first()

    if not record:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Record not found."
        )

    if update.start_date and update.end_date:
        validate_dates(update.start_date, update.end_date)

    if update.location:
        current = get_current_weather(update.location)
        forecast = get_forecast(update.location)

        temp = current["main"]["temp"]
        humidity = current["main"]["humidity"]
        wind_speed = current["wind"]["speed"]
        description = current["weather"][0]["description"]
        icon = current["weather"][0]["icon"]

        lat = current["coord"]["lat"]
        lon = current["coord"]["lon"]
        air_quality = get_air_quality(lat, lon)

        record.location = current["name"]
        record.temperature = temp
        record.humidity = humidity
        record.wind_speed = wind_speed
        record.description = description
        record.icon = icon
        record.forecast_data = json.dumps(forecast)
        record.air_quality_data = json.dumps(air_quality)
        record.recommendation = generate_recommendation(
            temp,
            description,
            wind_speed,
            humidity
        )

    if update.start_date:
        record.start_date = update.start_date

    if update.end_date:
        record.end_date = update.end_date

    db.commit()
    db.refresh(record)
    db.close()

    return {
        "message": "Record updated successfully."
    }


@app.delete("/weather/history/{record_id}")
def delete_weather(record_id: int):
    db = SessionLocal()

    record = db.query(WeatherRecord).filter(
        WeatherRecord.id == record_id
    ).first()

    if not record:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Record not found."
        )

    db.delete(record)
    db.commit()
    db.close()

    return {
        "message": "Record deleted successfully."
    }


@app.get("/weather/export/json")
def export_json():
    db = SessionLocal()
    records = db.query(WeatherRecord).all()
    db.close()

    data = [
        {
            "id": r.id,
            "location": r.location,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "wind_speed": r.wind_speed,
            "description": r.description,
            "icon": r.icon,
            "recommendation": r.recommendation,
            "created_at": str(r.created_at)
        }
        for r in records
    ]

    json_data = json.dumps(data, indent=2)

    return StreamingResponse(
        iter([json_data]),
        media_type="application/json",
        headers={
            "Content-Disposition": "attachment; filename=weather_history.json"
        }
    )


@app.get("/weather/export/csv")
def export_csv():
    db = SessionLocal()
    records = db.query(WeatherRecord).all()
    db.close()

    data = [
        {
            "id": r.id,
            "location": r.location,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "wind_speed": r.wind_speed,
            "description": r.description,
            "icon": r.icon,
            "recommendation": r.recommendation,
            "created_at": str(r.created_at)
        }
        for r in records
    ]

    df = pd.DataFrame(data)
    stream = StringIO()
    df.to_csv(stream, index=False)

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=weather_history.csv"
        }
    )