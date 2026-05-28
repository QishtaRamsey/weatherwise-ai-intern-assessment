"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type ForecastDay = {
  date: string;
  temperature: number;
  description: string;
  icon: string;
};

type AirQuality = {
  aqi: number | string;
  pm2_5: number | string;
  pm10: number | string;
  recommendation: string;
};

type WeatherData = {
  id: number;
  location: string;
  start_date: string;
  end_date: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  forecast: ForecastDay[];
  air_quality: AirQuality;
  recommendation: string;
};

type HistoryRecord = {
  id: number;
  location: string;
  start_date: string;
  end_date: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  forecast: ForecastDay[];
  air_quality: AirQuality | null;
  recommendation: string;
  created_at: string;
};

export default function Home() {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const response = await fetch(`${API_BASE}/weather/history`);
      const data = await response.json();
      setHistory(data);
    } catch {
      setError("Could not load weather history from the backend.");
    }
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setWeather(null);

    if (!location.trim()) {
      setError("Please enter a city, ZIP code, landmark, or coordinates.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both a start date and an end date.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/weather`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          location,
          start_date: startDate,
          end_date: endDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Weather request failed.");
      }

      setWeather(data);
      fetchHistory();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while requesting weather data.");
      }
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        setLocation(coords);
      },
      () => {
        setError("Unable to access your current location. Please allow browser location access or search manually.");
      }
    );
  }

  function startEdit(record: HistoryRecord) {
    setEditId(record.id);
    setEditLocation(record.location);
    setEditStartDate(record.start_date);
    setEditEndDate(record.end_date);
  }

  async function handleUpdate(id: number) {
    setError("");

    if (!editLocation.trim()) {
      setError("Updated location cannot be empty.");
      return;
    }

    if (!editStartDate || !editEndDate) {
      setError("Updated record needs both start and end dates.");
      return;
    }

    if (new Date(editStartDate) > new Date(editEndDate)) {
      setError("Updated start date cannot be after updated end date.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/weather/history/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          location: editLocation,
          start_date: editStartDate,
          end_date: editEndDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Update failed.");
      }

      setEditId(null);
      fetchHistory();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not update record.");
      }
    }
  }

  async function handleDelete(id: number) {
    setError("");

    try {
      const response = await fetch(`${API_BASE}/weather/history/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Delete failed.");
      }

      fetchHistory();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not delete record.");
      }
    }
  }

  function downloadJson() {
    window.open(`${API_BASE}/weather/export/json`, "_blank");
  }

  function downloadCsv() {
    window.open(`${API_BASE}/weather/export/csv`, "_blank");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 text-white shadow-2xl md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200">
                Full-Stack AI Engineer Internship Assessment
              </p>

              <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
                WeatherWise Travel Dashboard
              </h1>

              <p className="mt-5 text-lg leading-8 text-slate-300">
                A full-stack weather intelligence app that retrieves real-time weather,
                validates user input, stores search history, supports CRUD operations,
                exports data, and helps users make smarter travel decisions.
              </p>

              <p className="mt-5 text-sm text-slate-400">
                Built by <span className="font-semibold text-white">Ramsey Qishta</span> for the PM Accelerator AI Engineer Internship Technical Assessment.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:w-[420px]">
              <FeatureCard title="Frontend" text="Responsive Next.js interface with forecast cards, map embed, weather icons, error states, and history controls." />
              <FeatureCard title="Backend" text="FastAPI REST API with SQLite persistence, validation, CRUD routes, and export endpoints." />
              <FeatureCard title="APIs" text="OpenWeather, Google Maps embed, and Open-Meteo Air Quality integration." />
              <FeatureCard title="User Value" text="Travel and health recommendations based on weather and air quality conditions." />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl bg-white p-6 shadow-xl lg:col-span-1">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Search Weather</h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter a city, U.S. ZIP code, landmark, or coordinates. The backend validates the request and stores successful results.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Location</label>
                <input
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Example: Houston, 77070, or 29.76,-95.36"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                className="w-full rounded-xl bg-slate-900 p-3 font-semibold text-white hover:bg-slate-800"
              >
                Use My Current Location
              </button>

              <div>
                <label className="mb-1 block text-sm font-semibold">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? "Retrieving Weather..." : "Get Weather"}
              </button>
            </form>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl lg:col-span-2">
            <div>
              <h2 className="text-2xl font-bold">Current Weather</h2>
              <p className="mt-2 text-sm text-slate-500">
                Real-time weather data, map context, air quality, and user-centered travel intelligence.
              </p>
            </div>

            {!weather && (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-lg font-semibold text-slate-700">No weather search yet</p>
                <p className="mt-2 text-slate-500">
                  Search a location to display live weather, forecast, map data, air quality, and recommendations.
                </p>
              </div>
            )}

            {weather && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <WeatherStat label="Location" value={weather.location} />
                  <WeatherStat label="Temperature" value={`${weather.temperature}°F`} />
                  <WeatherStat label="Humidity" value={`${weather.humidity}%`} />
                  <WeatherStat label="Wind" value={`${weather.wind_speed} mph`} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-sm font-semibold text-blue-700">Condition</p>
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.description}
                        className="h-16 w-16"
                      />
                      <p className="text-xl font-bold capitalize">{weather.description}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="text-sm font-semibold text-green-700">Travel Recommendation</p>
                    <p className="mt-2 text-slate-700">{weather.recommendation}</p>
                  </div>

                  <div className="rounded-2xl bg-purple-50 p-5">
                    <p className="text-sm font-semibold text-purple-700">Health & Air Quality</p>
                    <p className="mt-2 text-slate-700">AQI: {weather.air_quality.aqi}</p>
                    <p className="text-slate-700">PM2.5: {weather.air_quality.pm2_5}</p>
                    <p className="text-slate-700">PM10: {weather.air_quality.pm10}</p>
                    <p className="mt-2 font-medium text-slate-800">
                      {weather.air_quality.recommendation}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-bold">5-Day Forecast</h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {weather.forecast.map((day, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-500">{day.date}</p>

                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                          alt={day.description}
                          className="h-14 w-14"
                        />

                        <p className="text-2xl font-extrabold">{day.temperature}°F</p>

                        <p className="mt-1 capitalize text-sm text-slate-600">
                          {day.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-bold">Location Map</h3>
                  <iframe
                    title="Location Map"
                    className="h-72 w-full rounded-2xl border border-slate-200"
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(weather.location)}&output=embed`}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Saved Weather History</h2>
              <p className="mt-2 text-sm text-slate-500">
                Demonstrates database persistence, read operations, update operations, delete operations, and export functionality.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadJson}
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Export JSON
              </button>

              <button
                onClick={downloadCsv}
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Date Range</th>
                  <th className="p-4">Temperature</th>
                  <th className="p-4">Condition</th>
                  <th className="p-4">Recommendation</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td className="p-5 text-slate-500" colSpan={7}>
                      No saved weather records yet.
                    </td>
                  </tr>
                )}

                {history.map((record) => (
                  <tr key={record.id} className="border-t border-slate-200">
                    <td className="p-4 font-semibold">{record.id}</td>

                    <td className="p-4">
                      {editId === record.id ? (
                        <input
                          className="w-full rounded-lg border border-slate-300 p-2"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                        />
                      ) : (
                        record.location
                      )}
                    </td>

                    <td className="p-4">
                      {editId === record.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="date"
                            className="rounded-lg border border-slate-300 p-2"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                          />
                          <input
                            type="date"
                            className="rounded-lg border border-slate-300 p-2"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                          />
                        </div>
                      ) : (
                        `${record.start_date} to ${record.end_date}`
                      )}
                    </td>

                    <td className="p-4">{record.temperature}°F</td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {record.icon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${record.icon}.png`}
                            alt={record.description}
                            className="h-8 w-8"
                          />
                        )}
                        <span className="capitalize">{record.description}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">{record.recommendation}</td>

                    <td className="p-4">
                      {editId === record.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(record.id)}
                            className="rounded-lg bg-green-600 px-3 py-2 text-white"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditId(null)}
                            className="rounded-lg bg-slate-400 px-3 py-2 text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(record)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(record.id)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-white"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-xl lg:col-span-2">
            <h2 className="text-2xl font-bold">About PM Accelerator</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Product Manager Accelerator is a professional training and career development community that helps students and professionals build real-world product, AI, and technology experience through hands-on projects, mentorship, and career-focused programs.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-800 bg-blue-950 p-6 text-white shadow-xl">
            <h2 className="text-2xl font-bold">Assessment Coverage</h2>

            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              <li>✓ Tech Assessment #1 Frontend</li>
              <li>✓ Tech Assessment #2 Backend</li>
              <li>✓ Weather API retrieval</li>
              <li>✓ CRUD database operations</li>
              <li>✓ JSON and CSV export</li>
              <li>✓ Google Maps integration</li>
              <li>✓ Air Quality API integration</li>
              <li>✓ Responsive design</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  text
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="font-bold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function WeatherStat({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}