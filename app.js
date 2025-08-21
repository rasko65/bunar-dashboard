async function fetchData(channel, resource, token) {
  const url = `https://api.beebotte.com/v1/history/${channel}/${resource}?limit=50`;
  const headers = { 'X-Auth-Token': token };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API greška (${response.status}):`, errorText);

      const errorBox = document.getElementById('errorBox');
      if (errorBox) {
        errorBox.textContent = `Greška: ${response.status} – ${errorText}`;
        errorBox.style.display = 'block';
      }

      
      return [];
    }

    const rawData = await response.json();
    console.log(`📦 Raw podaci za ${resource}:`, rawData);

    const parsedData = rawData.map(entry => ({
      x: new Date(entry.timestamp),
      y: Number(entry.data)
    }));

    return parsedData;
  } catch (error) {
    console.error(`❌ Fetch error za ${resource}:`, error);
    return [];
  }
}

function renderChart(canvasId, data, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`❌ Canvas ${canvasId} nije pronađen`);
    return;
  }

  new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [{
        label,
        data,
        borderColor: color,
        fill: false,
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

function updateCurrentValue(elementId, data) {
  const value = data[data.length - 1]?.y;
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = value !== undefined ? value.toFixed(2) : 'N/A';
  }
}

async function initDashboard() {
  const token = 'token_dlVQqzrALZ6DsGjF;
  const channel = 'nivoi_bunara';

  const bunar1Data = await fetchData(channel, 'bunar1', token);
  const bunar2Data = await fetchData(channel, 'bunar2', token);

  renderChart('chartBunar1', bunar1Data, 'Bunar 1', '#00bcd4');
  renderChart('chartBunar2', bunar2Data, 'Bunar 2', '#ff9800');

  updateCurrentValue('valueBunar1', bunar1Data);
  updateCurrentValue('valueBunar2', bunar2Data);
}

// Automatski refresh na svakih 60 sekundi
initDashboard();
setInterval(initDashboard, 60000);

