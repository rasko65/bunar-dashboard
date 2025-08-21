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

  renderChart("grafikon1", data1, "Bunar 1");
  renderChart("grafikon2", data2, "Bunar 2");

  updateTrend("trend1", data1);
  updateTrend("trend2", data2);

  updateCurrentValue("vrednost1", data1, 4);
  updateCurrentValue("vrednost2", data2, 0.6);
}

function renderChart(canvasId, data, label) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  if (window[canvasId + "_chart"]) {
    window[canvasId + "_chart"].destroy();
  }

  let yMin = 0;
  let yMax = canvasId === "grafikon1" ? 10 : 4;

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
  const current = data.at(-1)?.y;
  if (current === undefined) {
    el.textContent = "Trenutno: N/A";
    el.style.color = "#e0e0e0";
    return;
  }

  el.textContent = `Trenutno: ${current.toFixed(2)} m`;
  el.style.color = current < minThreshold ? "red" : "#e0e0e0";
}

function exportCSV(data, filename) {
  if (!data || data.length === 0) return;

  const rows = data.map(d => `${d.x.toISOString()},${d.y}`);
  const csv = "timestamp,value\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

