const qualTest = document.getElementById('qualification_test');
const description = document.getElementById('description');
const title = document.getElementById('title');
const agree = document.getElementById('agree');
let qual_test = false;
qualTest.style.display = "none";
let browser = (function (agent) {
    switch (true) {
        case agent.indexOf("edge") > -1: return "edge";
        case agent.indexOf("edg") > -1: return "chromium based edge (dev or canary)";
        case agent.indexOf("opr") > -1 && !!window.opr: return "opera";
        case agent.indexOf("chrome") > -1 && !!window.chrome: return "chrome";
        case agent.indexOf("trident") > -1: return "ie";
        case agent.indexOf("firefox") > -1: return "firefox";
        case agent.indexOf("safari") > -1: return "safari";
        default: return "other";
    }
})(window.navigator.userAgent.toLowerCase());
console.log(window.navigator.userAgent.toLowerCase() + "\n" + browser);
browser = browser.toString();
console.log(browser);

const browsers = ['edge', 'chrome-edge', 'opera', 'safari', 'chromium based edge (dev or canary)'];

const queryString = window.location.search;
console.log("queryString", queryString);

let consent;
let supported = false;

if (browser === 'ie') {
    supported = false;
    location.href = "../unsupported.html";
}
else if (browsers.includes(browser)) {
    supported = false;
    location.href = "../unsupported.html";
}

let os = "Unknown OS";
if (navigator.userAgent.indexOf("Win") != -1) os =
    "Windows OS";
if (navigator.userAgent.indexOf("Mac") != -1) os =
    "Macintosh";
if (navigator.userAgent.indexOf("Linux") != -1) os =
    "Linux OS";
if (navigator.userAgent.indexOf("Android") != -1) os =
    "Android OS";
if (navigator.userAgent.indexOf("like Mac") != -1) os =
    "iOS";

const url = window.location.href;
console.log("url", url);

if (navigator.userAgent.includes("Firefox")) {
    isFireFox1 = true;
}

const urlParams = new URLSearchParams(queryString);
let fileName = urlParams.get('fileName');
console.log(fileName);
let roomNumber = urlParams.get('roomNumber');
console.log(roomNumber);
let type = urlParams.get('type');
console.log(type);
if (sessionStorage.hasOwnProperty('qual_test'))
    sessionStorage.removeItem("qual_test");

function change_button(checkbx, button_id) {
    var btn = document.getElementById(button_id);
    if (checkbx.checked == true) {
        btn.disabled = "";
    } else {
        btn.disabled = "disabled";
    }
}

if (localStorage.hasOwnProperty('consent')) {
    consent = localStorage.getItem('consent');
    console.log("localStorage consent found", consent);

    if (roomNumber != null && type.toString() == "USER2USER") {

        // if (supported) {
        location.href = "../user-user/" + queryString;
        // } else {
        //     location.href = "../unsupported.html";
        // } 
    }

    if (fileName != null && type.toString() == "USER2FILE") {
        // if (supported) {
            location.href = "../user-test/" + queryString;
        // } else {
        //     location.href = "../unsupported.html";
        // }
    }
    
    if(type =="USER2ECHO"){
        location.href = "../user-echo/" + queryString;
    }

} else {

    // no consent

    if (roomNumber != null && type.toString() == "USER2USER") {

        document.getElementById("start").onclick = function () {
            // if (supported) {
            //     // consent = 1;
            //     localStorage.setItem("consent", "1");
            //     location.href = "../user-user/" + queryString;
            // } else {
            //     location.href = "../unsupported.html";
            // }
            qualTest.style.display = "block";
            description.style.display = "none";
            title.style.display = "none";
            agree.style.display = "none";
        };
    }

    if (fileName != null && type == "USER2FILE") {
        document.getElementById("start").onclick = function () {
            // if (supported) {
                localStorage.setItem("consent", "1");
                location.href = "../user-test/" + queryString;
            // }
            // else {
            //     location.href = "../unsupported.html";
            // }
        };
    }
   
}

const constraints = {
    audio: true,
    video: false
};

/*
    functions responsible to headset check
*/
function isHeadsetOn(webrtc_raw) {
    keywords = ["headphone", "headset", "airpod", "usb audio device"]
    for (var i = 0; i < keywords.length; i++) {
        if (webrtc_raw.includes(keywords[i])) {
            qual_test = true;
            document.getElementById('answerButton').disabled = false;
            return true;
        }

    }
    return false;
}

document.getElementById('answerButton').disabled = true;

const startHeadsetCheck = async function () {
    $('#status').html("waiting for allowance...")
    await navigator.mediaDevices.getUserMedia(constraints);

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            console.log({ devices });
            var device_list = "";
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].kind.startsWith('audio')) {
                    device_list = device_list + devices[i].kind + ":" + devices[i].label.toLowerCase() + "+";
                }
            }
            headsetDetected = isHeadsetOn(device_list);
            console.log("USER HAS HEADSET ON",headsetDetected);
            $("#webrtc_raw").val(device_list);
            $("#use_headset").val(headsetDetected);
            $("#status").html("Done. Please continue.");

        });
}

function answer() {
    location.href = "../user-user/" + queryString;
    console.log("FUNCTION ANSWER IS CALLED");
    let form = document.getElementById('question');
    form.onsubmit = function (event) {
        event.preventDefault();
        let x = JSON.stringify($(form).serializeArray());
        x = JSON.parse(x);
        console.log(x);
        x = JSON.stringify(x);
        if (qual_test) {
            // consent = 1;
            // localStorage.setItem("consent", "1");
            sessionStorage.setItem("qual_test", x);
            location.href = "../user-user/" + queryString;
        } else {
            location.href = "../unsupported.html";
        }
    }
}



