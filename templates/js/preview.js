class Zoom {
    constructor() { }
    reset() {
        // this.debugPar = document.getElementById("debug");
        this.zoomUpperLimit = document.getElementById("zoomUpperLimit").innerText === "true";
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
    setZoom(zoom) {
        let winWidth = window.innerWidth;
        let contentWidth = winWidth - this.marginPixels
        let minWidth = contentWidth < this.naturalWidth ? contentWidth : this.naturalWidth;
        let minZoom = parseInt(minWidth / this.naturalWidth * 100);
        const maxZoom = 100;

        if (this.zoomUpperLimit && zoom > maxZoom) zoom = maxZoom;
        if (zoom < minZoom || (minZoom == maxZoom && this.zoomUpperLimit)) {
            zoom = minZoom;
            this.img.style.width = "";
            this.img.style.maxWidth = "";
            document.body.style.width = "";
            zoom = minZoom;
        } else {
            let imgWidth = parseInt(this.naturalWidth * zoom / 100);
            this.img.style.width = imgWidth + 'px';
            let body = document.body;
            let bodyWidth = imgWidth + this.marginPixels < winWidth ? winWidth : imgWidth + this.marginPixels;
            body.style.width = bodyWidth + 'px'
            if (body.offsetHeight < window.innerHeight) body.style.height = window.innerHeight - this.marginPixels + "px";
        }
        this.zoom = zoom;
        // this.debugPar.innerHTML = `
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
    }
    setScroll(left, top) {
        document.body.scrollLeft = left;
        document.body.scrollTop = top;
    }
    add() {
        this.reset();
        document.body.addEventListener("mousewheel", () => {
            let mouseAt = this.getMousePointer();
            if (this.zoomUpperLimit) {
                this.setZoom(this.zoom + event.wheelDelta / 12);
            } else {
                // zoom level increase / decrease by 30% for each wheel scroll
                this.setZoom(this.zoom * (event.wheelDelta / 600 + 1));
            }
            this.followMousePointer(mouseAt);
            saveStatus();
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
            saveStatus();
        });
        document.getElementById("btnPrev").addEventListener("click", () => {
            if (this.current == 1) return;
            this.moveTo(--this.current);
            saveStatus();
        });

        this.moveTo(1);
        document.getElementById("images").remove();
        // console.log(this.images.length);
    }
    moveTo(page) {
        if (page < 1 || page > this.images.length) return;
        this.image.src = this.images[page - 1];
        this.pInfo.innerText = String.format(this.pInfoTpl, page, this.images.length);
        this.current = page;
        zoomer.reset();
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
let zoomer;
let switcher;
let sendStatus;
function saveStatus() {
    if (sendStatus) {
        let status = JSON.stringify({ page: switcher.current, zoom: zoomer.zoom, x: document.body.scrollLeft, y: document.body.scrollTop });
        // console.log("save status: " + status);
        sendStatus.attributes["href"].value = encodeURI('command:plantuml.previewStatus?' + status);
        sendStatus.click();
    }
}
window.addEventListener("load", () => {
    sendStatus = document.getElementById("sendStatus");
    zoomer = new Zoom();
    switcher = new Switcher();
    switcher.add();
    zoomer.add();
    let jsonStatus = document.getElementById("status").innerHTML;
    if (!jsonStatus) return;
    let status = JSON.parse(jsonStatus);
    if (status) {
        switcher.moveTo(status.page);
        zoomer.setZoom(status.zoom);
        zoomer.setScroll(status.x, status.y);
    }
});
window.addEventListener("mouseup", () => saveStatus());
