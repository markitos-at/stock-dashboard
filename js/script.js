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
// Options storage
// ------------------------
function getOptions() {
    return JSON.parse(localStorage.getItem("stockOptions")) || {};
}

function saveOptions(data) {
    localStorage.setItem("stockOptions", JSON.stringify(data));
}

function addOption(ticker, type, strike, expiry) {
    const options = getOptions();

    ticker = ticker.toUpperCase();

    if (!options[ticker]) {
        options[ticker] = [];
    }

    options[ticker].push({
        type,
        strike: parseFloat(strike),
        expiry
    });

    saveOptions(options);
}

function deleteOption(ticker, index) {
    //if (!confirm("Delete this option?")) return;

    const options = getOptions();

    if (!options[ticker]) return;

    options[ticker].splice(index, 1);

    // clean up empty arrays
    if (options[ticker].length === 0) {
        delete options[ticker];
    }

    saveOptions(options);

    loadStocks(); // re-render
}


// ------------------------
// Options UI - Render options per Ticker
// ------------------------
function renderOptionsElement(ticker, currentPrice) {
    const options = getOptions();
    const stockOptions = options[ticker];

    if (!stockOptions || stockOptions.length === 0) return null;

    const wrapper = document.createElement("div");
    wrapper.className = "options";

    stockOptions.forEach((opt, index) => {
        const { type, strike, expiry } = opt;

        let statusClass = "neutral";
        let label = "";

        if (type === "CALL") {
            statusClass = currentPrice > strike ? "danger" : "safe";
            label = currentPrice > strike ? "ITM" : "OTM";
        }

        if (type === "PUT") {
            statusClass = currentPrice < strike ? "danger" : "safe";
            label = currentPrice < strike ? "ITM" : "OTM";
        }

        const distance = ((strike - currentPrice) / currentPrice) * 100;
        const formattedDistance =
            `${distance >= 0 ? "+" : ""}${distance.toFixed(1)}%`;

        // ------------------------
        // Option element
        // ------------------------

        const optionEl = document.createElement("div");
        optionEl.className = `option ${statusClass}`;

        const left = document.createElement("div");
        left.textContent = `${type} ${strike}`;

        const expiryEl = document.createElement("span");
        expiryEl.className = "expiry";
        expiryEl.textContent = ` (${expiry})`;

        left.appendChild(expiryEl);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${label} | ${formattedDistance}`;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";

        deleteBtn.addEventListener("click", () => {
            deleteOption(ticker, index);
        });

        optionEl.appendChild(left);
        optionEl.appendChild(meta);
        optionEl.appendChild(deleteBtn);

        wrapper.appendChild(optionEl);
    });

    return wrapper;
}

// ------------------------
// Status display function
// ------------------------
function updateStatus(type) {
    const statusEl = document.querySelector("#statusBar .status");

    // reset classes
    statusEl.classList.remove("live", "cache", "error");

    if (type === "live") {
        statusEl.textContent = "Live data";
        statusEl.classList.add("live");
    }

    if (type === "cache") {
        statusEl.textContent = "Cached data (offline)";
        statusEl.classList.add("cache");
    }

    if (type === "error") {
        statusEl.textContent = "No data available";
        statusEl.classList.add("error");
    }
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
        updateStatus("live");
        console.log("liveData.loaded");
    } catch (err) {
        isLive = false;

        const cached = getCache();

        if (!cached || Object.keys(cached).length === 0) {
            container.innerHTML = "⚠️ No data available";
            updateStatus("error");
            return;
        }

        // rebuild rows from cache
        rowsText = Object.entries(cached)
            .map(([ticker, price]) => `${ticker},${price}`)
            .join("\n");

        updateStatus("cache");
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

        // base price
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
        // Create STOCK element
        // ------------------------

        const stockEl = document.createElement("div");
        stockEl.className = `stock ${statusClass}`;

        const left = document.createElement("div");

        const tickerEl = document.createElement("div");
        tickerEl.className = "ticker";
        tickerEl.textContent = ticker;

        const changeEl = document.createElement("div");
        changeEl.className = `change ${statusClass}`;
        changeEl.textContent = `${arrow} ${formattedChange}`;

        left.appendChild(tickerEl);
        left.appendChild(changeEl);

        const priceEl = document.createElement("div");
        priceEl.className = "price";
        priceEl.textContent = `$${currentPrice.toFixed(2)}`;

        stockEl.appendChild(left);
        stockEl.appendChild(priceEl);

        container.appendChild(stockEl);

        // ------------------------
        // Append OPTIONS
        // ------------------------

        const optionsEl = renderOptionsElement(ticker, currentPrice);

        if (optionsEl) {
            container.appendChild(optionsEl);
        }
    });

    saveBasePrices(basePrices);
}

// ------------------------
// Init
// ------------------------
loadStocks();
setInterval(loadStocks, 90000); // 90 sec



// ------------------------
// Form logic
// ------------------------
const form = document.getElementById("optionForm");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    let ticker = document.getElementById("tickerInput").value.trim().toUpperCase();
    const type = document.getElementById("typeInput").value;
    const strike = parseFloat(document.getElementById("strikeInput").value);
    const expiryRaw = document.getElementById("expiryInput").value.trim();
    const expiry = escapeHTML(expiryRaw).substring(0, 20);

    if (!ticker || !strike) {
        alert("Ticker and strike required");
        return;
    }

    if (!ticker.match(/^[A-Z]{1,5}$/)) {
        alert("Invalid ticker");
        return;
    }

    const cache = getCache();
    if (!cache[ticker]) {
        alert("Ticker not in your list");
        return;
    }

    if (isNaN(strike) || strike < 1 || strike > 10000) {
        alert("Invalid strike");
        return;
    }

    addOption(ticker, type, strike, expiry);

    // reset form
    form.reset();

    // hide form again (optional UX)
    form.classList.add("hidden");

    // re-render UI
    loadStocks();
});

tickerInput.addEventListener("input", (e) => {
    // make sure input is capital letters
    e.target.value = e.target.value.toUpperCase();
});

// ------------------------
// Helper function
// ------------------------
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

function scrollToSection(el) {
    el.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ------------------------
// Import Export functionality
// ------------------------
document.getElementById("exportBtn").addEventListener("click", () => {
    const options = getOptions();

    const json = JSON.stringify(options, null, 2);

    document.getElementById("exportOutput").value = json;
});

document.getElementById("copyBtn").addEventListener("click", () => {
    const textarea = document.getElementById("exportOutput");

    textarea.select();
    document.execCommand("copy");

    alert("Copied!");
});

document.getElementById("importBtn").addEventListener("click", () => {
    const input = document.getElementById("importInput").value.trim();

    if (!input) return;

    try {
        const parsed = JSON.parse(input);

        // basic validation
        if (typeof parsed !== "object") {
            throw new Error("Invalid format");
        }

        // sanitize values
        for (const ticker in parsed) {
            parsed[ticker] = parsed[ticker].map(opt => ({
                type: opt.type,
                strike: parseFloat(opt.strike),
                expiry: escapeHTML(String(opt.expiry || ""))
            }));
        }

        localStorage.setItem("stockOptions", JSON.stringify(parsed));

        alert("Import successful!");

        loadStocks();

    } catch (err) {
        alert("Invalid JSON format");
        console.error(err);
    }
});

const importExportSection = document.getElementById("importExportSection");
const toggleImportExportBtn = document.getElementById("toggleImportExportBtn");

// existing form refs
const formAddOpt = document.getElementById("sectionAddOption");
const toggleFormBtn = document.getElementById("toggleFormBtn");


// Toggle Add Option
toggleFormBtn.addEventListener("click", () => {
    const isHidden = formAddOpt.classList.contains("hidden");

    // close both first
    formAddOpt.classList.add("hidden");
    importExportSection.classList.add("hidden");

    // then open if it was closed
    if (isHidden) {
        formAddOpt.classList.remove("hidden");

        // scroll to AFTER display
        setTimeout(() => {
            scrollToSection(formAddOpt);
            document.getElementById("tickerInput").focus();
        }, 50);
    }
});


// Toggle Import/Export
toggleImportExportBtn.addEventListener("click", () => {
    const isHidden = importExportSection.classList.contains("hidden");

    formAddOpt.classList.add("hidden");
    importExportSection.classList.add("hidden");

    if (isHidden) {
        importExportSection.classList.remove("hidden");

        setTimeout(() => {
            scrollToSection(importExportSection);
        }, 50);
    }
});