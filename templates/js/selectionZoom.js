  function addSelectionBox(settings) {
      let mouseZoomButton = settings.swapMouseButtons ? 2 : 0;

      let imgContainer = document.getElementById("image-container");
      if (!imgContainer) {
          // console.log("cannot initial selection box due to no image-container.");
          return;
      }
      let sBox = document.createElement("div");
      imgContainer.appendChild(sBox);
      sBox.id = "selectionBox";
      sBox.style.display = "none";
      let start = {
          x: 0,
          y: 0
      };
      let rectStart = {
          x: 0,
          y: 0
      };
      let rectEnd = {
          x: 0,
          y: 0
      };
      let flag = false;
      imgContainer.addEventListener("mousedown", e => {
          if (e.button == mouseZoomButton) {
              flag = true;
              start.x = e.clientX;
              start.y = e.clientY;
              rectStart.x = e.clientX;
              rectStart.y = e.clientY;
              rectEnd.x = e.clientX;
              rectEnd.y = e.clientY;
              // console.log("select start", start);
          }
      });
      document.body.addEventListener("mousemove", e => {
          if (!flag) return;
          rectStart.x = Math.min(start.x, e.clientX);
          rectStart.y = Math.min(start.y, e.clientY);
          rectEnd.x = Math.max(start.x, e.clientX);
          rectEnd.y = Math.max(start.y, e.clientY);
          let w = rectEnd.x - rectStart.x;
          let h = rectEnd.y - rectStart.y;

          sBox.style.left = (rectStart.x + window.scrollX) + 'px';
          sBox.style.top = (rectStart.y + window.scrollY) + 'px';
          sBox.style.width = Math.abs(w) + 'px';
          sBox.style.height = Math.abs(h) + 'px';
          sBox.style.display = "";
          // console.log("select box:", sBox.style.left, sBox.style.top, sBox.style.width, sBox.style.height);
      });
      document.body.addEventListener("mouseup", e => {
          // console.log("select end", e.clientX, e.clientY);
          if (!flag) return;
          flag = false;
          sBox.style.display = "none";
          if (rectEnd.x - rectStart.x > 10 || rectEnd.y - rectStart.y > 10)
              zoomer.rectZoom(rectStart, rectEnd, start);
      });
  }