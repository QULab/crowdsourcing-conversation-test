const puppeteer = require('puppeteer');

(async () => {

    const browser = await puppeteer.launch({ headless:false });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://webrtc-audio.herokuapp.com', ['microphone']);
    const page = await browser.newPage();
    await page.goto('https://webrtc-audio.herokuapp.com');
    
    
    console.log(await page.content());
    await page.focus('#room-number');
    page.keyboard.type('2');
    await page.click('#go-room');
    
})()