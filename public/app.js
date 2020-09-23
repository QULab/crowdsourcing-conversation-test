const queryString = window.location.search;
console.log("queryString", queryString);
const urlParams = new URLSearchParams(queryString);
let fileName = urlParams.get('fileName');
console.log(fileName);
let roomNumber = urlParams.get('roomNumber');
console.log(roomNumber);
let type = urlParams.get('type');
console.log(type);
let consent;
let supported = true;


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

if (browser === "edge") {
    supported = false;
    location.href = "./unsupported.html";
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

// let checktype = function(){
//     if(type != "USER2FILE") return true;
//     if(type != "USER2USER") return true;
//     return false;
// }

// let flag = function(){
//     if (type == "USER2FILE") {
//         if (fileName == null){
//             return true;
//         }
//         return false;
//     } else if (type == "USER2USER"){
//         if (roomNumber == null) {
//             return true;
//         }
//         return false;
//     }
// }

// if (queryString == null || checktype ||  flag ){
//     location.href = "./404.html";
// }

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
        if(supported){
        location.href = "../user-user/" + queryString;
        } else {
            location.href = "../unsupported.html";
        }
    }

    if (fileName != null && type.toString() == "USER2FILE") {
        if (supported) {
            location.href = "../user-test/" + queryString;
        } else {
            location.href = "../unsupported.html";
        }
    }
} else{

if (roomNumber != null && type.toString() == "USER2USER") {
    document.getElementById("start").onclick = function () {
        if(supported){
            // consent = 1;
            localStorage.setItem("consent", "1");
            location.href = "../user-user/" + queryString;
        }else{
            location.href = "../unsupported.html";
        }
    };
}

if (fileName != null && type == "USER2FILE") {
    document.getElementById("start").onclick = function () {
        if(supported){
            localStorage.setItem("consent", "1");
            location.href = "../user-test/" + queryString;
        }
        else{
            location.href = "../unsupported.html";
        }
    };
}
}