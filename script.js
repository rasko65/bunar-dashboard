async function fetchData(resource) {
  const response = await fetch(`https://api.beebotte.com/v1/data/read/${resource}?limit=50`);
  const data = await response.json();
  return data.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString("sr-RS"),
    value: parseFloat(entry.data)
  }));
}

function renderChart(canvasId, label, dataPoints, yMax, minLine = null) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const labels = dataPoints.map(dp => dp.time);
  const values = dataPoints.map(dp => dp.value);

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: "#00bcd4",
          backgroundColor: "rgba(0, 188, 212, 0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: yMax,
          title: {
            display: true,
            text: "Nivo vode (m)"
          }
        }
      },
      plugins: {
        annotation: minLine
          ? {
              annotations: {
                minThreshold: {
                  type: "line",
                  yMin: minLine,
                  yMax: minLine,
                  borderColor: "red",
                  borderWidth: 2,
                  label: {
                    content: `Minimum: ${minLine}m`,
                    enabled: true,
                    position: "start",
                    backgroundColor: "rgba(255,0,0,0.7)",
                    color: "#fff"
                  }
                }
              }
            }
          : {}
      }
    }
  };

  new Chart(ctx, chartConfig);
}

async function init() {
  const bunar1Data = await fetchData("bunar1");
  renderChart("chartBunar1", "Bunar 1", bunar1Data, 10);

  const bunar2Data = await fetchData("bunar2");
  renderChart("chartBunar2", "Bunar 2", bunar2Data, 4, 0.6);
}

init();


