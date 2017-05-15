window.onload = () => {
    const marginPixels = 20;
    let img = document.getElementById("image");
    let naturalWidth = img.naturalWidth;
    let naturalHeight = img.naturalHeight;
    let zoom = (window.innerWidth - marginPixels) / naturalWidth * 100;
    if (zoom > 100) zoom = 100;
    document.body.addEventListener("mousewheel", zoomImage);
    window.onresize = function () {
        let winWidth = window.innerWidth;
        let contentWidth = winWidth - marginPixels
        let minWidth = contentWidth < naturalWidth ? contentWidth : naturalWidth;
        let minZoom = parseInt(minWidth / naturalWidth * 100);

        if (img.style.width == "") {
            // console.log("update zoom value due to resize");
            zoom = minZoom;
        } else if (zoom < minZoom) {
            // console.log("change zoom to fit");
            zoom = minZoom;
            img.style.width = "";
            img.style.maxWidth = "";
            document.body.style.width = "";
        }
    };
    window.onmousewheel = function () { return false };
    function zoomImage() {
        let winWidth = window.innerWidth;
        let contentWidth = winWidth - marginPixels
        let minWidth = contentWidth < naturalWidth ? contentWidth : naturalWidth;
        let minZoom = parseInt(minWidth / naturalWidth * 100);

        let mouseAt = getMousePointer();

        zoom += event.wheelDelta / 12;
        if (zoom > 100) zoom = 100;
        if (zoom < minZoom || minZoom == 100) {
            zoom = minZoom;
            img.style.width = "";
            img.style.maxWidth = "";
            document.body.style.width = "";
            zoom = minZoom;
        } else {
            let imgWidth = parseInt(naturalWidth * zoom / 100);
            img.style.width = imgWidth + 'px';
            let body = document.body;
            let bodyWidth = imgWidth + marginPixels < winWidth ? winWidth : imgWidth + marginPixels;
            body.style.width = bodyWidth + 'px'
            if (body.offsetHeight < window.innerHeight) body.style.height = window.innerHeight - marginPixels + "px";
            followMousePointer(mouseAt);
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
    function followMousePointer(mouseAt) {
        let e = event || window.event;
        let imgWidth = parseInt(naturalWidth * zoom / 100);
        let imgHeight = parseInt(naturalHeight * zoom / 100);
        document.body.scrollLeft += parseInt(imgWidth * mouseAt.imageX + marginPixels / 2) - mouseAt.x;
        document.body.scrollTop += parseInt(imgHeight * mouseAt.imageY + marginPixels / 2) - mouseAt.y;
    };
    function getMousePointer() {
        let imgWidth = parseInt(naturalWidth * zoom / 100);
        let imgHeight = parseInt(naturalHeight * zoom / 100);
        let e = event || window.event;
        let mouseAt = {
            x: e.clientX + document.body.scrollLeft,
            y: e.clientY + document.body.scrollTop,
            imageX: (e.clientX + document.body.scrollLeft - marginPixels / 2) / imgWidth,
            imageY: (e.clientY + document.body.scrollTop - marginPixels / 2) / imgHeight,
        }
        return mouseAt;
    }
}