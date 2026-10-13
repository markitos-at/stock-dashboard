// ------------------------
// Helper functions
// ------------------------
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}


function getFormattedDateEu() {
    const now = new Date();

    const day = now.getDate();
    const month = now.getMonth() + 1; // JS months start at 0

    return `${day}.${month}.`;
}

function formatExpiry(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function getDTE(dateString) {
    // return amount of DTE 
    // from today to the options expiry date
    if (!dateString) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(dateString);
    expiry.setHours(0, 0, 0, 0);

    const diff =
        Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    return Math.max(0, diff);
}