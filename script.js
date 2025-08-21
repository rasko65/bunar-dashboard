const TOKEN = "token_dlVQqzrALZ6DsGjF"; // zameni sa pravim tokenom
const CHANNEL = "nivoi_bunara";  // zameni sa tačnim imenom kanala

function fetchAndRender(resource, canvasId, label) {
  const API_URL = `https://api.beebotte.com/v1/data/read/${CHANNEL}/${resource}?limit=50`;

  fetch(API_URL, {
    method: "GET",
    headers: {
      "X-Auth-Token": TOKEN
    }
  })
  .then(response => {
    if (!response.ok) throw new Error(`Greška: ${response.status}`);
    return response.json();
  })
  .then(data => {
    const timestamps = data.map(entry => new Date(entry.timestamp).toLocaleTimeString());
    const values = data.map(entry => entry.data);

    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: timestamps,
        datasets: [{
          label: label,
          data: values,
          borderColor: "#00bcd4",
          backgroundColor: "rgba(0, 188, 212, 0.2)",
          fill: true,
          tension: 0.3
        }]
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
  })
  .catch(error => {
    console.error(`❌ ${label} - greška:`, error.message);
  });
}

fetchAndRender("bunar1", "chartBunar1", "Bunar 1");
fetchAndRender("bunar2", "chartBunar2", "Bunar 2");


