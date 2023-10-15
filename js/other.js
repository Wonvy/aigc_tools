function placeholder_clear() {
  if (inputText.value === "请输入文字") {
    inputText.value = "";
  }
}

// 检查网站是否可以访问
function checkWebsiteAvailability(url) {
  return fetch(url)
    .then(function (response) {
      if (response.ok) {
        return Promise.resolve();
      } else {
        return Promise.reject();
      }
    }).catch((error) => {
      console.error("web_Error:", error);
    });;
}

// 检查网站可访问性并显示/隐藏iframe
// checkWebsiteAvailability("https://www.baidu.com/")
//   .then(function () {
//     const iframe = document.querySelector("iframe");
//     iframe.style.display = "block";
//   })
//   .catch((error) => {
//     const iframe = document.querySelector("iframe");
//     iframe.style.display = "none";
//     console.error("web_Error11111111111111:", error);
//   });
