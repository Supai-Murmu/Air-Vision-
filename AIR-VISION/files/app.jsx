const { useState, useEffect, useRef, useCallback } = React;

const API_KEY = '17fc50ec56e00bdd1293eefb803542a0';
const OWM = 'https://api.openweathermap.org/data/2.5';



function aqiInfo(v) {
  const tiers = [
    { max:50, label:'Good', color:'#22c55e', bg:'rgba(34,197,94,.12)',
      advice:'Air quality is satisfactory. Great for outdoor activities.',
      advisory:[
        {icon:'🚶',title:'Outdoor Activity',text:'Perfect for walks, runs and all outdoor sports.',c:'rgba(34,197,94,.1)',b:'rgba(34,197,94,.3)',tc:'#166534'},
        {icon:'😷',title:'Masks',text:'No mask needed for healthy individuals.',c:'rgba(34,197,94,.1)',b:'rgba(34,197,94,.3)',tc:'#166534'},
        {icon:'🏠',title:'Indoors',text:'Windows can stay open for fresh air circulation.',c:'rgba(34,197,94,.1)',b:'rgba(34,197,94,.3)',tc:'#166534'},
      ]},
    { max:100, label:'Moderate', color:'#eab308', bg:'rgba(234,179,8,.12)',
      advice:'Acceptable air quality. Sensitive individuals should limit prolonged outdoor exposure.',
      advisory:[
        {icon:'🚶',title:'Outdoor Activity',text:'Fine for most. Sensitive groups should limit long sessions.',c:'rgba(234,179,8,.1)',b:'rgba(234,179,8,.3)',tc:'#854d0e'},
        {icon:'😷',title:'Masks',text:'Sensitive groups (asthma, elderly) may consider N95.',c:'rgba(234,179,8,.1)',b:'rgba(234,179,8,.3)',tc:'#854d0e'},
        {icon:'🏠',title:'Indoors',text:'Run air filters if available. Ventilate during clean hours.',c:'rgba(234,179,8,.1)',b:'rgba(234,179,8,.3)',tc:'#854d0e'},
      ]},
    { max:150, label:'Unhealthy (Sensitive)', color:'#f97316', bg:'rgba(249,115,22,.12)',
      advice:'Sensitive groups may experience effects. Limit prolonged outdoor activity.',
      advisory:[
        {icon:'🚶',title:'Outdoor Activity',text:'Sensitive groups should reduce outdoor exposure.',c:'rgba(249,115,22,.1)',b:'rgba(249,115,22,.3)',tc:'#9a3412'},
        {icon:'😷',title:'Masks',text:'Wear N95 if you have respiratory conditions.',c:'rgba(249,115,22,.1)',b:'rgba(249,115,22,.3)',tc:'#9a3412'},
        {icon:'🏠',title:'Indoors',text:'Keep windows closed. Run air purifiers.',c:'rgba(249,115,22,.1)',b:'rgba(249,115,22,.3)',tc:'#9a3412'},
      ]},
    { max:200, label:'Unhealthy', color:'#ef4444', bg:'rgba(239,68,68,.12)',
      advice:'Everyone may experience health effects. Sensitive groups may experience serious effects.',
      advisory:[
        {icon:'🚶',title:'Outdoor Activity',text:'Avoid outdoor activities, especially for children.',c:'rgba(239,68,68,.1)',b:'rgba(239,68,68,.3)',tc:'#991b1b'},
        {icon:'😷',title:'Masks',text:'Everyone outdoors should wear an N95 mask.',c:'rgba(239,68,68,.1)',b:'rgba(239,68,68,.3)',tc:'#991b1b'},
        {icon:'🏠',title:'Indoors',text:'Seal gaps. Use air purifiers. Avoid gas cooking.',c:'rgba(239,68,68,.1)',b:'rgba(239,68,68,.3)',tc:'#991b1b'},
      ]},
    { max:300, label:'Very Unhealthy', color:'#a855f7', bg:'rgba(168,85,247,.12)',
      advice:'Health alert: Everyone may experience serious effects.',
      advisory:[
        {icon:'🚶',title:'Outdoor Activity',text:'Avoid all outdoor exposure entirely.',c:'rgba(168,85,247,.1)',b:'rgba(168,85,247,.3)',tc:'#6b21a8'},
        {icon:'😷',title:'Masks',text:'N95 mandatory for any outdoor exposure.',c:'rgba(168,85,247,.1)',b:'rgba(168,85,247,.3)',tc:'#6b21a8'},
        {icon:'🏠',title:'Indoors',text:'Shelter indoors. Contact authorities if distress.',c:'rgba(168,85,247,.1)',b:'rgba(168,85,247,.3)',tc:'#6b21a8'},
      ]},
    { max:Infinity, label:'Hazardous', color:'#991b1b', bg:'rgba(153,27,27,.12)',
      advice:'Health emergency. Do NOT go outdoors.',
      advisory:[
        {icon:'🚶',title:'Outdoor Activity',text:'Do NOT go outside. Health emergency conditions.',c:'rgba(153,27,27,.1)',b:'rgba(153,27,27,.4)',tc:'#450a0a'},
        {icon:'😷',title:'Masks',text:'Full respirator needed if outside is unavoidable.',c:'rgba(153,27,27,.1)',b:'rgba(153,27,27,.4)',tc:'#450a0a'},
        {icon:'🏠',title:'Indoors',text:'Shelter in place. Seal openings. Evacuate if directed.',c:'rgba(153,27,27,.1)',b:'rgba(153,27,27,.4)',tc:'#450a0a'},
      ]},
  ];
  return tiers.find(x => v <= x.max);
}

