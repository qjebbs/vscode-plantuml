function addCursorManager(settings) {
    let mouseMoveButton = settings.swapMouseButtons ? 0 : 2;

    let mouseMoveButtonsValue = settings.swapMouseButtons ? 1 : 2;
    let mouseZoomButtonsValue = settings.swapMouseButtons ? 2 : 1;

    let defaultCursor = settings.swapMouseButtons ? "move" : "zoom-in";

    let imgContainer= document.getElementById('image-container')
    imgContainer.addEventListener("mousedown", e => {
        // console.log(e);
        if (e.buttons == mouseMoveButton) imgContainer.style.cursor = "move";
    });
    imgContainer.addEventListener("mousemove", e => {
        // console.log(e);
        if (e.buttons == mouseMoveButtonsValue) return;
        if (e.buttons == mouseZoomButtonsValue) {
            if (e.altKey)
                imgContainer.style.cursor = "zoom-out";
            else
                imgContainer.style.cursor = "zoom-in";
        }
        if (e.buttons == 0) imgContainer.style.cursor = defaultCursor;
    });
    imgContainer.addEventListener("mouseup", e => {
        // console.log(e);
        imgContainer.style.cursor = defaultCursor;
    });
};