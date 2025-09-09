
// === Small helpers ===
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

document.addEventListener("DOMContentLoaded", () => {
  // === Theme toggle ===
  const toggleBtn = $("#darkModeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      toggleBtn.textContent =
        document.body.classList.contains("dark-mode")
          ? "☀️ Light Mode"
          : "🌙 Dark Mode";
      localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "1" : "0");
    });
    // Restore theme
    if (localStorage.getItem("darkMode") === "1") {
      document.body.classList.add("dark-mode");
      toggleBtn.textContent = "☀️ Light Mode";
    }
  }

  // === Typewriter ===
  const taglineElement = $("#tagline");
  if (taglineElement) {
    const text = "Welcome to our world of code!";
    let index = 0;
    (function typeEffect() {
      if (index < text.length) {
        taglineElement.textContent += text.charAt(index);
        index++;
        setTimeout(typeEffect, 80);
      }
    })();
  }

  // === Fade-in on scroll ===
  const faders = $all(".fade-in");
  if (faders.length) {
    const appearOptions = { threshold: 0.2 };
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      });
    }, appearOptions);
    faders.forEach(fader => appearOnScroll.observe(fader));
  }

  // === Weather integration (Open-Meteo) ===
  const cityInput = $("#cityInput");
  const weatherForm = $("#weatherForm");
  const locateBtn = $("#locateBtn");
  const weatherStatus = $("#weatherStatus");
  const weatherResult = $("#weatherResult");

  const placeNameEl = $("#placeName");
  const updatedTimeEl = $("#updatedTime");
  const emojiEl = $("#weatherEmoji");
  const tempNowEl = $("#tempNow");
  const descNowEl = $("#descNow");
  const feelsLikeEl = $("#feelsLike");
  const windNowEl = $("#windNow");
  const minmaxTodayEl = $("#minmaxToday");
  const precipNextHourEl = $("#precipNextHour");

  if (!weatherForm) return; // no weather section on this page

  const WCODE = {
    0: ["Clear sky","☀️"], 1: ["Mainly clear","🌤️"], 2: ["Partly cloudy","⛅"], 3: ["Overcast","☁️"],
    45: ["Fog","🌫️"], 48: ["Depositing rime fog","🌫️"],
    51: ["Light drizzle","🌦️"], 53: ["Drizzle","🌦️"], 55: ["Heavy drizzle","🌧️"],
    56: ["Light freezing drizzle","🌧️"], 57: ["Freezing drizzle","🌧️"],
    61: ["Light rain","🌧️"], 63: ["Rain","🌧️"], 65: ["Heavy rain","🌧️"],
    66: ["Light freezing rain","🌧️"], 67: ["Freezing rain","🌧️"],
    71: ["Light snow","🌨️"], 73: ["Snow","🌨️"], 75: ["Heavy snow","🌨️"],
    77: ["Snow grains","🌨️"],
    80: ["Rain showers","🌦️"], 81: ["Heavy rain showers","🌦️"], 82: ["Violent rain showers","🌧️"],
    85: ["Snow showers","🌨️"], 86: ["Heavy snow showers","🌨️"],
    95: ["Thunderstorm","⛈️"], 96: ["Thunderstorm with hail","⛈️"], 99: ["Thunderstorm with heavy hail","⛈️"]
  };

  function setStatus(msg, isError=false) {
    if (!weatherStatus) return;
    weatherStatus.textContent = msg;
    weatherStatus.classList.toggle("error", isError);
  }

  function showResult(show) {
    if (!weatherResult) return;
    weatherResult.hidden = !show;
  }

  async function geocodeCity(name) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
    if (!res.ok) throw new Error("Failed to search city");
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error("City not found");
    const r = data.results[0];
    return { lat: r.latitude, lon: r.longitude, label: `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}` };
  }

  async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=precipitation&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load weather");
    return res.json();
  }

  function renderWeather(data, label) {
    const tz = data.timezone;
    const now = new Date(data.current.time);
    const wcode = data.current.weather_code;
    const wh = WCODE[wcode] || ["N/A","❔"];
    const desc = wh[0];
    const emoji = wh[1];

    // Next hour precip (for current hour index)
    let precip = "—";
    if (data.hourly && data.hourly.time && data.hourly.precipitation) {
      const nowISO = data.current.time;
      const idx = data.hourly.time.indexOf(nowISO);
      if (idx !== -1 && idx < data.hourly.precipitation.length) {
        precip = data.hourly.precipitation[idx] + " mm";
      }
    }

    if (placeNameEl) placeNameEl.textContent = label;
    if (updatedTimeEl) updatedTimeEl.textContent = `Updated: ${now.toLocaleString([], { hour: '2-digit', minute: '2-digit' })} (${tz})`;
    if (emojiEl) emojiEl.textContent = emoji;
    if (tempNowEl) tempNowEl.textContent = Math.round(data.current.temperature_2m) + "°C";
    if (descNowEl) descNowEl.textContent = desc;
    if (feelsLikeEl) feelsLikeEl.textContent = Math.round(data.current.apparent_temperature) + "°C";
    if (windNowEl) windNowEl.textContent = Math.round(data.current.wind_speed_10m) + " m/s";
    if (minmaxTodayEl) minmaxTodayEl.textContent = `${Math.round(data.daily.temperature_2m_min[0])}° / ${Math.round(data.daily.temperature_2m_max[0])}°C`;
    if (precipNextHourEl) precipNextHourEl.textContent = precip;

    setStatus("");
    showResult(true);
  }

  async function loadByCity(name) {
    try {
      setStatus("Loading weather…");
      showResult(false);
      const { lat, lon, label } = await geocodeCity(name);
      const data = await fetchWeather(lat, lon);
      renderWeather(data, label);
      localStorage.setItem("lastCity", name);
    } catch (err) {
      setStatus(err.message || "Something went wrong", true);
      showResult(false);
    }
  }

  async function loadByGeolocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported in this browser.", true);
      return;
    }
    setStatus("Getting your location…");
    showResult(false);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const data = await fetchWeather(lat, lon);
        // Reverse lookup for display name
        let label = "Your location";
        try {
          const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
          if (r.ok) {
            const j = await r.json();
            if (j.results && j.results.length) {
              const g = j.results[0];
              label = `${g.name || "Your location"}${g.admin1 ? ", " + g.admin1 : ""}${g.country ? ", " + g.country : ""}`;
            }
          }
        } catch {}
        renderWeather(data, label);
        localStorage.removeItem("lastCity");
      } catch (e) {
        setStatus("Couldn't load weather for your location.", true);
      }
    }, (err) => {
      setStatus("Location permission denied or unavailable.", true);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  weatherForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = cityInput.value.trim();
    if (!name) return;
    loadByCity(name);
  });
  if (locateBtn) locateBtn.addEventListener("click", loadByGeolocation);

  // Auto-load: last city if saved, else try Stockholm as a sensible default
  const lastCity = localStorage.getItem("lastCity");
  if (cityInput) {
    if (lastCity) {
      cityInput.value = lastCity;
      loadByCity(lastCity);
    } else {
      cityInput.value = "Stockholm";
      loadByCity("Stockholm");
    }
  }
});
