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
        if (this.images.length <= 1) {
            document.getElementById("page-ctrls").style.display = "none";
            return;
        }
        document.getElementById("btnNext").addEventListener("click", () => {
            if (this.current == this.images.length) return;
            this.moveTo(this.current + 1);
            saveStatus();
        });
        document.getElementById("btnPrev").addEventListener("click", () => {
            if (this.current == 1) return;
            this.moveTo(this.current - 1);
            saveStatus();
        });
        document.getElementById("images").remove();

    }
    moveTo(page) {
        if (page < 1 || page > this.images.length) {
            console.log(`invalid page: target ${page}, range 1 - ${this.images.length}`);
            return;
        }
        if (this.current == page) return;

        // switch page
        this.image.src = this.images[page - 1];
        this.pInfo.innerText = String.format(this.pInfoTpl, page, this.images.length);
        this.current = page;

        // restore page status
        let status = previewStatus.pageStatus[page];
        if (status) {
            zoomer.applyStatus(status);
        } else {
            zoomer.reset();
        }
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