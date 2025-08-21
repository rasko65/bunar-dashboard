const API_KEY = "token_dlVQqzrALZ6DsGjF"; // zameni svojim Beebotte tokenom
const CHANNEL = "nivoi_bunara";
const RESOURCE1 = "bunar1";
const RESOURCE2 = "bunar2";

let chart1, chart2;
let selectedRange = "1h";

document.getElementById("rangeSelector").addEventListener("change", e => {
  selectedRange = e.target.value;
  document.getElementById("chart-title").textContent = `Grafikon za poslednji ${selectedRange}`;
  fetchData();
});

function safeDisplayValue(value) {
  return value !== null && value !== undefined ? `${value} m` : "Nema podatka";
}

function checkMinimums(b1, b2) {
  document.getElementById("bunar1-value").classList.toggle("alert", b1 < 4);
  document.getElementById("bunar2-value").classList.toggle("alert", b2 < 0.6);
}

function updateDisplay(b1, b2) {
  document.getElementById("bunar1-value").textContent = `Bunar 1: ${safeDisplayValue(b1)}`;
  document.getElementById("bunar2-value").textContent = `Bunar 2: ${safeDisplayValue(b2)}`;
  checkMinimums(b1, b2);
}

function updateCharts(data1, data2) {
  chart1.data.labels = data1.map(d => new Date(d.time).toLocaleTimeString());
  chart1.data.datasets[0].data = data1.map(d => d.data);
  chart1.update();

  chart2.data.labels = data2.map(d => new Date(d.time).toLocaleTimeString());
  chart2.data.datasets[0].data = data2.map(d => d.data);
  chart2.update();
}

function initCharts() {
  const ctx1 = document.getElementById("chart1").getContext("2d");
  const ctx2 = document.getElementById("chart2").getContext("2d");

  chart1 = new Chart(ctx1, {
    type: "line",
    data: { labels: [], datasets: [{
      label: "Bunar 1",
      data: [],
      borderColor: "#4bc0c0",
      backgroundColor: "transparent",
      tension: 0.3
    }]},
    options: {
      scales: {
        y: { min: 0, max: 10 }
      }
    }
  });

  chart2 = new Chart(ctx2, {
    type: "line",
    data: { labels: [], datasets: [{
      label: "Bunar 2",
      data: [],
      borderColor: "#ff6384",
      backgroundColor: "transparent",
      tension: 0.3
    }]},
    options: {
      scales: {
        y: { min: 0, max: 4 }
      }
    }
  });
}

async function fetchData() {
  const headers = { "X-Auth-Token": API_KEY };
  const now = new Date();
  const rangeMs = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000
  }[selectedRange];

  const fromTime = new Date(now.getTime() - rangeMs).toISOString();
  const toTime = now.toISOString();

  const url1 = `https://api.beebotte.com/v1/history/read/${CHANNEL}/${RESOURCE1}?from=${fromTime}&to=${toTime}`;
  const url2 = `https://api.beebotte.com/v1/history/read/${CHANNEL}/${RESOURCE2}?from=${fromTime}&to=${toTime}`;

  try {
    const [res1, res2] = await Promise.all([
      fetch(url1, { headers }).then(r => r.json()),
      fetch(url2, { headers }).then(r => r.json())
    ]);

    if (!Array.isArray(res1) || !Array.isArray(res2)) {
      console.error("Nevalidan odgovor od API-ja:", res1, res2);
      return;
    }

    if (res1.length === 0 || res2.length === 0) {
      console.warn("Nema podataka u izabranom opsegu.");
    }

    const last1 = res1[res1.length - 1]?.data ?? null;
    const last2 = res2[res2.length - 1]?.data ?? null;

    updateDisplay(last1, last2);
    updateCharts(res1, res2);
  } catch (err) {
    console.error("Greška pri čitanju:", err);
  }
}

function exportCSV() {
  const b1 = document.getElementById("bunar1-value").textContent;
  const b2 = document.getElementById("bunar2-value").textContent;
  const rows = [
    ["Bunar", "Vrednost"],
    ["Bunar 1", b1],
    ["Bunar 2", b2]
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "bunari.csv";
  link.click();
}

initCharts();
fetchData();
setInterval(fetchData, 30000);



