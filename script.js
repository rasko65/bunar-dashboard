const CHANNEL = "nivoi_bunara";
const RESOURCE1 = "bunar1";
const RESOURCE2 = "bunar2";
const MIN1 = 4.0;
const MIN2 = 0.6;
const token = "token_dlVQqzrALZ6DsGjF";

const chart1 = document.getElementById("chart1").getContext("2d");
const chart2 = document.getElementById("chart2").getContext("2d");
let myChart1, myChart2;

function formatTime(date) {
  return date.toISOString();
}

function getTimeRange(hoursBack = 1) {
  const to = new Date();
  const from = new Date(to.getTime() - hoursBack * 60 * 60 * 1000);
  return { from: formatTime(from), to: formatTime(to) };
}

async function checkBeebotteResources(channel, resources, fromTime, toTime, token) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': token
  };

  for (const resource of resources) {
    const url = `https://api.beebotte.com/v1/history/read/${channel}/${resource}?from=${fromTime}&to=${toTime}`;
    try {
      const response = await fetch(url, { headers });
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          console.warn(`⚠️ '${resource}' ne vraća niz.`);
        } else {
          console.log(`✅ '${resource}' je dostupan.`);
        }
      } catch (jsonError) {
        console.error(`❌ '${resource}' ne vraća validan JSON.`, text);
      }
    } catch (err) {
      console.error(`❌ Greška za '${resource}':`, err);
    }
  }
}

async function writeTestData(channel, resource, value, token) {
  const url = `https://api.beebotte.com/v1/data/write`;
  const payload = {
    channel,
    resource,
    data: value,
    store: true
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": token
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Upisano u '${resource}':`, value);
    } else {
      const text = await response.text();
      console.error(`❌ Greška pri upisu u '${resource}':`, text);
    }
  } catch (err) {
    console.error(`❌ Network greška pri upisu u '${resource}':`, err);
  }
}

async function fetchData() {
  const hours = parseInt(document.getElementById("rangeSelector").value);
  const { from, to } = getTimeRange(hours);
  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': token
  };

  const urls = [
    `https://api.beebotte.com/v1/history/read/${CHANNEL}/${RESOURCE1}?from=${from}&to=${to}`,
    `https://api.beebotte.com/v1/history/read/${CHANNEL}/${RESOURCE2}?from=${from}&to=${to}`
  ];

  try {
    const [res1Raw, res2Raw] = await Promise.all(urls.map(url => fetch(url, { headers }).then(r => r.text())));
    const data1 = JSON.parse(res1Raw);
    const data2 = JSON.parse(res2Raw);

    if (!Array.isArray(data1) || !Array.isArray(data2)) {
      console.warn("⚠️ Podaci nisu nizovi. Preskačem update.");
      return;
    }

    updateCharts(data1, data2);
    updateValues(data1, data2);
  } catch (err) {
    console.error("Greška pri čitanju:", err);
  }
}

function updateCharts(data1, data2) {
  const labels = data1.map(d => new Date(d.timestamp).toLocaleTimeString());
  const values1 = data1.map(d => d.data);
  const values2 = data2.map(d => d.data);

  if (myChart1) myChart1.destroy();
  if (myChart2) myChart2.destroy();

  myChart1 = new Chart(chart1, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Bunar 1",
        data: values1,
        borderColor: values1[values1.length - 1] < MIN1 ? "red" : "blue",
        fill: false
      }]
    }
  });

  myChart2 = new Chart(chart2, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Bunar 2",
        data: values2,
        borderColor: values2[values2.length - 1] < MIN2 ? "red" : "green",
        fill: false
      }]
    }
  });
}

function updateValues(data1, data2) {
  const val1 = data1[data1.length - 1]?.data ?? "N/A";
  const val2 = data2[data2.length - 1]?.data ?? "N/A";

  document.getElementById("value1").textContent = val1.toFixed(2);
  document.getElementById("value2").textContent = val2.toFixed(2);

  document.getElementById("value1").style.color = val1 < MIN1 ? "red" : "white";
  document.getElementById("value2").style.color = val2 < MIN2 ? "red" : "white";
}

function exportCSV(data1, data2) {
  let csv = "timestamp,bunar1,bunar2\n";
  for (let i = 0; i < data1.length; i++) {
    const t = new Date(data1[i].timestamp).toISOString();
    const v1 = data1[i].data;
    const v2 = data2[i]?.data ?? "";
    csv += `${t},${v1},${v2}\n`;
  }

  const blob

