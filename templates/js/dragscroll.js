function addDrageScroll() {
    let flag = false;
    let lastClientX = 0;
    let lastClientY = 0;
    document.getElementById('image-container').addEventListener("mousedown", e => {
        if (e.button == 2) flag = true;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
    });
    document.body.addEventListener("mouseup", e => {
        flag = false;
    });
    document.body.addEventListener("mousemove", e => {
        if (flag) {
            let x = window.scrollX -
                (-lastClientX + (lastClientX = e.clientX));
            let y = window.scrollY -
                (-lastClientY + (lastClientY = e.clientY));
            window.scrollTo(x, y);
        }
    });
}