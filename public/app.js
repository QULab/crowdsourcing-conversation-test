function change_button(checkbx, button_id) {
    var btn = document.getElementById(button_id);
    if (checkbx.checked == true) {
        btn.disabled = "";
    } else {
        btn.disabled = "disabled";
    }
}


document.getElementById("start").onclick = function () {
    location.href = "../user-test/index.html";
};