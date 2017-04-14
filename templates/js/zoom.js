window.onload = () => {
    const marginPixels = 40;
    let img = document.getElementById("image");
    let naturalWidth = img.naturalWidth;
    let zoom = (window.innerWidth - marginPixels) / naturalWidth * 100;
    if (zoom > 100) zoom = 100;
    document.getElementById("body").addEventListener("mousewheel", () => {
        zoomImage();
    })
    window.onmousewheel = function () { return false };
    function zoomImage() {
        let winWidth = window.innerWidth;
        let contentWidth = winWidth - marginPixels
        let minWidth = contentWidth < naturalWidth ? contentWidth : naturalWidth;
        let minZoom = parseInt(minWidth / naturalWidth * 100);

        zoom += event.wheelDelta / 12;
        if (zoom > 100) zoom = 100;
        if (zoom < minZoom) zoom = minZoom;
        let imgWidth = parseInt(naturalWidth * zoom / 100);
        img.style.width = imgWidth + 'px';
        let body = document.getElementById("body");
        let bodyWidth = imgWidth + marginPixels < winWidth ? winWidth : imgWidth + marginPixels;
        body.style.width = bodyWidth + 'px';
        if (body.offsetHeight < window.innerHeight) body.style.height = window.innerHeight - marginPixels + "px";

        // let debugPar = document.getElementById("debug");
        // debugPar.innerHTML = `
        //     image naturalWidth:${naturalWidth}<br>
        //     image zoom:${o.style.zoom}<br>
        //     image width:${o.width}<br>
        //     window width:${winWidth}<br>
        //     window height:${window.innerHeight}<br>
        //     body width:${body.offsetWidth}<br>
        //     body height:${body.offsetHeight}<br>
        // `;

        return false;
    }
}