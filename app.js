const TOKEN = "token_dlVQqzrALZ6DsGjF";
const CHANNEL = "nivoi_bunara";
const RESOURCES = ["bunar1", "bunar2"];
const LIMIT = 100;

let charts = {};
let warnings = {};

async function fetchData(resource) {
  const url = `https://api.beebotte.com/v1/data/read/${CHANNEL}/${resource}?limit=${LIMIT}`;
  const headers = { "X-Auth-Token": TOKEN };

  try {
    const response = await fetch(url, { headers });
    const rawData = await response.json();

    const formatted = rawData
      .filter(entry => entry.data !== null && !isNaN(Number(entry.data)))
      .map(entry => ({
        x: new Date(entry.timestamp),
        y: Number(entry.data)
      }));

    return formatted;
  } catch (err) {
    console.error(`Greška za ${resource}:`, err);
    return [];
  }
}

function renderChart(canvasId, data, label) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  if (charts[canvasId]) charts[canvasId].destroy();

  if (data.length === 0) {
    showWarning(canvasId, `⚠️ Nema dostupnih podataka za ${label}`);
  } else {
    hideWarning(canvasId);
  }

  charts[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: label,
        data: data,
        borderColor: "#00ffcc",
        backgroundColor: "rgba(0,255,204,0.1)",
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "minute",
            tooltipFormat: "HH:mm:ss"
          },
          ticks: { color: "#ccc" }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 10, // 👈 Dodato da linija ne bude zalepljena za dno
          ticks: { color: "#ccc" }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Vrednost: ${ctx.parsed.y}`
          }
        },
        legend: { labels: { color: "#ccc" } }
      }
    }
  });
}

function showWarning(canvasId, message) {
  let warning = warnings[canvasId];
  if (!warning) {
    warning = document.createElement("div");
    warning.className = "warning";
    warning.style.color = "orange";
    warning.style.marginTop = "8px";
    document.getElementById(canvasId).parentElement.appendChild(warning);
    warnings[canvasId] = warning;
  }
  warning.textContent = message;
}

function hideWarning(canvasId) {
  const warning = warnings[canvasId];
  if (warning) warning.textContent = "";
}

async function refresh() {
  const data1 = await fetchData("bunar1");
  const data2 = await fetchData("bunar2");

  renderChart("grafikon1", data1, "Bunar 1");
  renderChart("grafikon2", data2, "Bunar 2");
}

function exportCSV() {
  let allRows = [];

  RESOURCES.forEach((res, i) => {
    const chart = charts[`grafikon${i + 1}`];
    if (!chart || !chart.data.datasets[0].data.length) return;

    const rows = chart.data.datasets[0].data.map(p => `${res},${p.x.toISOString()},${p.y}`);
    allRows = allRows.concat(rows);
  });

  const csv = "resource,timestamp,value\n" + allRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nivoi.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function updateRange() {
  const range = document.getElementById("rangeSelector").value;
  console.log("Odabrani opseg:", range);
  // Ovde možeš dodati filtriranje po vremenskom opsegu
}

setInterval(refresh, 30000);
refresh();
