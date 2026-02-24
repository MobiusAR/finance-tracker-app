const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    console.log(await yahooFinance.quote(['JD']));
}
test();
