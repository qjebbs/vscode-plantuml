function addHyperlinkManager(vscode) {
    let imgContainer= document.getElementById('image-container');
    imgContainer.addEventListener('click', e => {
        if (e.button == 0 && e.target.target == "_blank") {
            vscode.postMessage({
                "action": "openExternalLink",
                "href": e.target.href
            });

            e.stopImmediatePropagation();
        }
    });

    imgContainer.addEventListener('mousedown', e => {
        if (e.button == 0 && e.target.target == "_blank") {
            // prevent zoom selection when clicking on links
            e.stopImmediatePropagation();
        }
    });

    imgContainer.addEventListener('mouseup', e => {
        if (e.button == 0 && e.target.target == "_blank") {
            // prevent zoom action when clicking on links
            e.stopImmediatePropagation();
        }
    });
}