function addCursorManager() {
    let imgContainer= document.getElementById('image-container')
    imgContainer.addEventListener("mousedown", e => {
        // console.log(e);
        if (e.button == 2) document.body.style.cursor = "move";
    });
    imgContainer.addEventListener("mousemove", e => {
        // console.log(e);
        if (e.button == 2) return;
        if (e.buttons == 0) {
            if (e.altKey)
                imgContainer.style.cursor = "zoom-out";
            else
                imgContainer.style.cursor = "zoom-in";
        }
    });
    imgContainer.addEventListener("mouseup", e => {
        // console.log(e);
        if (e.button == 2) {
            if (e.altKey)
                imgContainer.style.cursor = "zoom-out";
            else
                imgContainer.style.cursor = "zoom-in";
        }
    });
};