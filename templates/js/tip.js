function showTip(tip, timeout) {
    let tipContainer = document.getElementById("tip-container");
    let tipper = document.getElementById("tip");
    if(!tip) return;
    tipper.innerHTML = tip;
    tipContainer.style.display = "block";
    tipContainer.style.opacity = 1;
    setTimeout(() => {
        tipContainer.style.opacity = 0;
        tipContainer.classList.add('fadeout');
        setTimeout(() => tipContainer.style.display = "none", 500);
    }, timeout);
}