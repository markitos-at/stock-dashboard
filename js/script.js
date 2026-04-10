const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNyk88km-5bG4EIzBNezvRHjmiZS4roGe_l3hb_0dexC_l4yC25shHbmxsmqWP3GUBdYU466lnaGok/pub?output=csv";

// ------------------------
// Storage helpers
// ------------------------
function getToday() {
    return new Date().toISOString().split("T")[0];
}

function getBasePrices() {
    return JSON.parse(localStorage.getItem("stockBase")) || {};
}

function saveBasePrices(data) {
    console.log('basePrice.saved');
    localStorage.setItem("stockBase", JSON.stringify(data));
}

function getCache() {
    return JSON.parse(localStorage.getItem("stockCache")) || {};
}

function saveCache(data) {
    console.log('stockCache.saved');
    localStorage.setItem("stockCache", JSON.stringify(data));
}

// ------------------------
// Main loading function
// ------------------------
async function loadStocks() {
  const container = document.getElementById("stocks");

  let rowsText = "";
  let isLive = true;

  try {
    const res = await fetch(SHEET_URL);
    rowsText = await res.text();

    // ------------------------
    // Build cache from live data
    // ------------------------
    const cache = {};
    const rows = rowsText.split("\n").slice(1);

    rows.forEach(row => {
      if (!row) return;

      const [ticker, price] = row.split(",");
      const numPrice = parseFloat(price);

      if (!isNaN(numPrice)) {
        cache[ticker] = numPrice;
      }
    });

    saveCache(cache);
    console.log("liveData.loaded");
  } catch (err) {
    console.log("fetchFailed.usingCache");
    isLive = false;

    const cached = getCache();

    if (!cached || Object.keys(cached).length === 0) {
      container.innerHTML = "⚠️ No data available";
      return;
    }

    // rebuild fake rows from cache
    rowsText = Object.entries(cached)
      .map(([ticker, price]) => `${ticker},${price}`)
      .join("\n");
  }


  // ------------------------
  // Base price logic (daily reset)
  // ------------------------
  const today = getToday();
  const storedDate = localStorage.getItem("stockDate");

  let basePrices = getBasePrices();

  if (storedDate !== today) {
    basePrices = {};
    localStorage.setItem("stockDate", today);
  }


  // ------------------------
  // Render UI
  // ------------------------
  const rows = rowsText.split("\n").slice(0);
  container.innerHTML = "";

  rows.forEach(row => {
    if (!row) return;

    const [ticker, price] = row.split(",");
    const currentPrice = parseFloat(price);

    if (isNaN(currentPrice)) return;

    // set base price if missing
    if (!basePrices[ticker]) {
      basePrices[ticker] = currentPrice;
    }

    const basePrice = basePrices[ticker];

    const changeNum = (currentPrice - basePrice) / basePrice;
    const isUp = changeNum >= 0;

    const arrow = isUp ? "▲" : "▼";
    const formattedChange =
      `${isUp ? "+" : ""}${(changeNum * 100).toFixed(2)}%`;

    const statusClass = isUp ? "up" : "down";

    // ------------------------
    // html output
    // ------------------------
    container.innerHTML += `
      <div class="stock ${statusClass}">
        <div>
          <div class="ticker">${ticker}</div>
          <div class="change ${statusClass}">
            ${arrow} ${formattedChange}
          </div>
        </div>

        <div class="price">
          $${currentPrice.toFixed(2)}
        </div>
      </div>
    `;
  });

  saveBasePrices(basePrices);

  console.log(isLive ? "LIVEdata.rendered" : "CACHEdata.rendered");
}

// ------------------------
// Init
// ------------------------
loadStocks();
setInterval(loadStocks, 90000); // 90 sec

