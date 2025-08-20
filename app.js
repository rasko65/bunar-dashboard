const CHANNEL = "tvoj_kanal";
const TOKEN = "tvoj_token";
const LIMIT = 200;

let selectedRange = "1h";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rangeSelector").addEventListener("change", updateRange);
  refresh();
  setInterval(refresh, 30000);
});

function updateRange() {
  selectedRange = document.getElementById("rangeSelector").value;
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

  renderChart("grafikon1", data1, "Bunar 1");
  renderChart("grafikon2", data2, "Bunar 2");
  updateTrend("trend1", data1);
  updateTrend("trend2", data2);
}

function renderChart(canvasId, data, label) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label,
        data,
        borderColor: "#00bcd4",
        backgroundColor: "rgba(0,188,212,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
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

function exportCSV(data, filename) {
  const rows = data.map(d => `${d.x.toISOString()},${d.y}`);
  const csv = "timestamp,value\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
