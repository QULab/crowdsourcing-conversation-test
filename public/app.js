const queryString = window.location.search;
console.log("queryString", queryString);
const urlParams = new URLSearchParams(queryString);
let fileName = urlParams.get('fileName');
console.log(fileName);
let roomNumber = urlParams.get('roomNumber');
console.log(roomNumber);
let type = urlParams.get('type');
console.log(type);
let userID;

function change_button(checkbx, button_id) {
    var btn = document.getElementById(button_id);
    if (checkbx.checked == true) {
        btn.disabled = "";
    } else {
        btn.disabled = "disabled";
    }
}

if (localStorage.hasOwnProperty('userID')) {
    userID = localStorage.getItem('userID');
    console.log("localStorage Id found", userID);

    if (roomNumber != null && type.toString() == "USER2USER") {
        location.href = "../user-user/" + queryString + "&userID=" + userID;
    }

    if (fileName != null && type.toString() == "USER2FILE") {
        location.href = "../user-test/" + queryString + "&userID=" + userID;
    }
} else{

if (roomNumber != null && type.toString() == "USER2USER") {
    document.getElementById("start").onclick = function () {
        location.href = "../user-user/" + queryString;
    };
}

if (fileName != null && type == "USER2FILE") {
    document.getElementById("start").onclick = function () {
        location.href = "../user-test/" + queryString;
    };
}
}