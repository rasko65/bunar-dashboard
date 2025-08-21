const API_KEY = "token_dlVQqzrALZ6DsGjF"; // zameni svojim Beebotte tokenom
const CHANNEL = "nivoi_bunara";
const RESOURCE1 = "bunar1";
const RESOURCE2 = "bunar2";

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

setInterval(fetchData, 5000); // automatski refresh svakih 5 sekundi
fetchData(); // prvi poziv odmah

