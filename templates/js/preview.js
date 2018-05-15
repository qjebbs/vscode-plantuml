let zoomer;
let switcher;
let sendStatus;

function saveStatus() {
    if (sendStatus) {
        let status = JSON.stringify({
            page: switcher.current,
            zoom: zoomer.zoom,
            x: document.body.scrollLeft,
            y: document.body.scrollTop
        });
        // console.log("save status: " + status);
        sendStatus.attributes["href"].value = 'command:plantuml.previewStatus?' + encodeURIComponent(status);
        sendStatus.click();
    }
}
window.addEventListener("load", () => {
    sendStatus = document.getElementById("sendStatus");
    zoomer = new Zoom();
    switcher = new Switcher();
    let jsonStatus = document.getElementById("status").innerHTML;
    if (jsonStatus) {
        let status = {};
        try {
            status = JSON.parse(jsonStatus);
        } catch (error) {}
        status.page = status.page || 1;
        status.zoom = status.zoom || 1;
        status.x = status.x || 0;
        status.y = status.y || 0;
        switcher.moveTo(status.page);
        zoomer.setZoom(status.zoom);
        zoomer.setScroll(status.x, status.y);
    }
    if (!document.getElementById("errtxt").innerText.trim())
        document.getElementById("error-warning").style.display = "none";
    document.getElementById("image-container").style.margin = "0";

});
window.addEventListener("mouseup", () => saveStatus());