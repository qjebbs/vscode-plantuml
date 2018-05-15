class Zoom {
    constructor() {
        this.zoomUpperLimit = document.getElementById("zoomUpperLimit").innerText === "true";
        this.isWheelActionZoom = document.getElementById("wheelAction").innerText === "zoom";
        this.img = document.getElementById("image");
        this.imgContainer = document.getElementById("image-container");
        this.naturalWidth = this.img.naturalWidth;
        this.naturalHeight = this.img.naturalHeight;
        let afterZoom = () => {
            this.setToggleIcon();
            saveStatus();
        }
        let resetZoom = () => {
            this.reset();
            this.setToggleIcon();
            saveStatus();
        }
        this.img.addEventListener("dblclick", () => {
            let mouseAt = this.getMousePointer();
            if (this.img.clientWidth >= this.naturalWidth) {
                resetZoom();
            } else
                this.smoothZomm(100, mouseAt, afterZoom);
        })
        document.getElementById("btnZoomIn").addEventListener("click", () => {
            this.smoothZomm(this.zoom * 1.2, this.getWindowCenterMousePointer(), afterZoom);
        });
        document.getElementById("btnZoomOut").addEventListener("click", () => {
            this.smoothZomm(this.zoom / 1.2, this.getWindowCenterMousePointer(), afterZoom);
        });
        document.getElementById("btnZoomToggle").addEventListener("click", () => {
            if (this.img.clientWidth >= this.naturalWidth) {
                resetZoom();
            } else
                this.smoothZomm(100, this.getWindowCenterMousePointer(), afterZoom);
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
                    this.setZoom(this.zoom * (delta / 50 + 1), mouseAt);
                }
                this.setToggleIcon();
                saveStatus();
                if (event.preventDefault) event.preventDefault();
                return false;
            }
        });
        window.onresize = () => this.reset();
    }
    reset() {
        let mp = this.getWindowCenterMousePointer();
        mp.imageX = 0.5;
        mp.imageY = 0.5;
        this.setZoom(0, mp);
    }
    smoothZomm(to, mouseAt, callback, ...args) {
        mouseAt = mouseAt || this.getMousePointer();
        let winWidth = window.innerWidth;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = minWidth / this.naturalWidth * 100;
        if (to < minZoom) to = minZoom;
        let from = this.zoom;
        if (from == to) return;
        const interval = 10;
        const level = 1;
        const delta = (to - from) / level;
        for (let i = 1; i <= level; i++) {
            setTimeout(() => {
                if (this.setZoom(from + delta * i, mouseAt) && callback) callback(...args);
            }, interval * i);
        }
    }
    setZoom(zoom, mouseAt) {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = minWidth / this.naturalWidth * 100;
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
            imgWidth = this.naturalWidth * zoom / 100;
        }
        let sizeChanged = !(this.zoom == zoom && this.img.clientWidth == imgWidth);
        if (sizeChanged) this.img.style.width = imgWidth + 'px';
        imgHeight = this.naturalHeight * zoom / 100;
        this.zoom = zoom;
        if (sizeChanged && mouseAt) this.followMousePointer(mouseAt, imgWidth, imgHeight);
        return sizeChanged;
    }
    setScroll(left, top) {
        document.body.scrollLeft = left;
        document.body.scrollTop = top;
    }
    followMousePointer(mouseAt, imgWidth, imgHeight) {
        imgWidth = imgWidth || this.img.clientWidth;
        imgHeight = imgHeight || this.img.clientHeight;

        let blankRight = window.innerWidth - imgWidth * (1 - mouseAt.imageX) - mouseAt.x;
        let blankLeft = mouseAt.x - imgWidth * mouseAt.imageX;
        let blankBottom = window.innerHeight - imgHeight * (1 - mouseAt.imageY) - mouseAt.y;
        let blankTop = mouseAt.y - imgHeight * mouseAt.imageY;
        blankRight = blankRight < 0 ? 0 : blankRight;
        blankLeft = blankLeft < 0 ? 0 : blankLeft;
        blankBottom = blankBottom < 0 ? 0 : blankBottom;
        blankTop = blankTop < 0 ? 0 : blankTop;

        let blankX = Math.max(blankLeft, blankRight);
        let blankY = Math.max(blankBottom, blankTop);

        this.imgContainer.style.width = (blankX * 2 + imgWidth) + 'px'
        this.imgContainer.style.height = (blankY * 2 + imgHeight) + "px";

        let scrollLeft = imgWidth * mouseAt.imageX + blankX - mouseAt.x;
        let scrollTop = imgHeight * mouseAt.imageY + blankY - mouseAt.y;

        document.body.scrollLeft = scrollLeft;
        document.body.scrollTop = scrollTop;

    }
    getMousePointer(x, y) {
        let e = event || window.event;
        let clientX = x || e.clientX
        let clientY = y || e.clientY
        let mouseAt = {
            x: clientX,
            y: clientY,
            imageX: (clientX + document.body.scrollLeft - this.img.x) / this.img.clientWidth,
            imageY: (clientY + document.body.scrollTop - this.img.y) / this.img.clientHeight,
        }
        // console.log(this.bx, this.img.x, this.by, this.img.y);
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