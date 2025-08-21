const API_KEY = "token_dlVQqzrALZ6DsGjF"; // zameni svojim Beebotte tokenom
const CHANNEL = "nivoi_bunara";
const RESOURCE1 = "bunar1";
const RESOURCE2 = "bunar2";

let chart1, chart2;

function safeDisplayValue(value) {
  return value !== null && value !== undefined ? `${value} m` : "Nema podatka";
}

function checkMinimums(b1, b2) {
  document.getElementById("bunar1-value").classList.toggle("alert", b1 < 4);
  document.getElementById("bunar2-value").classList.toggle("alert", b2 < 0.6);
}

function updateDisplay(b1, b2) {
  document.getElementById("bunar1-value").textContent = safeDisplayValue(b1);
  document.getElementById("bunar2-value").textContent = safeDisplayValue(b2);
  checkMinimums(b1, b2);
}

function updateCharts(b1, b2) {
  const time = new Date().toLocaleTimeString();

  chart1.data.labels.push(time);
  chart1.data.datasets[0].data.push(b1);
  chart1.update();

  chart2.data.labels.push(time);
  chart2.data.datasets[0].data.push(b2);
  chart2.update();
}

function initCharts() {
  const ctx1 = document.getElementById("chart1").getContext("2d");
  const ctx2 = document.getElementById("chart2").getContext("2d");

  chart1 = new Chart(ctx1, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Bunar 1",
        data: [],
        borderColor: "#4bc0c0",
        backgroundColor: "transparent",
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 10 }
      }
    }
  });

  chart2 = new Chart(ctx2, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Bunar 2",
        data: [],
        borderColor: "#ff6384",
        backgroundColor: "transparent",
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 4 }
      }
    }
  });
}

async function fetchData() {
  const headers = { "X-Auth-Token": API_KEY };
  const url1 = `https://api.beebotte.com/v1/data/read/${CHANNEL}/${RESOURCE1}?limit=1`;
  const url2 = `https://api.beebotte.com/v1/data/read/${CHANNEL}/${RESOURCE2}?limit=1`;

  try {
    const [res1, res2] = await Promise.all([
      fetch(url1, { headers }).then(r => r.json()),
      fetch(url2, { headers }).then(r => r.json())
    ]);

    const b1 = res1[0]?.data ?? null;
    const b2 = res2[0]?.data ?? null;

    updateDisplay(b1, b2);
    updateCharts(b1, b2);
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
setInterval(fetchData, 5000);
