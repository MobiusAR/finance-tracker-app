const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        console.log("Fetching quotes...");
        const quotes = await yahooFinance.quote(['CSPX.L', 'USDSGD=X', 'GBPSGD=X']);
        console.log(JSON.stringify(quotes, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
