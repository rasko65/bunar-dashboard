let chart1, chart2;
let lastData1 = [], lastData2 = [];
 
function createChart(ctx, label) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: label,
        data: [],
        borderColor: '#00bcd4',
        backgroundColor: 'rgba(0, 188, 212, 0.2)',
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { type: 'time', time: { unit: 'minute' } },
        y: { beginAtZero: true }
      }
    }
  });
}

function updateChart(chart, data) {
  chart.data.datasets[0].data = data;
  chart.update();
}

function updateCurrentValue(elementId, data, minThreshold) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element ${elementId} ne postoji u DOM-u`);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    el.textContent = "Trenutno: N/A";
    el.style.color = "#e0e0e0";
    return;
  }

  const current = data[data.length - 1].y;

  if (current === 0) {
    el.innerHTML = `Trenutno: 0.00 m <span style="font-size:1.2em;">🟠</span>`;
    el.style.color = "#ff9800";
    return;
  }

  el.textContent = `Trenutno: ${current.toFixed(2)} m`;
  el.style.color = current < minThreshold ? "red" : "#e0e0e0";
}

function refresh() {
  fetch("https://api.beebotte.com/v1/data/read/bunar1?limit=50")
    .then(res => res.json())
    .then(data => {
      lastData1 = data.map(d => ({ x: new Date(d.timestamp), y: parseFloat(d.data) }));
      updateChart(chart1, lastData1);
      updateCurrentValue("vrednost1", lastData1, 1.0);
    });

  fetch("https://api.beebotte.com/v1/data/read/bunar2?limit=50")
    .then(res => res.json())
    .then(data => {
      lastData2 = data.map(d => ({ x: new Date(d.timestamp), y: parseFloat(d.data) }));
      updateChart(chart2, lastData2);
      updateCurrentValue("vrednost2", lastData2, 1.0);
    });
}

window.onload = () => {
  chart1 = createChart(document.getElementById("chart1"), "Bunar 1");
  chart2 = createChart(document.getElementById("chart2"), "Bunar 2");
  refresh();
  setInterval(refresh, 60000);
};

