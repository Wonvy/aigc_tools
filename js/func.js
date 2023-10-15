// 防抖函数，用于减少频繁触发API请求
export function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}


// wiki_APi
export async function wiki_APi(searchTerm, lang) {
  try {
    const { intro, imageUrl } = await getWikipediaInfo(searchTerm, lang);
    // console.log("简介:", intro);
    document.getElementById("zh_intro").textContent = intro;
    let image = document.querySelector("#fixed-header .top img");
    if (imageUrl) {
      image.src = imageUrl
    } else {
      image.src = "/img/placeholder.png"
    };
    // console.log("图片URL:", imageUrl);
  } catch (error) {
    console.error(error.message);
  }
}


async function getWikipediaInfo(searchTerm, lang = "zh") {
  try {
    const apiUrl = `https://${lang}.wikipedia.org/w/api.php`;
    const response = await fetch(`${apiUrl}?action=query&format=json&origin=*&prop=extracts|pageimages&exintro&explaintext&titles=${searchTerm}&piprop=thumbnail&pithumbsize=500`);
    const data = await response.json();

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    const intro = page.extract;
    const imageUrl = page.thumbnail ? page.thumbnail.source : null;

    return { intro, imageUrl };
  } catch (error) {
    throw new Error("API请求错误: " + error.message);
  }
}

// 根据id后去元素
export function getById(id) {
  return document.getElementById(id);
}

// 根据表达式获取元素
export function getElement(selector) {
  return document.querySelector(selector);
}

// 随机背景色
export function random_bkcolor(trans = 1) {
  const hue = Math.floor(Math.random() * 361);
  const saturation = 30; // 饱和度
  const lightness = 30; // 亮度
  const randomColor = `hsla(${hue}, ${saturation}%, ${lightness}%,${trans})`;
  return randomColor;
}

// 按钮倒计时
export function startCountdown(button, name = "成功") {
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
export function uuid() {
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

// 哈希值
// sha256(text1).then(hash1 => {
//   console.log("Hash 1:", hash1);
// });
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // 将二进制哈希值转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}


// 获取当前时间
export function getCurrentDateTime() {
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
