function addCursorManager(settings) {
    let imgContainer = document.getElementById('image-container')
    let decideCursor = (e) => {
        let leftButton = e.buttons & 1;
        let rightButton = e.buttons & 2;
        // console.log("leftButton", leftButton, "rightButton", rightButton);
        if (!leftButton && !rightButton) {
            if (settings.swapMouseButtons) {
                imgContainer.style.cursor = "grab";
            } else if (e.altKey) {
                imgContainer.style.cursor = "zoom-out";
            } else {
                imgContainer.style.cursor = "zoom-in";
            }
            return;
        }
        // zoom
        if (
            (leftButton && !settings.swapMouseButtons) ||
            (rightButton && settings.swapMouseButtons)
        ) {
            if (e.altKey) {
                imgContainer.style.cursor = "zoom-out";
            } else {
                imgContainer.style.cursor = "zoom-in";
            }
            return;
        }
        // move
        if (
            (leftButton && settings.swapMouseButtons) ||
            (rightButton && !settings.swapMouseButtons)
        ) {
            imgContainer.style.cursor = "grabbing";
        } else {
            imgContainer.style.cursor = "grab";
        }
    }
    imgContainer.addEventListener("mousedown", e => {
        // console.log("mousedown", e.button, e.buttons);
        decideCursor(e);
    });
    imgContainer.addEventListener("mousemove", e => {
        // console.log("mousemove", e.button, e.buttons);
        decideCursor(e);
    });
    imgContainer.addEventListener("mouseup", e => {
        // console.log("mousemove", e.button, e.buttons);
        decideCursor(e);
    });
};