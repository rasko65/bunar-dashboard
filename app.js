/** Konfiguracija **/
const CHANNEL = "nivoi_bunara";           // Beebotte kanal
const RESOURCE1 = "bunar1";               // resurs 1
const RESOURCE2 = "bunar2";               // resurs 2
const TOKEN = "token_dlVQqzrALZ6DsGjF";   // X-Auth-Token
const POLL_MS = 30000;                    // refresh na 30 s
const LIMIT = 500;                        // max zapisa

// Pragovi minimuma
const THRESHOLDS = { bunar1: 4.0, bunar2: 0.6 };

let selectedRange = localStorage.getItem("selectedRange") || "1h";
let chart1, chart2;
let data1 = []; // {x: Date, y: number}
let data2 = [];

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("rangeSelector");
  selector.value = selectedRange;
  selector.addEventListener("change", () => {
    selectedRange = selector.value;
    localStorage.setItem("selectedRange", selectedRange);
    refresh();
  });

  document.getElementById("exportAll").addEventListener("click", exportBothCSV);

  // Inicijalizuj grafikone
  chart1 = makeChart(document.getElementById("chart1"), 0, 10, THRESHOLDS.bunar1, "Bunar 1");
  chart2 = makeChart(document.getElementById("chart2"), 0, 4, THRESHOLDS.bunar2, "Bunar 2");

  refresh();
  setInterval(refresh, POLL_MS);
});

function tsRangeParams() {
  // Pretvori '1h','6h','12h','24h','7d' u milisekunde
  const now = Date.now();
  const map = { "1h": 3600e3, "6h": 6*3600e3, "12h": 12*3600e3, "24h": 24*3600e3, "7d": 7*86400e3 };
  const span = map[selectedRange] || 3600e3;
  return { from: new Date(now - span).toISOString(), to: new Date(now).toISOString() };
}

async function refresh() {
  try {
    const { from, to } = tsRangeParams();
    const [arr1, arr2] = await Promise.all([
      readBeebotte(CHANNEL, RESOURCE1, LIMIT, from, to),
      readBeebotte(CHANNEL, RESOURCE2, LIMIT, from, to),
    ]);

    data1 = arr1.map(r => ({ x: new Date(r.ts || r.timestamp || r.time || r._ts || r.created_at), y: Number(r.data ?? r.value ?? r.val) }))
                .filter(d => isFinite(d.y));
    data2 = arr2.map(r => ({ x: new Date(r.ts || r.timestamp || r.time || r._ts || r.created_at), y: Number(r.data ?? r.value ?? r.val) }))
                .filter(d => isFinite(d.y));

    updateCharts();
    updateValues();
  } catch (e) {
    console.error("Greška pri osvežavanju", e);
  }
}

async function readBeebotte(channel, resource, limit, fromISO, toISO) {
  // Beebotte API: GET /v1/data/read/{channel}/{resource}?limit=...&from=...&to=...
  const url = new URL(`https://api.beebotte.com/v1/data/read/${encodeURIComponent(channel)}/${encodeURIComponent(resource)}`);
  url.searchParams.set("limit", String(limit));
  if (fromISO) url.searchParams.set("from", fromISO);
  if (toISO) url.searchParams.set("to", toISO);
  // Najnovije poslednje, pa ih posle sortiramo po vremenu
  url.searchParams.set("sort", "asc");
  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": TOKEN }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function makeChart(canvas, yMin, yMax, threshold, label) {
  return new Chart(canvas.getContext("2d"), {
    type: "line",
    data: { datasets: [{
      label,
      data: [],
      tension: 0.2,
      borderWidth: 2,
      pointRadius: 0,
    }]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "dd.MM.yyyy HH:mm", displayFormats: { minute: "HH:mm", hour: "HH:mm", day: "dd.MM" } },
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#9aa4b2" },
        },
        y: {
          min: yMin, max: yMax, // fiksne ordinate
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#9aa4b2" },
          title: { display: true, text: "m" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "nearest", intersect: false },
        annotation: {
          annotations: {
            minLine: {
              type: "line",
              yMin: threshold,
              yMax: threshold,
              borderDash: [6,4],
              borderWidth: 1.5
            }
          }
        }
      }
    }
  });
}

function updateCharts() {
  chart1.data.datasets[0].data = data1;
  chart2.data.datasets[0].data = data2;
  chart1.update();
  chart2.update();
}

function updateValues() {
  const v1 = data1.length ? data1[data1.length - 1].y : null;
  const v2 = data2.length ? data2[data2.length - 1].y : null;

  const value1 = document.getElementById("value1");
  const value2 = document.getElementById("value2");
  const status1 = document.getElementById("status1");
  const status2 = document.getElementById("status2");

  value1.textContent = v1 != null ? v1.toFixed(2) + " m" : "—";
  value2.textContent = v2 != null ? v2.toFixed(2) + " m" : "—";

  if (v1 != null) {
    const low = v1 < THRESHOLDS.bunar1;
    status1.textContent = low ? `Nivo ispod minimuma (${THRESHOLDS.bunar1} m)` : "Nivo u granicama";
    status1.className = "status " + (low ? "low" : "ok");
  }
  if (v2 != null) {
    const low = v2 < THRESHOLDS.bunar2;
    status2.textContent = low ? `Nivo ispod minimuma (${THRESHOLDS.bunar2} m)` : "Nivo u granicama";
    status2.className = "status " + (low ? "low" : "ok");
  }
}

function exportBothCSV() {
  // Spoji po vremenu (najjednostavnije – u minutne kante)
  // Napravi mapu timestamp -> vrednosti
  const map = new Map();
  const roundToMin = d => new Date(Math.floor(d.getTime() / 60000) * 60000);

  for (const {x,y} of data1) {
    const k = roundToMin(x).toISOString();
    if (!map.has(k)) map.set(k, { ts: k, bunar1: "", bunar2: "" });
    map.get(k).bunar1 = y;
  }
  for (const {x,y} of data2) {
    const k = roundToMin(x).toISOString();
    if (!map.has(k)) map.set(k, { ts: k, bunar1: "", bunar2: "" });
    map.get(k).bunar2 = y;
  }

  const rows = Array.from(map.values()).sort((a,b) => a.ts.localeCompare(b.ts));
  let csv = "timestamp,bunar1_m,bunar2_m\n";
  csv += rows.map(r => `${r.ts},${r.bunar1 === "" ? "" : Number(r.bunar1).toFixed(3)},${r.bunar2 === "" ? "" : Number(r.bunar2).toFixed(3)}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bunari.csv";
  link.click();
}
