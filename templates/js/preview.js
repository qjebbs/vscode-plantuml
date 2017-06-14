class Zoom {
    constructor() { }
    reset() {
        this.marginPixels = 20;
        this.img = document.getElementById("image");
        this.naturalWidth = this.img.naturalWidth;
        this.naturalHeight = this.img.naturalHeight;
        this.zoom = (window.innerWidth - this.marginPixels) / this.naturalWidth * 100;
        this.img.style.width = "";
        this.img.style.maxWidth = "";
        document.body.style.width = "";
        if (document.body.offsetHeight < window.innerHeight) document.body.style.height = window.innerHeight - this.marginPixels + "px";
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
                // console.log("update zoom value due to resize");
                this.zoom = minZoom;
            } else if (this.zoom < minZoom) {
                // console.log("change zoom to fit");
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
class Switcher {
    constructor() {
        this.current = 0;
        this.images = [];
        this.image = document.getElementById("image");
        this.pInfo = document.getElementById("pageInfo");
        this.pInfoTpl = this.pInfo.innerText;
        for (let e of document.getElementById("images").getElementsByTagName("img")) {
            this.images.push(e.src);
        }
    }
    add() {
        document.getElementById("placeholder").style.display = this.images.length > 1 ? "" : "none";
        if (this.images.length <= 1) return;
        document.getElementById("controls").style.display = "";
        document.getElementById("btnNext").addEventListener("click", () => {
            if (this.current == this.images.length) return;
            this.moveTo(++this.current);
        });
        document.getElementById("btnPrev").addEventListener("click", () => {
            if (this.current == 1) return;
            this.moveTo(--this.current);
        });

        this.moveTo(1);
        document.getElementById("images").remove();
        console.log(this.images.length);
    }
    moveTo(page) {
        this.image.src = this.images[page - 1];
        this.pInfo.innerText = String.format(this.pInfoTpl, page, this.images.length);
        this.current = page;
        zoom.reset();
    }
}
String.format = function format() {
    if (arguments.length == 0)
        return null;

    var str = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
}
let zoom = new Zoom();
let switcher = new Switcher();
window.addEventListener("load", () => {
    switcher.add();
    zoom.add();
});