function owmAqiToVal(idx, comp) {
  const pm25 = (comp && comp.pm2_5) || 0;
  if (pm25 <= 12) return Math.round((50/12)*pm25);
  if (pm25 <= 35.4) return Math.round(50 + (50/23.4)*(pm25-12));
  if (pm25 <= 55.4) return Math.round(100 + (50/20)*(pm25-35.4));
  if (pm25 <= 150.4) return Math.round(150 + (50/95)*(pm25-55.4));
  if (pm25 <= 250.4) return Math.round(200 + (100/100)*(pm25-150.4));
  return Math.round(300 + (200/149.6)*(pm25-250.4));
}

function weatherIcon(id, pod) {
  const n = pod === 'n';
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 400) return '🌧️';
  if (id >= 500 && id < 600) return id === 500 ? '🌦️' : '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  if (id === 800) return n ? '🌙' : '☀️';
  if (id === 801 || id === 802) return n ? '⛅' : '🌤️';
  return '☁️';
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function reverseGeocode(lat, lon) {
  let city = 'Your Location', state = '';
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const d = await r.json();
    city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || 'Your Location';
    state = d.address?.state_code || d.address?.state || '';
  } catch (e) { /* keep defaults */ }
  return { city, state };
}

async function geocodeCity(name) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`);
  const d = await r.json();
  if (d.length > 0) {
    return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), city: d[0].display_name.split(',')[0] };
  }
  return null;
}

async function fetchOverpassHospitals(lat, lon, radius) {
  const query = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radius},${lat},${lon});
  way["amenity"="hospital"](around:${radius},${lat},${lon});
  node["amenity"="clinic"](around:${radius},${lat},${lon});
  way["amenity"="clinic"](around:${radius},${lat},${lon});
  node["healthcare"="hospital"](around:${radius},${lat},${lon});
  way["healthcare"="hospital"](around:${radius},${lat},${lon});
  node["healthcare"="clinic"](around:${radius},${lat},${lon});
);
out center tags;`;
  const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Overpass API error ' + res.status);
  const data = await res.json();
  return data.elements.map(el => ({
    id: el.id,
    name: el.tags?.name || el.tags?.['name:en'] || null,
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
    phone: el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['contact:mobile'] || null,
    addr: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:suburb'], el.tags?.['addr:city']].filter(Boolean).join(', ') || null,
  })).filter(h => h.lat && h.lon && h.name);
}

function userLocationIcon() {
  return L.divIcon({ className:'', html:`<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.3),0 2px 8px rgba(0,0,0,.3);"></div>`, iconSize:[18,18], iconAnchor:[9,9] });
}
function hospitalIcon(color) {
  color = color || '#1a6fa8';
  return L.divIcon({ className:'', html:`<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">🏥</span></div>`, iconSize:[30,30], iconAnchor:[15,30], popupAnchor:[0,-32] });
}

const ACCURACY_WARN_METERS = 5000;


