let zoomer;
let switcher;
let sendStatus;
let settings;

let previewStatus = {
    page: 1,
    pageStatus: {}
}

function saveStatus() {
    if (sendStatus && switcher.current) {
        // console.log("save status: " + status);
        previewStatus.page = switcher.current;
        previewStatus.pageStatus[switcher.current] = zoomer.status
        let status = JSON.stringify(previewStatus);
        sendStatus.attributes["href"].value = 'command:plantuml.previewStatus?' + encodeURIComponent(status);
        sendStatus.click();
    }
}
window.addEventListener("load", () => {

    try {
        settings = JSON.parse(document.getElementById("settings").innerHTML);
    } catch (error) {
        console.log("parse settings error:", error.message);
        settings = undefined;
    }

    if (!document.getElementById("errtxt").innerText.trim())
        document.getElementById("error-warning").style.display = "none";
    if (!settings.showSpinner)
        document.getElementById("spinner-container").remove();

    switcher = new Switcher();
    let imgErr = document.getElementById("image-error");
    if (!switcher.images.length && imgErr.src) switcher.images = [imgErr.src];
    if (switcher.images.length) {
        let status = undefined;
        try {
            status = JSON.parse(document.getElementById("status").innerHTML);
        } catch (error) {
            // console.log("parse preview status error:", error.message);
            status = undefined;
        }
        if (status) previewStatus = status;
        document.getElementById("image-container").style.margin = "0";
        sendStatus = document.getElementById("sendStatus");
        zoomer = new Zoom(settings.zoomUpperLimit);
        switcher.moveTo(previewStatus.page);
    } else {
        document.getElementById("ctrl-container").remove();
        document.getElementById("image-container").remove();
    }
});
window.addEventListener("resize", () => {
    previewStatus.pageStatus = {};
    saveStatus();
});