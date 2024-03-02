class Zoom {
    constructor(settings) {
        this.settings = settings;
        this.img = document.getElementById("image");
        this.imgContainer = document.getElementById("image-container");
        this.iconToggle = document.getElementById("icon-toggle");
        this.ctrlBar = document.getElementById("ctrl-container");
        this.snapIndicator = document.getElementById("snap-indicator-container");

        this.mouseZoomButton = settings.swapMouseButtons ? 2 : 0;
        this.mouseResetZoomButton = 1;

        this.status = undefined;
        let resetZoom = () => {
            this.reset();
        }
        let onclick = e => {
            if (e.button == this.mouseZoomButton) {
                let scale = 1 + (e.altKey ? -0.2 : 0.2);
                this.smoothZomm(this.status.zoom * scale, this.getMousePointer(e.clientX, e.clientY));
            } else if (e.button == this.mouseResetZoomButton) {
                if (this.isImageExpanded())
                    resetZoom();
                else
                    this.smoothZomm(100, this.getMousePointer(e.clientX, e.clientY));
            }
        }
        let ondblclick = e => {
            if (this.isImageExpanded())
                resetZoom();
            else
                this.smoothZomm(100, this.getMousePointer(e.clientX, e.clientY));
        }
        addClickEvent(this.imgContainer, onclick);
        document.getElementById("btnZoomIn").addEventListener("click", () => {
            this.smoothZomm(this.status.zoom * 1.2, this.getWindowCenterMousePointer());
        });
        document.getElementById("btnZoomOut").addEventListener("click", () => {
            this.smoothZomm(this.status.zoom / 1.2, this.getWindowCenterMousePointer());
        });
        let btnCopy = document.getElementById("btnCopy");
        btnCopy.addEventListener("click", () => {
            this.copyImage(this.img, {
                copying: btnCopy.dataset.labelCopying,
                ok: btnCopy.dataset.labelOk,
                fail: btnCopy.dataset.labelFail,
            });
        });
        document.getElementById("btnZoomToggle").addEventListener("click", () => {
            if (this.isImageExpanded()) {
                resetZoom();
            } else
                this.smoothZomm(100, this.getWindowCenterMousePointer());
        });
        document.body.addEventListener("mousewheel", e => {
            // console.log(event.ctrlKey, event.wheelDeltaX, event.wheelDeltaY);
            // scroll to zoom, or ctrl key pressed scroll
            if (event.ctrlKey) {
                // ctrlKey == true: pinch
                let delta = event.ctrlKey ? event.wheelDelta / 60 : event.wheelDelta / 12;
                let mouseAt = this.getMousePointer(e.clientX, e.clientY);
                if (this.settings.zoomUpperLimit) {
                    this.pointZoom(this.status.zoom + delta, mouseAt);
                } else {
                    // zoom level increase / decrease by 30% for each wheel scroll
                    this.pointZoom(this.status.zoom * (delta / 50 + 1), mouseAt);
                }
                if (event.preventDefault) event.preventDefault();
                return false;
            }
        });
        window.addEventListener("scroll", () => {
            this.status.x = window.scrollX;
            this.status.y = window.scrollY;
            this.calcSnap();
            saveStatus();
        });
    }
    reset() {
        this.pointZoom(0);
        this.calcSnap();
    }
    calcSnap() {
        this.status.snapLeft = Math.abs(this.status.x) < 5;
        this.status.snapTop = Math.abs(this.status.y) < 5;
        this.status.snapRight = Math.abs(
            this.status.imgWidth + this.status.blankLeft + this.status.blankRight -
            this.status.x - window.innerWidth
        ) < 5;
        this.status.snapBottom = Math.abs(
            this.status.imgHeight + this.status.blankBottom + this.status.blankTop -
            this.status.y - window.innerHeight
        ) < 5;
        if (!this.settings.showSnapIndicators) return;
        if (this.status.snapBottom !== this.status.snapTop) {
            if (this.status.snapBottom) {
                this.snapIndicator.classList.add('snap-bottom');
                this.snapIndicator.classList.remove('snap-top');
            } else {
                this.snapIndicator.classList.add('snap-top');
                this.snapIndicator.classList.remove('snap-bottom');
            }
        } else {
            this.snapIndicator.classList.remove('snap-top');
            this.snapIndicator.classList.remove('snap-bottom');
        }
        if (this.status.snapRight !== this.status.snapLeft) {
            if (this.status.snapRight) {
                this.snapIndicator.classList.add('snap-right');
                this.snapIndicator.classList.remove('snap-left');
            } else {
                this.snapIndicator.classList.add('snap-left');
                this.snapIndicator.classList.remove('snap-right');
            }
        } else {
            this.snapIndicator.classList.remove('snap-left');
            this.snapIndicator.classList.remove('snap-right');
        }
    }
    smoothZomm(to, mouseAt, callback, ...args) {
        let winWidth = window.innerWidth;
        let minWidth = winWidth < this.img.naturalWidth ? winWidth : this.img.naturalWidth;
        let minZoom = minWidth / this.img.naturalWidth * 100;
        if (to < minZoom) to = minZoom;
        let from = this.status.zoom;
        if (from == to) return;
        const interval = 10;
        const level = 10;
        const delta = (to - from) / level;
        for (let i = 1; i <= level; i++) {
            setTimeout(() => {
                // console.log("before zoom:", this.img.x, this.img.y, window.scrollX, window.scrollY);
                if (this.pointZoom(from + delta * i, mouseAt) && callback) callback(...args);
            }, interval * i);
        }
    }
    rectZoom(start, end) {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let minWidth = winWidth < this.img.naturalWidth ? winWidth : this.img.naturalWidth;
        let minZoom = minWidth / this.img.naturalWidth * 100;
        const maxZoom = 100;

        let status = this.getRectZoomStatus(start, end);
        if (this.settings.zoomUpperLimit && status.zoom > maxZoom) status.zoom = maxZoom;
        if (status.zoom < minZoom) status.zoom = minZoom;

        this.applyStatus(status);
    }
    pointZoom(zoom, point) {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let minWidth = winWidth < this.img.naturalWidth ? winWidth : this.img.naturalWidth;
        let minZoom = minWidth / this.img.naturalWidth * 100;
        const maxZoom = 100;

        if (!point) point = this.getWindowCenterMousePointer();
        if (this.settings.zoomUpperLimit && zoom > maxZoom) zoom = maxZoom;
        if (zoom < minZoom + 0.1) {
            // if zoom <= minZoom, reset
            zoom = minZoom;
            let imgHeight = this.img.naturalHeight * zoom / 100;
            point = this.getWindowCenterMousePointer();
            point.imageX = 0.5;
            if (imgHeight < window.innerHeight) {
                point.imageY = 0.5;
            } else {
                point.y = 0;
                point.imageY = 0;
            }
        }

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
        let imgWidth = this.img.naturalWidth * zoom / 100;
        let imgHeight = this.img.naturalHeight * zoom / 100;
        let ctrlBarSapceY = window.innerHeight - this.ctrlBar.offsetTop;

        let blankRight = Math.floor(window.innerWidth - imgWidth * (1 - point.imageX) - point.x);
        let blankLeft = Math.floor(point.x - imgWidth * point.imageX);
        let blankBottom = Math.floor(window.innerHeight - imgHeight * (1 - point.imageY) - point.y);
        let blankTop = Math.floor(point.y - imgHeight * point.imageY);
        blankRight = blankRight < 0 ? 0 : blankRight;
        blankLeft = blankLeft < 0 ? 0 : blankLeft;
        blankBottom = blankBottom < ctrlBarSapceY ? ctrlBarSapceY : blankBottom;
        blankTop = blankTop < 0 ? 0 : blankTop;

        let status = {};
        status.imgWidth = imgWidth;
        status.imgHeight = imgHeight;
        status.blankTop = blankTop;
        status.blankRight = blankRight;
        status.blankBottom = blankBottom;
        status.blankLeft = blankLeft;
        status.x = Math.floor(imgWidth * point.imageX + status.blankLeft - point.x);
        status.y = Math.floor(imgHeight * point.imageY + status.blankTop - point.y);
        status.zoom = zoom
        return status;
    }
    applyStatus(status) {
        // console.log("apply status:", status);
        let imgWidth = this.img.naturalWidth * status.zoom / 100;
        let imgHeight = this.img.naturalHeight * status.zoom / 100;
        // update image size of saved status, since image may updated
        status.imgWidth = imgWidth;
        status.imgHeight = imgHeight;

        this.img.style.width = imgWidth + 'px';
        this.img.style.marginLeft = status.blankLeft + 'px';
        this.img.style.marginRight = status.blankRight + 'px';
        this.img.style.marginTop = status.blankTop + 'px';
        this.img.style.marginBottom = status.blankBottom + 'px';

        let scrollX = 0;
        let scrollY = 0;
        if (status.snapLeft === status.snapRight)
            // snapLeft & snapLeft all true => image width small than window, no snap
            // snapLeft & snapLeft all false => of course no snap
            scrollX = status.x;
        else if (status.snapLeft)
            scrollX = 0;
        else if (status.snapRight)
            scrollX = imgWidth + status.blankLeft + status.blankRight;

        if (status.snapTop === status.snapBottom)
            // snapLeft & snapLeft all true => image height small than window, no snap
            // snapLeft & snapLeft all false => of course no snap
            scrollY = status.y;
        else if (status.snapTop)
            scrollY = 0;
        else if (status.snapBottom)
            scrollY = imgHeight + status.blankTop + status.blankBottom;

        window.scrollTo(scrollX, scrollY);

        this.status = status;
        this.setToggleIcon();
    }
    getMousePointer(x, y) {
        return {
            x: x,
            y: y,
            imageX: (x + window.scrollX - this.img.offsetLeft) / this.img.clientWidth,
            imageY: (y + window.scrollY - this.img.offsetTop) / this.img.clientHeight,
        }
    }
    getWindowCenterMousePointer() {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        return this.getMousePointer(x, y);
    }
    setToggleIcon() {
        if (this.img.clientWidth >= this.img.naturalWidth || window.scrollX != 0 || window.scrollY != 0) {
            this.iconToggle.innerText = "fullscreen_exit";
        } else {
            this.iconToggle.innerText = "fullscreen";
        }
    }
    isImageExpanded() {
        return this.iconToggle.innerText == "fullscreen_exit";
    }
    copyImage(img, labels) {
        showTip(labels.copying, -1);
        const maxSize = 8192;
        let scale = Math.min(maxSize / img.clientWidth, maxSize / img.clientHeight, 1)
        let width = img.clientWidth * scale;
        let height = img.clientHeight * scale;
        // console.log(img.clientWidth, "*", img.clientHeight, " => ", width, "*", height)
        let canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, width, height);
        canvas.toBlob(function (blob) {
            if (!blob) {
                showTip(labels.fail, 2000);
                return;
            }
            let data = [new ClipboardItem({
                [blob.type]: blob
            })];
            navigator.clipboard.write(data).then(function () {
                showTip(labels.ok, 2000);
            }, function (err) {
                showTip(labels.fail + ": " + err, 2000);
            }).then(function () {
                document.body.removeChild(canvas);
            })
        }, 1);
    }
}