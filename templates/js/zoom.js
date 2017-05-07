window.onload = () => {
    const marginPixels = 40;
    let img = document.getElementById("image");
    let naturalWidth = img.naturalWidth;
    let zoom = (window.innerWidth - marginPixels) / naturalWidth * 100;
    if (zoom > 100) zoom = 100;
    document.body.addEventListener("mousewheel", () => {
        zoomImage();
    })
    window.onmousewheel = function () { return false };
    function zoomImage() {
        let winWidth = window.innerWidth;
        let contentWidth = winWidth - marginPixels
        let minWidth = contentWidth < naturalWidth ? contentWidth : naturalWidth;
        let minZoom = parseInt(minWidth / naturalWidth * 100);

        if (minZoom == 100) return;
        zoom += event.wheelDelta / 12;
        if (zoom > 100) zoom = 100;
        if (zoom < minZoom) {
            zoom = minZoom;
            img.style.width = "";
            img.style.maxWidth = "";
            document.body.style.width = "";
        } else {
            let imgWidth = parseInt(naturalWidth * zoom / 100);
            img.style.width = imgWidth + 'px';
            let body = document.body;
            let bodyWidth = imgWidth + marginPixels < winWidth ? winWidth : imgWidth + marginPixels;
            body.style.width = bodyWidth + 'px'
            if (body.offsetHeight < window.innerHeight) body.style.height = window.innerHeight - marginPixels + "px";
        }
        // let debugPar = document.getElementById("debug");
        // debugPar.innerHTML = `
        //     image naturalWidth:${naturalWidth}<br>
        //     image zoom:${img.style.zoom}<br>
        //     image width:${img.width}<br>
        //     window width:${winWidth}<br>
        //     window height:${window.innerHeight}<br>
        //     body width:${body.offsetWidth}<br>
        //     body height:${body.offsetHeight}<br>
        //     scrollWidth:${window.innerWidth - body.clientWidth}<br>
        //     bodyWidth:${bodyWidth}<br>
        //     imgWidth:${imgWidth}<br>
        // `;

        return false;
    }
}