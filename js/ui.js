// ------------------------
// Status display function
// ------------------------
function updateStatus(type) {
    const statusEl = document.querySelector("#statusBar .status");
    const dateEl = document.querySelector("#statusBar .date");

    // reset classes
    statusEl.classList.remove("live", "cache", "error");

    const dateStr = getFormattedDateEu();

    if (type === "live") {
        statusEl.textContent = "Live data";
        statusEl.classList.add("live");
    }

    if (type === "cache") {
        statusEl.textContent = "Cached data";
        statusEl.classList.add("cache");
    }

    if (type === "error") {
        statusEl.textContent = "No data";
        statusEl.classList.add("error");
    }

    // update date
    dateEl.textContent = dateStr;
}

// ------------------------
// Scroll behaviour
// ------------------------
function scrollToSection(el) {
    el.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ------------------------
// Toggle form sections
// ------------------------
// Import export references
const sectionImportExport = document.getElementById("importExportSection");
const toggleImportExportBtn = document.getElementById("toggleImportExportBtn");

// Option form references
const sectionAddOpt = document.getElementById("sectionAddOption");
const toggleFormBtn = document.getElementById("toggleFormBtn");

// Ownde form references
const sectionOwned = document.getElementById("sectionOwned");
const toggleOwnedBtn = document.getElementById("toggleOwnedBtn");

// Toggle Add Option
toggleFormBtn.addEventListener("click", () => {
    const isHidden = sectionAddOpt.classList.contains("hidden");

    // close all toggle sections first
    sectionOwned.classList.add("hidden");
    sectionAddOpt.classList.add("hidden");
    sectionImportExport.classList.add("hidden");

    // then open if it was closed
    if (isHidden) {
        sectionAddOpt.classList.remove("hidden");

        // scroll to AFTER display
        setTimeout(() => {
            scrollToSection(sectionAddOpt);
            document.getElementById("tickerInput").focus();
        }, 50);
    }
});


// Toggle Import/Export
toggleImportExportBtn.addEventListener("click", () => {
    const isHidden = sectionImportExport.classList.contains("hidden");

    sectionOwned.classList.add("hidden");
    sectionAddOpt.classList.add("hidden");
    sectionImportExport.classList.add("hidden");

    if (isHidden) {
        sectionImportExport.classList.remove("hidden");

        setTimeout(() => {
            scrollToSection(sectionImportExport);
        }, 50);
    }
});

// Toggle Owned Form
toggleOwnedBtn.addEventListener("click", () => {

    const isHidden = sectionOwned.classList.contains("hidden");

    sectionOwned.classList.add("hidden");
    sectionAddOpt.classList.add("hidden");
    sectionImportExport.classList.add("hidden");

    if (isHidden) {
        sectionOwned.classList.remove("hidden");
        setTimeout(() => {
            scrollToSection(sectionOwned);
            document.getElementById("ownedTickerInput").focus();
        }, 50);
    }

});