function getLocationSettingsAction() {
  const ua = navigator.userAgent || '';
  if (/Windows/.test(ua)) {
    return { kind: 'link', href: 'ms-settings:privacy-location', label: '📍 Open Windows Location Settings' };
  }
  if (/Android/.test(ua)) {
    return { kind: 'link', href: 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end', label: '📍 Open Android Location Settings' };
  }
  if (/iPhone|iPad|iPod/.test(ua)) {
    return { kind: 'text', label: 'Open Settings → Privacy & Security → Location Services, and turn it on for your browser (iOS does not allow websites to open Settings directly).' };
  }
  if (/Macintosh/.test(ua)) {
    return { kind: 'text', label: 'Open System Settings → Privacy & Security → Location Services, and turn it on for your browser (macOS does not allow websites to open Settings directly).' };
  }
  return { kind: 'text', label: 'Open your device\'s system settings and turn on Location Services for this browser.' };
}

function LocationSettingsButton() {
  const action = getLocationSettingsAction();
  if (action.kind === 'link') {
    return (
      <a className="fetch-btn" href={action.href}
        style={{ background: 'rgba(26,111,168,.15)', color: 'var(--accent2)', border: '1px solid var(--border)', textDecoration: 'none' }}>
        {action.label}
      </a>
    );
  }
  return (
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.6, background: 'rgba(26,111,168,.06)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
      ℹ️ {action.label}
    </div>
  );
}

function useGeolocation() {
  const [status, setStatus] = useState('detecting'); // detecting | resolving | success | denied | unsupported
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [accuracy, setAccuracy] = useState(null);

  const detect = useCallback(() => {
    setStatus('detecting');
    setErrorMsg('');

    if (!navigator.geolocation) {
      setStatus('unsupported');
      alert('⚠️ Your browser does not support location detection.\n\nPlease use a browser like Chrome, Firefox, or Safari with location services available.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus('resolving');
        const { latitude, longitude, accuracy: acc } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        setLat(latitude); setLon(longitude);
        setCity(place.city); setStateName(place.state);
        setAccuracy(acc);
        setStatus('success');

        if (acc != null && acc > ACCURACY_WARN_METERS) {
          alert(
            '⚠️ Location is only accurate to about ' + Math.round(acc / 1000) + ' km.\n\n' +
            'Your browser could not get a real GPS fix, so it estimated your position from ' +
            'nearby Wi‑Fi/network signals instead — that is why the city shown may be wrong. ' +
            'This is common on desktops without GPS hardware, over VPN, or on Ethernet-only ' +
            'connections. See the tip below the location badge to improve this.'
          );
        }
      },
      (err) => {
        let msg;
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Use the button below to jump straight to your location settings, turn it on, then hit "Try Again".';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Getting your location took too long. Make sure location/GPS services are turned on and try again.';
        } else {
          msg = 'Your location is currently unavailable. Make sure location services are turned on for this device/browser.';
        }
        setErrorMsg(msg);
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { detect(); }, [detect]);

  return { status, lat, lon, city, stateName, errorMsg, accuracy, detect };
}



function LocationNotDetected({ onRetry, context }) {
  return (
    <div className="loc-placeholder">
      <div className="lp-icon">📍</div>
      <h3>Location not detected</h3>
      <p>
        AirVision needs your device's precise location to show {context || 'live data'} for where you are.
        Turn on location access below, then retry — no need to hunt for the settings page yourself.
        <br/><span style={{ fontSize: '11px' }}>(If you already clicked "Block" for this site in your browser's own address-bar permission icon, that button undoes it separately from the button below.)</span>
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <LocationSettingsButton />
        <button className="fetch-btn" onClick={onRetry}>🔄 Try Again</button>
      </div>
    </div>
  );
}



/* ---------- Leaflet area map (Dashboard) ---------- */

function AreaMap({ lat, lon, city, accuracy }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null || !containerRef.current) return;
    if (!mapRef.current) {
      
      if (containerRef.current._leaflet_id) delete containerRef.current._leaflet_id;
      mapRef.current = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      if (markerRef.current) markerRef.current.remove();
      if (circleRef.current) circleRef.current.remove();
    }

    markerRef.current = L.marker([lat, lon], { icon: userLocationIcon() })
      .addTo(mapRef.current)
      .bindPopup(`<b>📍 ${city}</b><br><span style="font-size:11px;color:#4a6080;">Your current location</span>`)
      .openPopup();

    
    const safeAcc = (typeof accuracy === 'number' && isFinite(accuracy) && accuracy > 0)
      ? Math.min(accuracy, 100000) : null;

    try {
      if (safeAcc != null) {
        circleRef.current = L.circle([lat, lon], {
          radius: safeAcc,
          color: '#3b82f6',
          weight: 1.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }).addTo(mapRef.current);
        mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [40, 40], maxZoom: 16 });
      } else {
        mapRef.current.setView([lat, lon], 13);
      }
    } catch (e) {
      mapRef.current.setView([lat, lon], 13);
    }

    setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 300);
  }, [lat, lon, city, accuracy]);

  return <div id="areaLeafletMap" ref={containerRef}></div>;
}

/* ---------- Chart.js hourly AQI chart ---------- */

function AQIChart({ airForecast }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!airForecast || !canvasRef.current) return;
    const pts = airForecast.list.slice(0, 12).map(item => ({
      label: new Date(item.dt * 1000).getHours() + ':00',
      val: owmAqiToVal(item.main.aqi, item.components),
    }));
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: pts.map(x => x.label),
        datasets: [{
          label: 'AQI', data: pts.map(x => x.val),
          borderColor: '#1a6fa8', backgroundColor: 'rgba(26,111,168,.1)',
          borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#1a6fa8', tension: .4, fill: true,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(26,111,168,.07)' }, ticks: { font: { size: 10, family: 'Space Mono' }, color: '#4a6080' } },
          y: { grid: { color: 'rgba(26,111,168,.07)' }, ticks: { font: { size: 10, family: 'Space Mono' }, color: '#4a6080' }, min: 0 },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [airForecast]);

  return <div className="chart-wrap"><canvas ref={canvasRef}></canvas></div>;
}

