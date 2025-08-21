async function fetchData(channel, resource, token) {
  const url = `https://api.beebotte.com/v1/history/${channel}/${resource}?limit=100`;
  const headers = {
    'X-Auth-Token': token
  };

  try {
    const response = await fetch(url, { headers });
    const rawData = await response.json();

    console.log(`📦 Raw podaci za ${resource}:`, rawData);

    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.warn(`⚠️ Nema podataka za ${resource}`);
      return [];
    }

    const parsedData = rawData.map(entry => ({
      x: new Date(entry.timestamp),
      y: Number(entry.data)
    }));

    console.log(`✅ Parsirani podaci za ${resource}:`, parsedData);
    return parsedData;
  } catch (error) {
    console.error(`❌ Greška pri fetchovanju ${resource}:`, error);
    return [];
  }
}

function renderChart(canvasId, data, label, color) {
  const canvas = document.getElementById(canvasId);
  console.log(`🖼️ Canvas za ${canvasId}:`, canvas);

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
  console.log(`📍 Trenutna vrednost za ${elementId}:`, value);

  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = value !== undefined ? value.toFixed(2) : 'N/A';
  } else {
    console.warn(`⚠️ Element ${elementId} nije pronađen`);
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

initDashboard();


