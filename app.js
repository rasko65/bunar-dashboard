async function fetchLastValue(channel, resource, token) {
  const url = `https://api.beebotte.com/v1/data/${channel}/${resource}/last`;
  const headers = { 'X-Auth-Token': token };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API greška (${response.status}):`, errorText);
      return null;
    }

    const raw = await response.json();
    console.log(`📍 Last za ${resource}:`, raw);
    return Number(raw.data);
  } catch (error) {
    console.error(`❌ Fetch error za ${resource}:`, error);
    return null;
  }
}

async function initDashboard() {
  const token = 'token_dlVQqzrALZ6DsGjF';
  const channel = 'nivoi_bunara';

  const bunar1Value = await fetchLastValue(channel, 'bunar1', token);
  const bunar2Value = await fetchLastValue(channel, 'bunar2', token);

  const el1 = document.getElementById('valueBunar1');
  const el2 = document.getElementById('valueBunar2');

  if (el1) el1.textContent = bunar1Value !== null ? bunar1Value.toFixed(2) : 'N/A';
  if (el2) el2.textContent = bunar2Value !== null ? bunar2Value.toFixed(2) : 'N/A';
}

initDashboard();
setInterval(initDashboard, 60000);