/* ---------- Dashboard tab ---------- */

function Dashboard({ geo }) {
  const [weather, setWeather] = useState(null);
  const [air, setAir] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airForecast, setAirForecast] = useState(null);
  const [dataStatus, setDataStatus] = useState('idle'); // idle | loading | ready | error
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (geo.status !== 'success' || geo.lat == null) {
      setDataStatus('idle');
      return;
    }
    async function fetchAll() {
      setDataStatus('loading');
      try {
        const [wRes, aRes, fRes, afRes] = await Promise.all([
          fetch(`${OWM}/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}&units=metric`),
          fetch(`${OWM}/air_pollution?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}`),
          fetch(`${OWM}/forecast?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}&units=metric&cnt=56`),
          fetch(`${OWM}/air_pollution/forecast?lat=${geo.lat}&lon=${geo.lon}&appid=${API_KEY}`),
        ]);
        const [w, a, f, af] = await Promise.all([wRes.json(), aRes.json(), fRes.json(), afRes.json()]);
        if (cancelled) return;
        setWeather(w); setAir(a); setForecast(f); setAirForecast(af);
        setLastUpdated(new Date().toLocaleTimeString());
        setDataStatus('ready');
      } catch (e) {
        if (!cancelled) setDataStatus('error');
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 600000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [geo.status, geo.lat, geo.lon]);

  if (geo.status === 'detecting' || geo.status === 'resolving') {
    return <div className="card"><div className="loc-placeholder"><div className="lp-icon">🔄</div><h3>Detecting your location…</h3></div></div>;
  }
  if (geo.status !== 'success') {
    return <div className="card"><LocationNotDetected onRetry={geo.detect} context="the air quality dashboard" /></div>;
  }

  const comp = air ? air.list[0].components : null;
  const aqiVal = comp ? owmAqiToVal(air.list[0].main.aqi, comp) : null;
  const info = aqiVal != null ? aqiInfo(aqiVal) : null;

  const days = {};
  if (forecast) {
    const today = new Date().toDateString();
    forecast.list.forEach(item => {
      const d = new Date(item.dt * 1000).toDateString();
      if (!days[d]) days[d] = { dt: item.dt, temps: [], icons: [], descs: [] };
      days[d].temps.push(item.main.temp);
      days[d].icons.push({ id: item.weather[0].id, pod: item.sys?.pod || 'd' });
      days[d].descs.push(item.weather[0].main);
    });
  }
  const weatherDays = Object.values(days).slice(0, 7);

  const fcDays = {};
  if (airForecast) {
    airForecast.list.forEach(item => {
      const d = new Date(item.dt * 1000).toDateString();
      if (!fcDays[d]) fcDays[d] = { dt: item.dt, vals: [] };
      fcDays[d].vals.push(owmAqiToVal(item.main.aqi, item.components));
    });
  }
  const forecastChipDays = Object.values(fcDays).slice(0, 5);
  const today = new Date().toDateString();

  return (
    <div>
      <div className="top-row">
        <div className="card aqi-main">
          <div className="card-label">Live Air Quality Index</div>
          <div>
            <div className="aqi-number" style={{ color: info ? info.color : 'var(--accent2)' }}>{aqiVal ?? '—'}</div>
            <div className="aqi-status" style={{ background: info ? info.bg : 'rgba(26,111,168,.1)', color: info ? info.color : 'var(--accent)' }}>
              {info ? info.label : (dataStatus === 'loading' ? 'Loading…' : 'Unavailable')}
            </div>
            <div className="aqi-desc">{info ? info.advice : (dataStatus === 'error' ? 'Could not fetch live data. Will retry automatically.' : 'Fetching live data…')}</div>
          </div>
          <div className="temp-hum-row">
            <div className="th-item"><span className="th-label">Temp</span><span><span className="th-val">{weather ? Math.round(weather.main.temp) : '—'}</span><span className="th-unit"> °C</span></span></div>
            <div className="th-item"><span className="th-label">Humidity</span><span><span className="th-val">{weather ? weather.main.humidity : '—'}</span><span className="th-unit"> %</span></span></div>
            <div className="th-item"><span className="th-label">Wind</span><span><span className="th-val">{weather ? Math.round(weather.wind.speed * 3.6) : '—'}</span><span className="th-unit"> km/h</span></span></div>
            <div className="th-item"><span className="th-label">Pressure</span><span><span className="th-val">{weather ? weather.main.pressure : '—'}</span><span className="th-unit"> hPa</span></span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-label">Live PM2.5</div>
          <div className="pollutant-value">{comp ? Math.round(comp.pm2_5 * 10) / 10 : '—'}</div>
          <div className="pollutant-unit">μg/m³</div>
          <div className="pollutant-bar-wrap"><div className="pollutant-bar" style={{ width: comp ? Math.min(100, (comp.pm2_5 / 250) * 100) + '%' : '0%', background: '#f97316' }}></div></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>WHO limit: 15 μg/m³</div>
        </div>

        <div className="card">
          <div className="card-label">Live PM10</div>
          <div className="pollutant-value">{comp ? Math.round(comp.pm10 * 10) / 10 : '—'}</div>
          <div className="pollutant-unit">μg/m³</div>
          <div className="pollutant-bar-wrap"><div className="pollutant-bar" style={{ width: comp ? Math.min(100, (comp.pm10 / 430) * 100) + '%' : '0%', background: '#eab308' }}></div></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>WHO limit: 45 μg/m³</div>
        </div>
      </div>

      <div className="section-title">7-Day Weather Forecast</div>
      <div className="weather-cards">
        {weatherDays.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading…</div>}
        {weatherDays.map((d, i) => {
          const avg = Math.round(d.temps.reduce((a, b) => a + b, 0) / d.temps.length);
          const mid = Math.floor(d.icons.length / 2);
          const icon = weatherIcon(d.icons[mid].id, d.icons[mid].pod);
          const dd = new Date(d.dt * 1000);
          const isToday = dd.toDateString() === today;
          return (
            <div className={`weather-day ${isToday ? 'today' : ''}`} key={i}>
              <div className="wd-name">{isToday ? 'Today' : dd.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div className="wd-icon">{icon}</div>
              <div className="wd-temp">{avg}°</div>
              <div className="wd-desc">{d.descs[mid]}</div>
            </div>
          );
        })}
      </div>

      <div className="middle-row">
        <div className="card">
          <div className="card-label">5-Day AQI Forecast</div>
          <div className="forecast-chips">
            {forecastChipDays.map((d, i) => {
              const avg = Math.round(d.vals.reduce((a, b) => a + b, 0) / d.vals.length);
              const fi = aqiInfo(avg);
              const dd = new Date(d.dt * 1000);
              const isToday = dd.toDateString() === today;
              return (
                <div className="forecast-chip" key={i}>
                  <div className="fc-day">{isToday ? 'Today' : dd.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div className="fc-val" style={{ color: fi.color }}>{avg}</div>
                  <div className="fc-status" style={{ background: fi.bg, color: fi.color }}>{fi.label.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Hourly AQI Trend</div>
          <AQIChart airForecast={airForecast} />
        </div>
      </div>

      <div className="middle-row">
        <div className="card">
          <div className="card-label">Pollutant Breakdown</div>
          <div className="pollutant-grid">
            {comp && [
              { name: 'NO₂', val: Math.round(comp.no2 * 10) / 10, unit: 'μg/m³' },
              { name: 'O₃', val: Math.round(comp.o3 * 10) / 10, unit: 'μg/m³' },
              { name: 'CO', val: Math.round(comp.co / 100) / 10, unit: 'mg/m³' },
              { name: 'SO₂', val: Math.round(comp.so2 * 10) / 10, unit: 'μg/m³' },
              { name: 'NH₃', val: Math.round((comp.nh3 || 0) * 10) / 10, unit: 'μg/m³' },
              { name: 'NO', val: Math.round((comp.no || 0) * 10) / 10, unit: 'μg/m³' },
            ].map((p, i) => (
              <div className="pollutant-item" key={i}>
                <div className="pi-name">{p.name}</div>
                <div><span className="pi-val">{p.val}</span> <span className="pi-unit">{p.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Health Advisory</div>
          <div className="advisory-grid">
            {info && info.advisory.map((a, i) => (
              <div className="advisory-item" style={{ background: a.c, borderColor: a.b }} key={i}>
                <div className="ai-icon">{a.icon}</div>
                <div className="ai-title" style={{ color: a.tc }}>{a.title}</div>
                <div className="ai-text" style={{ color: a.tc, opacity: .8 }}>{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">📍 {geo.city} — Area Map</div>
      <AreaMap lat={geo.lat} lon={geo.lon} city={geo.city} accuracy={geo.accuracy} />
      {geo.accuracy != null && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-10px', marginBottom: '16px' }}>
          🔵 Blue circle = the actual uncertainty radius your browser reported (±{geo.accuracy < 1000 ? `${Math.round(geo.accuracy)} m` : `${(geo.accuracy / 1000).toFixed(1)} km`}). You're somewhere inside it, not necessarily at the center pin.
        </div>
      )}

      <footer>
        <p>AirVision &nbsp;·&nbsp; Data: OpenWeatherMap API &nbsp;·&nbsp; {geo.stateName ? `${geo.city}, ${geo.stateName}` : geo.city} &nbsp;·&nbsp; Updated: {lastUpdated || '—'}</p>
        <p style={{ marginTop: '5px' }}>⚠️ AQI values are indicative. Consult your local environmental agency for official readings.</p>
      </footer>
    </div>
  );
}

/* ---------- Hospital map ---------- */

function HospitalMap({ lat, lon, hospitals, accuracy }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (lat == null || lon == null || !containerRef.current) return;
    if (!mapRef.current) {
      if (containerRef.current._leaflet_id) delete containerRef.current._leaflet_id;
      mapRef.current = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lon], 13);
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (circleRef.current) circleRef.current.remove();

    userMarkerRef.current = L.marker([lat, lon], { icon: userLocationIcon() })
      .addTo(mapRef.current)
      .bindPopup('<b>📍 Your Location</b>')
      .openPopup();

    const safeAcc = (typeof accuracy === 'number' && isFinite(accuracy) && accuracy > 0)
      ? Math.min(accuracy, 100000) : null;
    if (safeAcc != null) {
      try {
        circleRef.current = L.circle([lat, lon], {
          radius: safeAcc,
          color: '#3b82f6',
          weight: 1.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }).addTo(mapRef.current);
      } catch (e) { /* skip the ring rather than crash the map */ }
    }

    const bounds = [[lat, lon]];
    hospitals.forEach((h, i) => {
      const color = h.dist < 2 ? '#22c55e' : h.dist < 5 ? '#eab308' : '#f97316';
      const addr = h.addr || '';
      const mapsQ = encodeURIComponent(`${h.name} ${addr}`);
      const distStr = h.dist < 1 ? `${Math.round(h.dist * 1000)} m` : `${h.dist.toFixed(1)} km`;
      const callBtn = h.phone ? `<a class="lmap-btn lmap-call" href="tel:${h.phone}">📞 Call</a>` : '';
      const mk = L.marker([h.lat, h.lon], { icon: hospitalIcon(color) })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:2px;">#${i + 1} · ${distStr} away</div>
          <div class="lmap-name">${h.name}</div>
          <div class="lmap-addr">${addr}</div>
          ${h.phone ? `<div class="lmap-addr" style="color:#1a6fa8;">${h.phone}</div>` : ''}
          <div class="lmap-btns">${callBtn}<a class="lmap-btn lmap-dir" href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank">🗺 Directions</a></div>`,
          { maxWidth: 240 });
      markersRef.current.push(mk);
      bounds.push([h.lat, h.lon]);
    });
    if (bounds.length > 1) { try { mapRef.current.fitBounds(bounds, { padding: [30, 30] }); } catch (e) { /* keep current view */ } }
    setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 300);
  }, [lat, lon, hospitals]);

  return <div id="hospitalLeafletMap" ref={containerRef}></div>;
}

/* ---------- Hospitals tab ---------- */

function Hospitals({ geo }) {
  const [override, setOverride] = useState(null); // { lat, lon, city } from manual search
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [radius, setRadius] = useState(10000);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  const effective = override || (geo.status === 'success' ? { lat: geo.lat, lon: geo.lon, city: geo.city } : null);

  useEffect(() => {
    let cancelled = false;
    if (!effective) { setStatus('idle'); setHospitals([]); return; }
    async function load() {
      setStatus('loading');
      try {
        let list = await fetchOverpassHospitals(effective.lat, effective.lon, 10000);
        let r = 10000;
        if (list.length < 5) { r = 20000; list = await fetchOverpassHospitals(effective.lat, effective.lon, 20000); }
        if (cancelled) return;
        list = list.map(h => ({ ...h, dist: haversine(effective.lat, effective.lon, h.lat, h.lon) }))
                   .sort((a, b) => a.dist - b.dist).slice(0, 30);
        setHospitals(list);
        setRadius(r);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [effective && effective.lat, effective && effective.lon]);

  const onSearch = async () => {
    const name = searchInput.trim();
    if (!name) return;
    setSearching(true);
    try {
      const loc = await geocodeCity(name);
      if (!loc) { alert(`City "${name}" not found.`); return; }
      setOverride(loc);
    } catch (e) {
      alert('Search failed — check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  const onMyLocation = () => {
    setOverride(null);
    geo.detect();
  };

  return (
    <div>
      <div className="stats-bar">
        <div className="stat-item"><div className="stat-num">{hospitals.length || '…'}</div><div className="stat-label">Hospitals Found</div></div>
        <div className="stat-item"><div className="stat-num">24/7</div><div className="stat-label">Emergency: 108</div></div>
        <div className="stat-item"><div className="stat-num">{status === 'ready' ? (radius >= 20000 ? '20 km' : '10 km') : '—'}</div><div className="stat-label">Search Radius</div></div>
        <div className="stat-item"><div className="stat-num">{effective ? effective.city.split(',')[0] : '…'}</div><div className="stat-label">Your City</div></div>
      </div>

      <div className="city-search-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--accent2)', flex: 1, minWidth: '200px' }}>
          <span>{status === 'loading' ? '🔄' : status === 'error' ? '❌' : effective ? '📍' : '⚠️'}</span>
          <span>
            {status === 'loading' && effective && `Fetching hospitals near ${effective.city}…`}
            {status === 'ready' && effective && `${hospitals.length} hospitals found near ${effective.city.split(',')[0]}`}
            {status === 'error' && 'Failed to fetch hospital data — check your connection'}
            {status === 'idle' && (geo.status === 'detecting' || geo.status === 'resolving') && 'Detecting your location…'}
            {status === 'idle' && geo.status !== 'detecting' && geo.status !== 'resolving' && !effective && 'Location not detected — search a city or enable location'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="city-search-input" type="text" placeholder="Search another city…" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSearch(); }} />
          <button className="fetch-btn" onClick={onSearch} disabled={searching} style={{ padding: '7px 16px', fontSize: '13px' }}>🔍 Search</button>
          <button className="fetch-btn" onClick={onMyLocation}
            style={{ padding: '7px 16px', fontSize: '13px', background: 'rgba(26,111,168,.15)', color: 'var(--accent2)', border: '1px solid var(--border)' }}>
            📍 My Location
          </button>
        </div>
      </div>

      {!effective ? (
        <div className="card">
          <LocationNotDetected onRetry={onMyLocation} context="nearby hospitals" />
        </div>
      ) : (
        <div className="p2-layout">
          <div>
            <div className="section-title">🗺️ Hospitals Near {effective.city.split(',')[0]}</div>
            <HospitalMap lat={effective.lat} lon={effective.lon} hospitals={hospitals} accuracy={override ? null : geo.accuracy} />
            <div style={{ marginTop: '12px', padding: '14px 16px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>🚨 Emergency Helplines</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                Ambulance: <strong style={{ color: 'var(--text)' }}>108</strong> &nbsp;|&nbsp;
                Police: <strong style={{ color: 'var(--text)' }}>100</strong> &nbsp;|&nbsp;
                Fire: <strong style={{ color: 'var(--text)' }}>101</strong> &nbsp;|&nbsp;
                NDMA Helpline: <strong style={{ color: 'var(--text)' }}>1078</strong>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">🏥 Live Hospital Directory — {effective.city.split(',')[0]}</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="hospital-table-wrap">
                <table className="hospital-table">
                  <thead><tr><th style={{ width: '36px' }}>#</th><th>Hospital / Clinic</th><th>Address</th><th>Contact</th><th>Actions</th></tr></thead>
                  <tbody>
                    {status === 'loading' && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <span className="spinner" style={{ borderColor: 'rgba(26,111,168,.3)', borderTopColor: 'var(--accent)', width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}></span>
                        Fetching live hospitals from OpenStreetMap…
                      </td></tr>
                    )}
                    {status === 'error' && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#991b1b', fontSize: '13px' }}>⚠️ Could not fetch hospitals. Check your internet connection.</td></tr>
                    )}
                    {status === 'ready' && hospitals.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>No hospitals found within {radius / 1000} km. Try searching a specific city.</td></tr>
                    )}
                    {status === 'ready' && hospitals.map((h, i) => {
                      const distStr = h.dist < 1 ? `${Math.round(h.dist * 1000)} m` : `${h.dist.toFixed(1)} km`;
                      const distColor = h.dist < 2 ? '#22c55e' : h.dist < 5 ? '#eab308' : '#f97316';
                      const addr = h.addr || effective.city;
                      const mapsQ = encodeURIComponent(`${h.name} ${addr}`);
                      return (
                        <tr key={h.id}>
                          <td><span className="h-index">{String(i + 1).padStart(2, '0')}</span></td>
                          <td>
                            <div className="h-name">{h.name}</div>
                            <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 600, color: distColor }}>{distStr} away</div>
                          </td>
                          <td><div className="h-addr">{addr}</div></td>
                          <td><div className="h-phone">{h.phone || '—'}</div></td>
                          <td>
                            <div className="action-col">
                              {h.phone ? <a className="btn-call" href={`tel:${h.phone}`}>📞 Call</a> : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>}
                              <a className="btn-map" href={`https://www.google.com/maps/search/?api=1&query=${mapsQ}`} target="_blank" rel="noreferrer">🗺 Directions</a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: '24px' }}>
        <p>AirVision &nbsp;·&nbsp; Live hospital data via OpenStreetMap &nbsp;·&nbsp; Always call ahead to confirm availability</p>
      </footer>
    </div>
  );
}

/* ---------- App shell ---------- */

function App() {
  const [tab, setTab] = useState('dashboard');
  const geo = useGeolocation();

  const logoSub = geo.status === 'detecting' || geo.status === 'resolving'
    ? 'Detecting location…'
    : geo.status === 'success' ? `${geo.city} Air Quality Monitor` : 'Location not detected';

  const locBadgeText = geo.status === 'detecting' || geo.status === 'resolving'
    ? 'Detecting…'
    : geo.status === 'success' ? (geo.stateName ? `${geo.city}, ${geo.stateName}` : geo.city) : 'Location not detected';

  const isRoughFix = geo.status === 'success' && geo.accuracy != null && geo.accuracy > ACCURACY_WARN_METERS;

  const sourceNote = geo.status === 'success'
    ? (isRoughFix
        ? { text: `⚠️ Rough estimate (±${Math.round(geo.accuracy / 1000)} km) — not a real GPS fix. See tip below.`, color: '#b45309' }
        : { text: `📡 Precise location${geo.accuracy != null ? ` (±${Math.round(geo.accuracy)} m)` : ''}`, color: '#166534' })
    : geo.status === 'denied' ? { text: '⚠️ ' + geo.errorMsg, color: '#b45309' }
    : geo.status === 'unsupported' ? { text: '⚠️ Geolocation not supported by this browser', color: '#b45309' }
    : { text: '', color: '' };

  return (
    <div className="site-content">
      <nav className="top-nav">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 26 26" fill="none" width="26" height="26">
              <circle cx="13" cy="13" r="10" stroke="white" strokeWidth="2"/>
              <path d="M13 3 Q13 13 7 18" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M13 3 Q13 13 19 18" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="13" cy="13" r="2.5" fill="white"/>
              <path d="M6 10 Q10 8 13 10 Q16 12 20 10" stroke="white" strokeWidth="1.2" fill="none"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">AirVision</div>
            <div className="logo-sub">{logoSub}</div>
          </div>
        </div>

        <div className="nav-tabs">
          <button className={`nav-tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>🌬️ Air Dashboard</button>
          <button className={`nav-tab ${tab === 'hospitals' ? 'active' : ''}`} onClick={() => setTab('hospitals')}>🏥 Hospitals</button>
        </div>

        <div className="nav-right">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <div className="loc-badge">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              <span>{locBadgeText}</span>
            </div>
            <span style={{ fontSize: '10px', color: sourceNote.color || 'var(--text-muted)' }}>{sourceNote.text}</span>
          </div>
          <button onClick={geo.detect} disabled={geo.status === 'detecting' || geo.status === 'resolving'} className="fetch-btn"
            style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(26,111,168,.15)', color: 'var(--accent2)', border: '1px solid var(--border)' }}>
            {geo.status === 'detecting' || geo.status === 'resolving' ? <><span className="spinner" style={{ borderColor: 'rgba(26,111,168,.3)', borderTopColor: 'var(--accent2)' }}></span> Detecting…</> : '📍 Detect Precise Location'}
          </button>
          <div className="live-badge"><div className="live-dot"></div> Live</div>
        </div>
      </nav>

      {isRoughFix && (
        <div className="card" style={{ marginBottom: '16px', borderColor: 'rgba(180,83,9,.3)', background: 'rgba(180,83,9,.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '6px' }}>
            ⚠️ This location is a rough network estimate, not real GPS
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Your browser reported success, but the accuracy is only ±{Math.round(geo.accuracy / 1000)} km — that's
            Wi‑Fi/IP triangulation, not a GPS fix, which is why the city may be wrong. To fix it:
            <br/>• On a phone: open this page in the browser directly (not an embedded/in-app browser) and make sure Location Services + high-accuracy mode are on.
            <br/>• On a desktop: turn on Wi‑Fi (even if you're on Ethernet) so Windows/macOS can see nearby access points, and turn off any VPN.
            <br/>• Check <strong>Settings → Privacy → Location</strong> on your OS, and the site's location permission in the browser's address-bar padlock.
            <br/>• Then use the "📍 Detect Precise Location" button again.
          </div>
        </div>
      )}

      {tab === 'dashboard' ? <Dashboard geo={geo} /> : <Hospitals geo={geo} />}
    </div>
  );
}

/* ---------- safety net: never show a blank white page again ---------- */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: (error && error.message) || 'Unknown error' };
  }
  componentDidCatch(error, info) {
    console.error('AirVision crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="site-content">
          <div className="card" style={{ margin: '40px auto', maxWidth: '480px' }}>
            <div className="loc-placeholder">
              <div className="lp-icon">⚠️</div>
              <h3>Something went wrong</h3>
              <p>AirVision hit an unexpected error and stopped instead of showing a blank page.</p>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', background: 'rgba(26,111,168,.06)', padding: '8px 12px', borderRadius: '8px', wordBreak: 'break-word' }}>{this.state.message}</p>
              <button className="fetch-btn" onClick={() => window.location.reload()}>🔄 Reload App</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);