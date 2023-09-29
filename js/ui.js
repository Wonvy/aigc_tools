export { Resize };

class Resize {
  constructor(name) {
    this.name = name;
  }
  main() {
    let moving = false;
    let start_screenX = 0;
    let start_clientWidth = 0; // 开始宽度
    let start_leftX = 0; // 最左边
    let end_clientWidth = 0; // 结束宽度
    let resize = getelement(this.name);
    let parent = resize.parentNode;

    let p_en = document.querySelector(".en_wrap");
    let p_zh = document.querySelector(".zh_wrap");

    resize.addEventListener("mousedown", mousedown, false);
    parent.addEventListener("mouseup", mouseup, false);

    // 获取元素
    function getelement(name) {
      if (name.indexOf(".") != -1) {
        let resize = document.getElementsByClassName(name.substr(1))[0];
        return resize;
      }
      if (name.indexOf("#") != -1) {
        let resize = document.getElementById(name.substr(1));
        return resize;
      }
    }

    // 判断点击位置
    function mousehas(x, y) {
      if (x < parent.offsetLeft) {
        // console.log(1)
        return false;
      }
      if (x > parent.offsetLeft + parent.offsetWidth) {
        // console.log(2)
        return false;
      }
      if (y < parent.offsetTop) {
        // console.log(3)
        return false;
      }
      if (y > parent.offsetTop + parent.offsetHeight) {
        // console.log(parent.offsetTop, parent.offsetHeight)
        // console.log(4)
        return false;
      }
      return true;
    }

    // 鼠标按下
    function mousedown(event) {
      if (!mousehas(event.clientX, event.clientY)) {
        return false;
      }
      resize.classList.add("mg");
      start_clientWidth = parent.offsetWidth;
      start_screenX = event.clientX;
      start_leftX = parent.offsetLeft;
      console.log("start_clientWidth", start_clientWidth);
      console.log("start_screenX", start_screenX);
      console.log("start_leftX", start_leftX);
      moving = true;
      document.addEventListener("mousemove", mousemove, false);
    }

    // 鼠标移动
    function mousemove(event) {
      let offerX = event.clientX - start_leftX;
      console.log(offerX);

      if (offerX <= 30) {
        offerX = 30;
      } else {
        offerX = offerX;
      }

      if (offerX >= start_clientWidth - 30) {
        offerX = start_clientWidth - 30;
      } else {
        offerX = offerX;
      }

      //   console.log("event.clientX", event.clientX);
      //   console.log("event.offerX", event.clientX - start_leftX);
      //   console.log("event.clientX", event.clientX - start_screenX);
      //   let offerX = event.clientX - start_screenX;

      //   p_en.style.width = event.clientX + "px";
      //   p_zh.style.width = start_clientWidth - event.clientX + "px";
      //   console.log(offerX + "px");
      resize.style.left = offerX + "px";
      p_en.style.width = offerX + "px";
      p_zh.style.width = start_clientWidth - offerX + "px";

      //   console.log(
      //     "p_en",
      //     parseFloat((event.clientX / start_clientWidth) * 100),
      //   );

      //   end_clientWidth = start_clientWidth + (event.clientX - start_screenX);
      //   if (end_clientWidth <= 0) {
      //     end_clientWidth = resize.offsetWidth / 2;
      //   }
      //   parent.style.flex = "none";
      //   parent.style.width = end_clientWidth + "px";
    }

    // 鼠标弹起
    function mouseup(event) {
      resize.classList.remove("mg");
      console.log("移除");
      document.removeEventListener("mousemove", mousemove, false);
    }
  }
}
