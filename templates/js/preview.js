let vscode;
if (typeof acquireVsCodeApi !== "undefined") vscode = acquireVsCodeApi();

let zoomer;
let switcher;
let settings;

let previewStatus = {
    page: 1,
    pageStatus: {}
}

function saveStatus() {
    if (vscode && switcher.current) {
        previewStatus.page = switcher.current;
        previewStatus.pageStatus[switcher.current] = zoomer.status
        // console.log("save status: " + previewStatus);
        vscode.postMessage(previewStatus);
    }
}
window.addEventListener("load", () => {
    switcher = new Switcher();
    let status = undefined;
    try {
        status = JSON.parse(document.getElementById("status").innerHTML);
    } catch (error) {
        // console.log("parse preview status error:", error.message);
        status = undefined;
    }
    settings = JSON.parse(document.getElementById("settings").innerHTML);

    let hasError = !!document.getElementById("errtxt").innerText.trim();
    if (!hasError)
        document.getElementById("error-warning").style.display = "none";
    if (!settings.showSpinner)
        document.getElementById("spinner-container").remove();
    else {
        if (switcher.images.length) document.getElementById("spinner-container").classList.add("small");
    }

    let imgErr = document.getElementById("image-error");
    if (!switcher.images.length && hasError) {
        switcher.images = [imgErr.currentSrc];
        // reset status if error image
        status = undefined;
    }
    if (switcher.images.length) {
        if (status) previewStatus = status;
        document.getElementById("image-container").style.margin = "0";
        zoomer = new Zoom(settings);
        switcher.moveTo(previewStatus.page);
        addCursorManager();
        addSelectionBox();
        addDrageScroll()
    } else {
        document.getElementById("ctrl-container").remove();
        document.getElementById("image-container").remove();
    }
});
window.addEventListener(
    "resize",
    (function () {
        let onResizeAvailable = false;
        setTimeout(() => {
            onResizeAvailable = true;
        }, 300);
        return function (e) {
            if (!onResizeAvailable) {
                // block unwanted resize event triggered when page initializes.
                // console.log("rejected resize event.");
                return;
            }
            zoomer.reset();
            previewStatus.pageStatus = {};
            saveStatus();
        }
    })()
);