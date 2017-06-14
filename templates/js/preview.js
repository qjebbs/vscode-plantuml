class Zoom {
    constructor() {
        this.reset();
    }
    reset() {
        this.marginPixels = 20;
        this.img = document.getElementById("image");
        this.naturalWidth = this.img.naturalWidth;
        this.naturalHeight = this.img.naturalHeight;
        this.zoom = (window.innerWidth - this.marginPixels) / this.naturalWidth * 100;
        this.img.style.width = "";
        this.img.style.maxWidth = "";
        document.body.style.width = "";
    }
    add() {
        this.reset();
        if (this.zoom > 100) this.zoom = 100;
        document.body.addEventListener("mousewheel", () => {
            let winWidth = window.innerWidth;
            let contentWidth = winWidth - this.marginPixels
            let minWidth = contentWidth < this.naturalWidth ? contentWidth : this.naturalWidth;
            let minZoom = parseInt(minWidth / this.naturalWidth * 100);

            let mouseAt = this.getMousePointer();

            this.zoom += event.wheelDelta / 12;
            if (this.zoom > 100) this.zoom = 100;
            if (this.zoom < minZoom || minZoom == 100) {
                this.zoom = minZoom;
                this.img.style.width = "";
                this.img.style.maxWidth = "";
                document.body.style.width = "";
                this.zoom = minZoom;
            } else {
                let imgWidth = parseInt(this.naturalWidth * this.zoom / 100);
                this.img.style.width = imgWidth + 'px';
                let body = document.body;
                let bodyWidth = imgWidth + this.marginPixels < winWidth ? winWidth : imgWidth + this.marginPixels;
                body.style.width = bodyWidth + 'px'
                if (body.offsetHeight < window.innerHeight) body.style.height = window.innerHeight - this.marginPixels + "px";
                this.followMousePointer(mouseAt);
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
        });
        window.onresize = () => {
            let winWidth = window.innerWidth;
            let contentWidth = winWidth - this.marginPixels
            let minWidth = contentWidth < this.naturalWidth ? contentWidth : this.naturalWidth;
            let minZoom = parseInt(minWidth / this.naturalWidth * 100);

            if (this.img.style.width == "") {
                console.log("update zoom value due to resize");
                this.zoom = minZoom;
            } else if (this.zoom < minZoom) {
                console.log("change zoom to fit");
                this.zoom = minZoom;
                this.img.style.width = "";
                this.img.style.maxWidth = "";
                document.body.style.width = "";
            }
        };
        window.onmousewheel = function () { return false };

    }
    followMousePointer(mouseAt) {
        let e = event || window.event;
        let imgWidth = parseInt(this.naturalWidth * this.zoom / 100);
        let imgHeight = parseInt(this.naturalHeight * this.zoom / 100);
        document.body.scrollLeft += parseInt(imgWidth * mouseAt.imageX + this.marginPixels / 2) - mouseAt.x;
        document.body.scrollTop += parseInt(imgHeight * mouseAt.imageY + this.marginPixels / 2) - mouseAt.y;
    }
    getMousePointer() {
        let imgWidth = parseInt(this.naturalWidth * this.zoom / 100);
        let imgHeight = parseInt(this.naturalHeight * this.zoom / 100);
        let e = event || window.event;
        let mouseAt = {
            x: e.clientX + document.body.scrollLeft,
            y: e.clientY + document.body.scrollTop,
            imageX: (e.clientX + document.body.scrollLeft - this.marginPixels / 2) / imgWidth,
            imageY: (e.clientY + document.body.scrollTop - this.marginPixels / 2) / imgHeight,
        }
        return mouseAt;
    }
}
let zoom = new Zoom();
window.addEventListener("load", () => {
    setSwitch();
    zoom.add();
});

function setSwitch() {
    let current = 0;
    let images = [];
    for (let e of document.getElementById("images").getElementsByTagName("img")) {
        images.push(e.src);
    }
    let count = images.length;
    let image = document.getElementById("image");
    image.src = images[current];
    if (count <= 1) return;
    document.getElementById("controls").style.display = "";
    document.getElementById("btnNext").addEventListener("click", () => {
        if (current == count - 1) return;
        image.src = images[++current];
        zoom.reset();
    });
    document.getElementById("btnPrev").addEventListener("click", () => {
        if (current == 0) return;
        image.src = images[--current];
        zoom.reset();
    });

    document.getElementById("images").remove();
}