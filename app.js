const CHANNEL = "nivoi_bunara";
const TOKEN = "token_dlVQqzrALZ6DsGjF";

function fetchData(resource) {
  const url = `https://api.beebotte.com/v1/history/${CHANNEL}/${resource}?limit=50`;
  return fetch(url, {
    headers: { "X-Auth-Token": TOKEN }
  })
    .then(res => res.json())
    .then(data => data.map(entry => ({
      x: new Date(entry.timestamp),
      y: entry.data
    })));
}

function renderChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: canvasId,
        data,
        borderColor: "#00bfff",
        backgroundColor: "transparent",
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: { unit: "minute" }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateCurrentValue(bunarId, value, minimum) {
  const el = document.getElementById(`${bunarId}-vrednost`);
  if (!el) return;

  el.textContent = `${value.toFixed(2)} m`;

  if (value < minimum) {
    el.classList.remove("normal");
    el.classList.add("low");
  } else {
    el.classList.remove("low");
    el.classList.add("normal");
  }
}

function refresh() {
  fetchData("bunar1").then(data1 => {
    renderChart("bunar1-chart", data1);
    const last1 = data1[data1.length - 1]?.y || 0;
    updateCurrentValue("bunar1", last1, 4.0);
  });

  fetchData("bunar2").then(data2 => {
    renderChart("bunar2-chart", data2);
    const last2 = data2[data2.length - 1]?.y || 0;
    updateCurrentValue("bunar2", last2, 0.6);
  });
}

document.addEventListener("DOMContentLoaded", refresh);



