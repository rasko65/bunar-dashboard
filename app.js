const API_URL = "https://api.beebotte.com/v1/data/read/bunari/nivo?limit=100";
const API_TOKEN = "your_token_here"; // zameni sa pravim tokenom

let chart;

async function fetchData() {
  const headers = { "X-Auth-Token": API_TOKEN };

  try {
    const response = await fetch(API_URL, { headers });
    const rawData = await response.json();

    const formatted = rawData
      .filter(entry => entry.data !== null)
      .map(entry => ({
        x: new Date(entry.timestamp),
        y: Number(entry.data)
      }));

    console.log("Beebotte podaci:", formatted);
    return formatted;
  } catch (err) {
    console.error("Greška:", err);
    return [];
  }
}

function renderChart(data) {
  const ctx = document.getElementById("grafikon").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: "Nivo",
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
          ticks: { color: "#ccc" }
        }
      },
      plugins: {
        legend: { labels: { color: "#ccc" } }
      }
    }
  });
}

async function refresh() {
  const data = await fetchData();
  renderChart(data);
}

function exportCSV() {
  if (!chart || !chart.data.datasets[0].data.length) return;

  const rows = chart.data.datasets[0].data.map(p => `${p.x.toISOString()},${p.y}`);
  const csv = "timestamp,value\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "nivo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function updateRange() {
  const range = document.getElementById("rangeSelector").value;
  console.log("Odabrani opseg:", range);
  // Ovde možeš dodati filtriranje po vremenskom opsegu
}

// ⏱ Automatski refresh na 30s
setInterval(refresh, 30000);
refresh();
