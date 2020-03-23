const puppeteer = require('puppeteer');

(async () => {

    const browser = await puppeteer.launch({ headless:false });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:3000', ['microphone']);
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    
    
    console.log(await page.content());
    await page.focus('#room-number');
    page.keyboard.type('2');
    await page.click('#go-room');
    
})()