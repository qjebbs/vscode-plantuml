class Zoom {
    constructor() {
        this.zoomUpperLimit = document.getElementById("zoomUpperLimit").innerText === "true";
        this.isWheelActionZoom = document.getElementById("wheelAction").innerText === "zoom";
        this.img = document.getElementById("image");
        this.imgContainer = document.getElementById("image-container");
        this.iconFit = document.getElementById("icon-fit");
        this.iconExpand = document.getElementById("icon-expand");
        this.naturalWidth = this.img.naturalWidth;
        this.naturalHeight = this.img.naturalHeight;
        this.status = undefined;
        let afterZoom = () => {
            saveStatus();
        }
        let resetZoom = () => {
            this.reset();
            saveStatus();
        }
        this.imgContainer.addEventListener("click", e => {
            if (e.button == 0) {
                let scale = 1 + (e.altKey ? -0.2 : 0.2);
                this.smoothZomm(this.status.zoom * scale, this.getMousePointer(), afterZoom);
            } else if (e.button == 1) {
                if (this.iconFit.style.display == "")
                    resetZoom();
                else
                    this.smoothZomm(100, this.getMousePointer(), afterZoom);
            }
        })
        // this.imgContainer.addEventListener("dblclick", () => {
        //     if (this.iconFit.style.display == "")
        //         resetZoom();
        //     else
        //         this.smoothZomm(100, this.getMousePointer(), afterZoom);
        // })
        document.getElementById("btnZoomIn").addEventListener("click", () => {
            this.smoothZomm(this.status.zoom * 1.2, this.getWindowCenterMousePointer(), afterZoom);
        });
        document.getElementById("btnZoomOut").addEventListener("click", () => {
            this.smoothZomm(this.status.zoom / 1.2, this.getWindowCenterMousePointer(), afterZoom);
        });
        document.getElementById("btnZoomToggle").addEventListener("click", () => {
            if (this.iconFit.style.display == "") {
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
                    this.pointZoom(this.status.zoom + delta, mouseAt);
                } else {
                    // zoom level increase / decrease by 30% for each wheel scroll
                    this.pointZoom(this.status.zoom * (delta / 50 + 1), mouseAt);
                }
                saveStatus();
                if (event.preventDefault) event.preventDefault();
                return false;
            }
        });
        window.addEventListener("mouseup", () => {
            this.status.x = document.body.scrollLeft;
            this.status.y = document.body.scrollTop;
            saveStatus();
        });
        window.addEventListener("resize", () => {
            this.reset();
            saveStatus();
        });
    }
    reset() {
        let mp = this.getWindowCenterMousePointer();
        mp.imageX = 0.5;
        mp.imageY = 0.5;
        this.pointZoom(0, mp);
    }
    smoothZomm(to, mouseAt, callback, ...args) {
        mouseAt = mouseAt || this.getMousePointer();
        let winWidth = window.innerWidth;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = minWidth / this.naturalWidth * 100;
        if (to < minZoom) to = minZoom;
        let from = this.status.zoom;
        if (from == to) return;
        const interval = 10;
        const level = 10;
        const delta = (to - from) / level;
        for (let i = 1; i <= level; i++) {
            setTimeout(() => {
                if (this.pointZoom(from + delta * i, mouseAt) && callback) callback(...args);
            }, interval * i);
        }
    }
    rectZoom(start, end) {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = minWidth / this.naturalWidth * 100;
        const maxZoom = 100;

        let status = this.getRectZoomStatus(start, end);
        if (this.zoomUpperLimit && status.zoom > maxZoom) status.zoom = maxZoom;
        if (status.zoom < minZoom) status.zoom = minZoom;

        this.applyStatus(status);
        saveStatus();
    }
    pointZoom(zoom, point) {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let minWidth = winWidth < this.naturalWidth ? winWidth : this.naturalWidth;
        let minZoom = minWidth / this.naturalWidth * 100;
        const maxZoom = 100;

        if (this.zoomUpperLimit && zoom > maxZoom) zoom = maxZoom;
        if (zoom < minZoom) zoom = minZoom;

        let status = this.getPointZoomStatus(zoom, point);
        this.applyStatus(status);
        return true;
    }
    getRectZoomStatus(start, end) {
        let startPoint = this.getMousePointer(start.x, start.y);
        let endPoint = this.getMousePointer(end.x, end.y);
        let imgSelCenterX = startPoint.imageX + (endPoint.imageX - startPoint.imageX) / 2;
        let imgSelCenterY = startPoint.imageY + (endPoint.imageY - startPoint.imageY) / 2;
        let imgX = (endPoint.imageX - startPoint.imageX) * this.img.clientWidth;
        let imgY = (endPoint.imageY - startPoint.imageY) * this.img.clientHeight;
        let scaleX = window.innerWidth / imgX;
        let scaleY = window.innerHeight / imgY;
        let scale = Math.min(scaleX, scaleY);
        let zoom = this.status.zoom * scale;
        let point = this.getWindowCenterMousePointer();
        point.imageX = imgSelCenterX;
        point.imageY = imgSelCenterY;
        return this.getPointZoomStatus(zoom, point);
    }
    getPointZoomStatus(zoom, point) {
        let imgWidth = this.naturalWidth * zoom / 100;
        let imgHeight = this.naturalHeight * zoom / 100;

        let blankRight = window.innerWidth - imgWidth * (1 - point.imageX) - point.x;
        let blankLeft = point.x - imgWidth * point.imageX;
        let blankBottom = window.innerHeight - imgHeight * (1 - point.imageY) - point.y;
        let blankTop = point.y - imgHeight * point.imageY;
        blankRight = blankRight < 0 ? 0 : blankRight;
        blankLeft = blankLeft < 0 ? 0 : blankLeft;
        blankBottom = blankBottom < 0 ? 0 : blankBottom;
        blankTop = blankTop < 0 ? 0 : blankTop;

        let status = {};
        status.blankX = Math.max(blankLeft, blankRight);
        status.blankY = Math.max(blankBottom, blankTop);
        status.x = imgWidth * point.imageX + status.blankX - point.x;
        status.y = imgHeight * point.imageY + status.blankY - point.y;
        status.zoom = zoom
        return status;
    }
    applyStatus(status) {
        // console.log("apply status:", status);
        let imgWidth = this.naturalWidth * status.zoom / 100;
        let imgHeight = this.naturalHeight * status.zoom / 100;
        this.img.style.width = imgWidth + 'px';
        this.imgContainer.style.width = (status.blankX * 2 + imgWidth) + 'px'
        this.imgContainer.style.height = (status.blankY * 2 + imgHeight) + "px";
        document.body.scrollLeft = status.x;
        document.body.scrollTop = status.y;
        this.status = status;
        this.setToggleIcon();
    }
    getMousePointer(x, y) {
        let e = event || window.event;
        let clientX = x || e.clientX
        let clientY = y || e.clientY
        return {
            x: clientX,
            y: clientY,
            imageX: (clientX + document.body.scrollLeft - this.img.x) / this.img.clientWidth,
            imageY: (clientY + document.body.scrollTop - this.img.y) / this.img.clientHeight,
        }
    }
    getWindowCenterMousePointer() {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        return this.getMousePointer(x, y);
    }
    setToggleIcon() {
        if (this.img.clientWidth >= this.naturalWidth || this.status.x != 0 || this.status.y != 0) {
            this.iconFit.style.display = "";
            this.iconExpand.style.display = "none";
        } else {
            this.iconFit.style.display = "none";
            this.iconExpand.style.display = "";
        }
    }
}