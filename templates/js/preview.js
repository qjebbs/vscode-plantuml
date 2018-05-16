let zoomer;
let switcher;
let sendStatus;

let previewStatus = {
    page: 1,
    pageStatus: {}
}

function saveStatus() {
    if (sendStatus) {
        // console.log("save status: " + status);
        previewStatus.page = switcher.current;
        previewStatus.pageStatus[switcher.current] = zoomer.status
        let status = JSON.stringify(previewStatus);
        sendStatus.attributes["href"].value = 'command:plantuml.previewStatus?' + encodeURIComponent(status);
        sendStatus.click();
    }
}
window.addEventListener("load", () => {
    sendStatus = document.getElementById("sendStatus");
    zoomer = new Zoom();
    switcher = new Switcher();
    let jsonStatus = document.getElementById("status").innerHTML;
    let status = undefined;
    if (jsonStatus) {
        try {
            status = JSON.parse(jsonStatus);
        } catch (error) {
            console.log("parse preview status error:\n", error);
            status = undefined;
        }
    }
    if (status) previewStatus = status;
    switcher.moveTo(previewStatus.page);
    if (!document.getElementById("errtxt").innerText.trim())
        document.getElementById("error-warning").style.display = "none";
    document.getElementById("image-container").style.margin = "0";

});
window.addEventListener("resize", () => {
    previewStatus.pageStatus = {};
    saveStatus();
});