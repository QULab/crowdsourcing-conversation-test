const puppeteer = require('puppeteer');

(async () => {

    // const browser = await puppeteer.launch({ headless:true, ignoreDefaultArgs: ['--mute-audio']});

    // const context = browser.defaultBrowserContext();
    // // await context.overridePermissions('http://localhost:3000', ['microphone']);
    // // await context.overridePermissions('https://conversation-test.qulab.org', ['microphone']);
    // const page1 = await browser.newPage();
    // await page1.goto('https://conversation-test.qulab.org');
    // //await page1.goto('http://localhost:3000');


    // console.log(await page1.content());
    // await page1.focus('#room-number');
    // page1.keyboard.type('2');
    // await page1.click('#go-room');

    // const page2 = await browser.newPage();
    // //await page2.goto('https://conversation-test.qulab.org/audio/');
    //  await page2.goto('http://127.0.0.1:8080');
    // //await page2.click('#callButton');
    // page2.$eval('audio', audio => audio.play());

    //const browser = await puppeteer.launch({ headless:true, ignoreDefaultArgs: ['--mute-audio']});

    const browser = await puppeteer.launch({
        args: [
            '--use-fake-ui-for-media-stream',
        ],
        headless:false,
        ignoreDefaultArgs: ['--mute-audio'],
    });
    // const page2 = await browser.newPage();
    // //await page2.goto('http://127.0.0.1:8080');
    // await page2.goto('https://conversation-test.qulab.org/audio/');
    // await page2.click('#callButton');
    // //page2.$eval('audio', audio => audio.play());

    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'load' });
    await page.evaluate(() => {
        var audio = document.createElement("audio");
        audio.setAttribute("src", "test_file.mp3");
        audio.setAttribute("crossorigin", "anonymous");
        audio.setAttribute("controls", "");
        audio.play();
        
        audio.onplay = function () {
            var stream = audio.captureStream();
            navigator.mediaDevices.getUserMedia = async function () {
                return stream;
            };
        };
        document.querySelector("body").appendChild(audio);
        var audio1 = document.createElement("audio");
        audiofile.src = URL.createObjectURL(mediaSource);
    });


})()