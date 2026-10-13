// ========================
// Local Storage functions
// ========================
// ------------------------
// Cache
// ------------------------
function getCache() {
    return JSON.parse(localStorage.getItem("stockCache")) || {};
}

function saveCache(data) {
    // console.log('stockCache.saved');
    localStorage.setItem("stockCache", JSON.stringify(data));
}

// ------------------------
// Base prices
// ------------------------
function getBasePrices() {
    return JSON.parse(localStorage.getItem("stockBase")) || {};
}

function saveBasePrices(data) {
    // console.log('basePrice.saved');
    localStorage.setItem("stockBase", JSON.stringify(data));
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
// Owned shares/contracts
// ------------------------
function getOwned() {
    // owned stocks
    return JSON.parse(localStorage.getItem("stockOwned")) || {};
}

function saveOwned(data) {
    // save owned stocks
    localStorage.setItem("stockOwned", JSON.stringify(data));
}

function addOwned(ticker, amount) {
    const owned = getOwned();
    owned[ticker] = parseInt(amount);
    saveOwned(owned);
}

function addOwnedContract(ticker) {
    const owned = getOwned();

    if (!owned[ticker]) return;

    owned[ticker]++;

    saveOwned(owned);
    loadStocks();
}

function removeOwnedContract(ticker) {
    const owned = getOwned();

    if (!owned[ticker]) return;

    owned[ticker]--;

    if (owned[ticker] <= 0) {
        delete owned[ticker];
    }

    saveOwned(owned);
    loadStocks();
}

function deleteOwned(ticker) {
    const owned = getOwned();

    if (!owned[ticker]) return;
    delete owned[ticker];

    saveOwned(owned);
    loadStocks();
}