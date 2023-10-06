export {
  getById,
  getElement,
  random_bkcolor,
  startCountdown,
  uuid,
  getCurrentDateTime
};

// 根据id后去元素
function getById(id) {
  return document.getElementById(id);
}

// 根据表达式获取元素
function getElement(selector) {
  return document.querySelector(selector);
}

// 随机背景色
function random_bkcolor(trans = 1) {
  const hue = Math.floor(Math.random() * 361);
  const saturation = 30; // 饱和度
  const lightness = 30; // 亮度
  const randomColor = `hsla(${hue}, ${saturation}%, ${lightness}%,${trans})`;
  return randomColor;
}

// 按钮倒计时
function startCountdown(button, name = "成功") {
  button.disabled = true; // 禁用按钮，防止连续点击
  let beforename = button.innerText;
  let count = 3; // 初始倒计时值

  function updateButtonLabel() {
    if (count > 0) {
      button.textContent = name + "(" + count + ")";
      count--;
      setTimeout(updateButtonLabel, 300); // 每秒更新一次
    } else {
      button.textContent = beforename;
      button.disabled = false; // 恢复按钮可用状态
    }
  }

  updateButtonLabel(); // 启动倒计时
}

// 生成uuid
function uuid() {
  var s = [];
  var x = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = x.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = x.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}

// 获取当前时间
function getCurrentDateTime() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1; // 月份从0开始，所以要加1
  var day = now.getDate();
  var hours = now.getHours();
  var minutes = now.getMinutes();

  // 在月、日、时、分小于10时，前面添加0
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  // 返回格式化后的日期时间字符串
  return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes;
}

