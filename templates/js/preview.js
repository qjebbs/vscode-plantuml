class Zoom {
    constructor() {}
    reset() {
        this.margin = 100;
        this.zoomUpperLimit = document.getElementById("zoomUpperLimit").innerText === "true";
        this.isWheelActionZoom = document.getElementById("wheelAction").innerText === "zoom";
        this.img = document.getElementById("image");
        this.imgContainer = document.getElementById("image-container");
        this.naturalWidth = this.img.naturalWidth;
        this.naturalHeight = this.img.naturalHeight;
        this.setZoom(0);
        document.body.scrollLeft = window.innerWidth / 2 + this.img.clientWidth / 2 - this.margin;
        document.body.scrollTop = window.innerHeight / 2 + this.img.clientHeight / 2 - this.margin;
    }
    smoothZomm(to, callback, ...args) {
        let winWidth = window.innerWidth;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = parseInt(minWidth / this.naturalWidth * 100);
        if (to < minZoom) to = minZoom;
        let from = this.zoom;
        if (from == to) return;
        const interval = 10;
        const level = 10;
        const delta = (to - from) / level;
        for (let i = 1; i <= level; i++) {
            setTimeout(() => {
                if (this.setZoom(from + delta * i) && callback) callback(...args);
            }, interval * i);
        }
    }
    setZoom(zoom) {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = parseInt(minWidth / this.naturalWidth * 100);
        const maxZoom = 100;

        let imgWidth = 0;
        let imgHeight = 0;
        if (this.zoomUpperLimit && zoom > maxZoom) {
            zoom = maxZoom;
            imgWidth = this.naturalWidth;
        } else if (zoom < minZoom) {
            zoom = minZoom;
            imgWidth = minWidth;
        } else {
            imgWidth = parseInt(this.naturalWidth * zoom / 100);
        }
        let sizeChanged = !(this.zoom == zoom && this.img.clientWidth == imgWidth);
        if (sizeChanged) this.img.style.width = imgWidth + 'px';
        imgHeight = parseInt(this.naturalHeight * zoom / 100);
        let ctnWidth = winWidth * 2 + imgWidth - this.margin * 2;
        let ctnHeight = winHeight * 2 + imgHeight - this.margin * 2;
        this.imgContainer.style.width = ctnWidth + 'px'
        this.imgContainer.style.height = ctnHeight + "px";
        this.zoom = zoom;
        return sizeChanged;
    }
    setScroll(left, top) {
        document.body.scrollLeft = left;
        document.body.scrollTop = top;
    }
    add() {
        let afterZoom = mouseAt => {
            this.followMousePointer(mouseAt);
            this.setToggleIcon();
            saveStatus();
        }
        let resetZoom = () => {
            this.reset();
            this.setToggleIcon();
            saveStatus();
        }
        this.reset();
        this.img.addEventListener("dblclick", () => {
            let mouseAt = this.getMousePointer();
            if (this.img.clientWidth >= this.naturalWidth) {
                resetZoom();
            } else
                this.smoothZomm(100, afterZoom, mouseAt);
        })
        document.getElementById("btnZoomIn").addEventListener("click", () => {
            this.smoothZomm(this.zoom + 10, afterZoom, this.getWindowCenterMousePointer());
        });
        document.getElementById("btnZoomOut").addEventListener("click", () => {
            this.smoothZomm(this.zoom - 10, afterZoom, this.getWindowCenterMousePointer());
        });
        document.getElementById("btnZoomToggle").addEventListener("click", () => {
            if (this.img.clientWidth >= this.naturalWidth) {
                resetZoom();
            } else
                this.smoothZomm(100, afterZoom, this.getWindowCenterMousePointer());
        });
        document.body.addEventListener("mousewheel", () => {
            // console.log(event.ctrlKey, event.wheelDeltaX, event.wheelDeltaY);
            // scroll to zoom, or ctrl key pressed scroll
            if (this.isWheelActionZoom || event.ctrlKey) {
                // ctrlKey == true: pinch
                let delta = event.ctrlKey ? event.wheelDelta / 60 : event.wheelDelta / 12;
                let mouseAt = this.getMousePointer();
                if (this.zoomUpperLimit) {
                    this.setZoom(this.zoom + delta);
                } else {
                    // zoom level increase / decrease by 30% for each wheel scroll
                    this.setZoom(this.zoom * (delta / 50 + 1));
                }
                this.followMousePointer(mouseAt);
                this.setToggleIcon();
                saveStatus();
                if (event.preventDefault) event.preventDefault();
                return false;
            }
        });
        window.onresize = () => this.reset();
    }
    followMousePointer(mouseAt) {
        let e = event || window.event;
        let imgWidth = this.img.clientWidth;
        let imgHeight = this.img.clientHeight;
        document.body.scrollLeft = parseInt(imgWidth * mouseAt.imageX + window.innerWidth - this.margin) - mouseAt.x;
        document.body.scrollTop = parseInt(imgHeight * mouseAt.imageY + window.innerHeight - this.margin) - mouseAt.y;
    }
    getMousePointer(x, y) {
        let imgWidth = this.img.clientWidth;
        let imgHeight = this.img.clientHeight;
        let e = event || window.event;
        let clientX = x || e.clientX
        let clientY = y || e.clientY
        let mouseAt = {
            x: clientX,
            y: clientY,
            imageX: (clientX + document.body.scrollLeft - window.innerWidth + this.margin) / imgWidth,
            imageY: (clientY + document.body.scrollTop - window.innerHeight + this.margin) / imgHeight,
        }
        return mouseAt;
    }
    getWindowCenterMousePointer() {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        return this.getMousePointer(x, y);
    }
    setToggleIcon() {
        let fit = document.getElementById("icon-fit");
        let expand = document.getElementById("icon-expand");
        if (this.img.clientWidth >= this.naturalWidth) {
            fit.style.display = "";
            expand.style.display = "none";
        } else {
            fit.style.display = "none";
            expand.style.display = "";
        }
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
        if (this.images.length <= 1) {
            document.getElementById("page-ctrls").style.display = "none";
            return;
        }
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
        let status = JSON.stringify({
            page: switcher.current,
            zoom: zoomer.zoom,
            x: document.body.scrollLeft,
            y: document.body.scrollTop
        });
        // console.log("save status: " + status);
        sendStatus.attributes["href"].value = 'command:plantuml.previewStatus?' + encodeURIComponent(status);
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
    if (jsonStatus) {
        let status = {};
        try {
            status = JSON.parse(jsonStatus);
        } catch (error) {}
        status.page = status.page || 1;
        status.zoom = status.zoom || 1;
        status.x = status.x || 0;
        status.y = status.y || 0;
        switcher.moveTo(status.page);
        zoomer.setZoom(status.zoom);
        zoomer.setScroll(status.x, status.y);
    }
    if (!document.getElementById("errtxt").innerText.trim())
        document.getElementById("error-warning").style.display = "none";
    document.getElementById("image-container").style.margin = "0";

});
window.addEventListener("mouseup", () => saveStatus());