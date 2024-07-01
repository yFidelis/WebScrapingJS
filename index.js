const puppeteer= require('puppeteer');
const fs = require('fs');
const path = require('path');


(async () => {
    const browser = await puppeteer.launch({
    headless: true, //Default
    args: [
        '--no-sandbox',
        '--disable-gpu' 
        ]
    });

    const page = await browser.newPage();

    await page.setViewport({width: 1366, height: 768});

    const response = await page.goto('https://www.flashscore.com/');
    if (response.ok()){
        console.log('Página criada com sucesso');
        await scrapeData(page);
    } else {
        console.log('Página 404.');
    }

    await browser.close();
})();

const start = Date.now();
async function scrapeData(page){
    await page.waitForSelector('button.calendar__navigation--yesterday');
    console.log('Botão encontrado com sucesso');

    await page.click('button.calendar__navigation--yesterday');
    console.log('Click com sucesso');

    await page.waitForSelector('div.filters__text--default');
    console.log('Tab odds carregada com sucesso');

    const finishedButton = (await page.$$('div.filters__text--default'))[1];
    //console.log('finishedButton');
    await finishedButton.click();

    await page.waitForSelector('div.event__match--twoLine');
    console.log('Carregar os times com sucesso');

    const dados = {
        HOME: [],
        AWAY: [],
        FTHG: [],
        FTAG: []

    }

    const eventos = await page.$$('div.event__match--twoLine');
    
    for (evento of eventos) {
        try {
            const home = await evento.$eval('div.event__homeParticipant', el => el.innerText);
            const away = await evento.$eval('div.event__awayParticipant', el => el.innerText);
            const fthg = await evento.$eval('div.event__score--home', el => el.innerText);
            const ftag = await evento.$eval('div.event__score--away', el => el.innerText);
            
            dados.HOME.push(home);
            dados.AWAY.push(away);
            dados.FTHG.push(fthg);
            dados.FTAG.push(ftag);

        } catch (error) {
            console.log(error);
        }
    }

    saveToCSV(dados);

    const end = Date.now();
    console.log(`Tempo total de execução: ${(end-start)/1000} segundos`);
}

function saveToCSV(dados) {
    
    const header = 'HOME;AWAY;FTHG;FTAG';

    const rows = dados.HOME.map((home, index) => `${home}; ${dados.AWAY[index]}; ${dados.FTHG[index]}; ${dados.FTAG[index]}\n`).join('');

    const csvContent = header + rows;

    const filename = path.join(__dirname, 'datasetflashscore.csv');

    fs.writeFileSync(filename, csvContent, 'utf8');


}