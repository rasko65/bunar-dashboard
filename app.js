const ctx1 = document.getElementById('chart1').getContext('2d');
const ctx2 = document.getElementById('chart2').getContext('2d');
const rangeSelector = document.getElementById('range');
const exportBtn = document.getElementById('export-csv');
const refreshTimer = document.getElementById('refresh-timer');
const trend1 = document.getElementById('trend1');
const trend2 = document.getElementById('trend2');

let chart1, chart2;
let currentRange = '1h';
let refreshInterval = 30; // seconds

function generateMockData(range) {
  const points = range === '1h' ? 60 : range === '24h' ? 24 : 7;
  const labels = [];
  const data1 = [];
  const data2 = [];

  for (let i = 0; i < points; i++) {
    labels.push(`${i}`);
    data1.push(Math.random() * 100);
    data2.push(Math.random() * 50 + 50);
  }

  return { labels, data1, data2 };
}

function renderCharts() {
  const { labels, data1, data2 } = generateMockData(currentRange);

  if (chart1) chart1.destroy();
  if (chart2) chart2.destroy();

  chart1 = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sensor A',
        data: data1,
        borderColor: '#4fc3f7',
        backgroundColor: 'rgba(79,195,247,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { reverse: false },
        y: { beginAtZero: true }
      }
    }
  });

  chart2 = new Chart(ctx2, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sensor B',
        data: data2,
        borderColor: '#81c784',
        backgroundColor: 'rgba(129,199,132,0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { reverse: false },
        y: { beginAtZero: true }
      }
    }
  });

  updateTrends(data1, data2);
}

function updateTrends(data1, data2) {
  const trendA = data1[data1.length - 1] - data1[0];
  const trendB = data2[data2.length - 1] - data2[0];

  trend1.textContent = `Trend: ${trendA.toFixed(2)} ${trendA >= 0 ? '📈' : '📉'}`;
  trend2.textContent = `Trend: ${trendB.toFixed(2)} ${trendB >= 0 ? '📈' : '📉'}`;
}

function exportCSV() {
  const rows = [['Time', 'Sensor A', 'Sensor B']];
  chart1.data.labels.forEach((label, i) => {
    rows.push([label, chart1.data.datasets[0].data[i], chart2.data.datasets[0].data[i]]);
  });

  const csvContent = rows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'bunar-data.csv';
  link.click();
}

rangeSelector.addEventListener('change', () => {
  currentRange = rangeSelector.value;
  renderCharts();
});

exportBtn.addEventListener('click', exportCSV);

function startAutoRefresh() {
  setInterval(() => {
    renderCharts();
  }, refreshInterval * 1000);
}

document.getElementById('toggle-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

renderCharts();
startAutoRefresh();
