



const API_URL_1 = "https://api.beebotte.com/v1/data/read/bunar1?limit=100";
const API_URL_2 = "https://api.beebotte.com/v1/data/read/bunar2?limit=100";
const MIN_THRESHOLD = 20;

const selectors = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

let data1 = [], data2 = [];

async function fetchData() {
  const [res1, res2] = await Promise.all([
    fetch(API_URL_1).then(r => r.json()),
    fetch(API_URL_2).then(r => r.json())
  ]);
  data1 = res1.reverse();
  data2 = res2.reverse();
  updateChart("24h");
}

function updateChart(rangeKey) {
  const now = Date.now();
  const range = selectors[rangeKey];

  const filtered1 = data1.filter(d => now - new Date(d.timestamp) <= range);
  const filtered2 = data2.filter(d => now - new Date(d.timestamp) <= range);

  const labels = filtered1.map(d => new Date(d.timestamp).toLocaleTimeString());
  const values1 = filtered1.map(d => d.data ?? 0);
  const values2 = filtered2.map(d => d.data ?? 0);

  renderChart(labels, values1, values2);
  updateMinIndicators(values1, values2);
}

function renderChart(labels, values1, values2) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Bunar 1",
          data: values1,
          borderColor: "#4e79a7",
          fill: false
        },
        {
          label: "Bunar 2",
          data: values2,
          borderColor: "#f28e2b",
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateMinIndicators(values1, values2) {
  const min1 = Math.min(...values1);
  const min2 = Math.min(...values2);

  document.getElementById("min1").textContent = min1;
  document.getElementById("min2").textContent = min2;

  document.getElementById("min1").style.color = min1 < MIN_THRESHOLD ? "red" : "inherit";
  document.getElementById("min2").style.color = min2 < MIN_THRESHOLD ? "red" : "inherit";
}

function exportCSV() {
  let csv = "timestamp,bunar1,bunar2\n";
  for (let i = 0; i < data1.length; i++) {
    const t = new Date(data1[i].timestamp).toISOString();
    const v1 = data1[i].data ?? 0;
    const v2 = data2[i]?.data ?? 0;
    csv += `${t},${v1},${v2}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "nivoi_bunara.csv";
  link.click();
}

document.getElementById("selector").addEventListener("change", e => {
  updateChart(e.target.value);
});

document.getElementById("exportBtn").addEventListener("click", exportCSV);

document.getElementById("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

fetchData();

