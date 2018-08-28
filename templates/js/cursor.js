function addCursorManager() {
    document.getElementById('image-container').addEventListener("mousedown", e => {
        // console.log(e);
        if (e.button == 2) document.body.style.cursor = "move";
    });
    document.body.addEventListener("mousemove", e => {
        // console.log(e);
        if (e.button == 2) return;
        if (e.buttons == 0) {
            if (e.altKey)
                document.body.style.cursor = "zoom-out";
            else
                document.body.style.cursor = "zoom-in";
        }
    });
    document.body.addEventListener("mouseup", e => {
        // console.log(e);
        if (e.button == 2) {
            if (e.altKey)
                document.body.style.cursor = "zoom-out";
            else
                document.body.style.cursor = "zoom-in";
        }
    });
};