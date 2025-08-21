const CHANNEL = "nivoi_bunara";
const TOKEN = "token_dlVQqzrALZ6DsGjF";
const LIMIT = 300;

let selectedRange = "1h";

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("rangeSelector");
  selector.value = localStorage.getItem("selectedRange") || "1h";
  selectedRange = selector.value;
  selector.addEventListener("change", updateRange);

  refresh();
  setInterval(refresh, 30000);
});

function updateRange() {
  selectedRange = document.getElementById("rangeSelector").value;
  localStorage.setItem("selectedRange", selectedRange);
  refresh();
}

async function fetchData(resource, range = "1h") {
  const url = `https://api.beebotte.com/v1/data/read/${CHANNEL}/${resource}?limit=${LIMIT}`;
  const headers = { "X-Auth-Token": TOKEN };

  try {
    const response = await fetch(url, { headers });
    const rawData = await response.json();

    const now = Date.now();
    const rangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000
    }[range];

    const filtered = rawData
      .filter(entry => entry.data !== null && !isNaN(Number(entry.data)))
      .filter(entry => now - entry.ts <= rangeMs)
      .map(entry => ({
        x: new Date(entry.ts),
        y: Number(entry.data)
      }));

    return filtered;
  } catch (err) {
    console.error(`Greška za ${resource}:`, err);
    return [];
  }
}

async function refresh() {
  const data1 = await fetchData("bunar1", selectedRange);
  const data2 = await fetchData("bunar2", selectedRange);

  window.lastData1 = data1;
  window.lastData2 = data2;

  renderChart("grafikon1", data1, "Bunar 1", 0, 10);
  renderChart("grafikon2", data2, "Bunar 2", 0, 4);

  updateTrend("trend1", data1);
  updateTrend("trend2", data2);

  updateCurrentValue("current1", data1, 4);
  updateCurrentValue("current2", data2, 0.6);
}

function renderChart(canvasId, data, label, yMin, yMax) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  if (window[canvasId + "_chart"]) {
    window[canvasId + "_chart"].destroy();
  }

  window[canvasId + "_chart"] = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label,
        data,
        borderColor: "#00bcd4",
        backgroundColor: "rgba(0,188,212,0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "minute",
            tooltipFormat: "HH:mm"
          },
          title: {
            display: true,
            text: "Vreme"
          }
        },
        y: {
          min: yMin,
          max: yMax,
          title: {
            display: true,
            text: "Vrednost"
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function updateTrend(elementId, data) {
  const el = document.getElementById(elementId);
  if (data.length < 2) {
    el.textContent = "N/A";
    return;
  }
  const delta = data[data.length - 1].y - data[0].y;
  const trend = delta > 0 ? "📈 +" : delta < 0 ? "📉 " : "➖ ";
  el.textContent = `${trend}${delta.toFixed(2)}`;
}

function updateCurrentValue(elementId, data, minThreshold) {
  const el = document.getElementById(elementId);
  if (!data.length) {
    el.textContent = "Trenutna: --";
    return;
  }
  const value = data[data.length - 1].y;
  el.textContent = `Trenutna: ${value.toFixed(2)}m`;
  el.style.color = value < minThreshold ? "#ff5252" : "#e0e0e0";
}

function exportCombinedCSV() {
  const data1 = window.lastData1 || [];
  const data2 = window.lastData2 || [];

  const timestamps = new Set([...data1.map(d => d.x.toISOString()), ...data2.map(d => d.x.toISOString())]);
  const sorted = Array.from(timestamps).sort();

  const map1 = Object.fromEntries(data1.map(d => [d.x.toISOString(), d.y]));
  const map2 = Object.fromEntries(data2.map(d => [d.x.toISOString(), d.y]));

  const rows = sorted.map(ts => {
    const val1 = map1[ts] ?? "";
    const val2 = map2[ts] ?? "";
    return `${ts},${val1},${val2}`;
  });

  const csv = "timestamp,bunar1,bunar2\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "

