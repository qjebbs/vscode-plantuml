function showTip(tip, timeout) {
    let tipContainer = document.getElementById("tip-container");
    let tipper = document.getElementById("tip");
    if (!tip) return;
    tipper.innerText = tip;
    tipContainer.style.display = "block";
    tipContainer.style.opacity = 1;
    if (timeout <= 0) {
        return;
    }
    setTimeout(() => {
        tipContainer.style.opacity = 0;
        tipContainer.classList.add('fadeout');
        setTimeout(() => tipContainer.style.display = "none", 500);
    }, timeout);
}