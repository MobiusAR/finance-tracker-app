import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    console.log(await yahooFinance.quote(['JD']));
}
test();
