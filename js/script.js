const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNyk88km-5bG4EIzBNezvRHjmiZS4roGe_l3hb_0dexC_l4yC25shHbmxsmqWP3GUBdYU466lnaGok/pub?output=csv";

// ------------------------
// Owned shares/contracts
// ------------------------
function populateOwnedTickerSelect() {
    const select = document.getElementById("ownedTickerInput");
    const cache = getCache();

    const tickers = Object.keys(cache).sort();

    select.innerHTML = ""; // clear old options

    // placeholder
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select ticker";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    tickers.forEach(ticker => {
        const opt = document.createElement("option");
        opt.value = ticker;
        opt.textContent = ticker;
        select.appendChild(opt);
    });
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
        const formattedExpiry = formatExpiry(expiry);
        const dte = getDTE(expiry);

        expiryEl.textContent = "("+formattedExpiry+" | "+dte+" DTE )";

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
// Render owned list
// ------------------------
function renderOwnedList() {

    const container = document.getElementById("ownedList");
    const owned = getOwned();

    container.innerHTML = "";

    const tickers = Object.keys(owned);

    if (tickers.length === 0)
        return;

    // section toggle header
    const toggle = document.createElement("button");
    toggle.className = "section-owned-toggle";

    const icon = document.createElement("span");
    icon.className = "toggle-icon";
    icon.textContent = "▶";

    const title = document.createElement("span");
    title.className = "toggle-title";
    title.textContent = `Owned Shares (${tickers.length})`;

    toggle.appendChild(icon);
    toggle.appendChild(title);

    container.appendChild(toggle);

    // content wrapper for toggle
    const content = document.createElement("div");
    content.className = "section-owned-content";

    // toggle behaviour
    toggle.onclick = () => {
        //console.log('toggle.onClick.click');
        toggle.classList.toggle("expanded");
        content.classList.toggle("expanded");
    };

    // sort tickers
    tickers.sort();

    tickers.forEach(ticker => {

        const row = document.createElement("div");
        row.className = "owned-row text-left";

        // Left side
        const left = document.createElement("div");

        const tickerEl = document.createElement("div");
        tickerEl.innerHTML = `<strong>${ticker}</strong>`;

        const bottom = document.createElement("div");
        bottom.className = "owned-bottom";

        const amount = document.createElement("span");
        const qty = owned[ticker];

        amount.className = "owned-contracts";
        amount.textContent = `${qty} contract${qty > 1 ? "s" : ""}`;

        // +
        const addBtn = document.createElement("button");
        addBtn.className = "owned-btn plus";
        addBtn.textContent = "+";
        addBtn.onclick = () => addOwnedContract(ticker);

        // -
        const minusBtn = document.createElement("button");
        minusBtn.className = "owned-btn minus";
        minusBtn.textContent = "−";
        minusBtn.onclick = () => removeOwnedContract(ticker);

        bottom.appendChild(amount);
        bottom.appendChild(minusBtn);
        bottom.appendChild(addBtn);

        left.appendChild(tickerEl);
        left.appendChild(bottom);

        // X button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.onclick = () => deleteOwned(ticker);

        row.appendChild(left);
        row.appendChild(deleteBtn);

        content.appendChild(row);
    });

    container.appendChild(content);
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
        const cache = getCache();
        const rows = rowsText.split("\n").slice(1);

        rows.forEach(row => {
            if (!row) return;

            const [ticker, price] = row.split(",");
            const numPrice = parseFloat(price);

            if (!isNaN(numPrice)) {
                // if it is a number update cache
                cache[ticker] = numPrice;
            } else {
                console.log('Using cached value for ', ticker);
            }
        });

        saveCache(cache);
        updateStatus("live");
        console.log("liveData.loaded");
        populateOwnedTickerSelect(); // add ticker to form select field
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
        populateOwnedTickerSelect();
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
        const changeDollar = currentPrice - basePrice;
        const isUp = changeNum >= 0;

        const arrow = isUp ? "▲" : "▼";
        const formattedChange =
            (isUp ? "+" : "") + changeDollar.toFixed(2) +
            " (" +
            (changeNum * 100).toFixed(2) +
            "%)";

        const statusClass = isUp ? "up" : "down";

        // ------------------------
        // Create STOCK element
        // ------------------------

        const stockEl = document.createElement("div");

        const owned = getOwned();
        const contractsOwned = owned[ticker] || 0;
        const stockOptions = getOptions()[ticker] || [];
        const coveredCalls = stockOptions.filter(o => o.type === "CALL").length;

        stockEl.classList.add("stock");
        stockEl.classList.add(statusClass);

        if (contractsOwned > coveredCalls) {
            // adding class to indicate call selling possible
            stockEl.classList.add("needs-call");
        }


        const left = document.createElement("div");
        left.classList.add("text-left");

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
        // Append OPTION possibilities
        // ------------------------
        if (contractsOwned > coveredCalls) {
            const warning = document.createElement("div");
            warning.className = "call-warning text-left";
            warning.textContent = `🟡 ${contractsOwned - coveredCalls} CC available`;
            container.appendChild(warning);
        }

        // ------------------------
        // Append OPTIONS
        // ------------------------

        const optionsEl = renderOptionsElement(ticker, currentPrice);

        if (optionsEl) {
            container.appendChild(optionsEl);
        }
    });

    saveBasePrices(basePrices);

    renderOwnedList();
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
const ownedForm = document.getElementById("ownedForm");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    let ticker = document.getElementById("tickerInput").value.trim().toUpperCase(); // Ticker name
    const type = document.getElementById("typeInput").value; // CALL or PUT
    const strike = parseFloat(document.getElementById("strikeInput").value); // number
    const expiry = document.getElementById("expiryInput").value; // getting date input

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

    // // hide form again (optional UX)
    // form.classList.add("hidden"); 

    // re-render UI
    loadStocks();
});


ownedForm.addEventListener("submit", e => {

    e.preventDefault();

    const ticker =
        document
            .getElementById("ownedTickerInput")
            .value
            .trim()
            .toUpperCase();

    const amount = document.getElementById("ownedAmountInput").value;

    if (!ticker.match(/^[A-Z]{1,5}$/)) {
        alert("Invalid ticker");
        return;
    }

    const cache = getCache();

    if (!cache[ticker]) {
        alert("Ticker not in list");
        return;
    }

    addOwned(ticker, amount);

    ownedForm.reset();

    loadStocks();

});

tickerInput.addEventListener("input", (e) => {
    // make sure input is capital letters
    e.target.value = e.target.value.toUpperCase();
});


// ------------------------
// Import Export functionality
// ------------------------
document.getElementById("exportBtn").addEventListener("click", () => {
    const options = getOptions();

    const json = JSON.stringify(options, null, 2);

    document.getElementById("exportOutput").value = json;
});

document.getElementById("copyBtn").addEventListener("click", async () => {
    const textarea = document.getElementById("exportOutput");

     try {
        // Direct replacement for document.execCommand("copy")
        await navigator.clipboard.writeText(textarea.value);
        alert("Copied!");
    } catch (err) {
        console.error("Failed to copy text: ", err);
        alert("Could not copy text. Please try again.");
    }

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