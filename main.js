import { translate_API, translate_tmt } from "./js/translate.js";
import { Resize } from "/js/ui.js";
import {
  getById,
  getElement,
  uuid,
  random_bkcolor,
  startCountdown,
} from "./js/func.js";
import {
  prompts_DeleteCommand,
  prompts_GetCommand,
  prompts_splitwords,
  add_keyword,
} from "./js/prompts.js";

const p_zh = getById("p_zh"); // 英文指令编辑区
const p_en = getById("p_en"); // 中文指令编辑区
const bt_zh = getById("bt_zh"); // 中文翻译按钮
const bt_en = getById("bt_en"); // 英文翻译按钮
const word_edit_ul = getElement("#word_edit ul");
// 元素拖拽

let lastparent_uuid = "";
let currenuuid;
let Translated;
let tooltip;
let ctrlPressed = false;

// 初始化JSON数据
let g_JSONdata;
get_JSON_once(); // 初始化JSON数据
function get_JSON_once() {
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      g_JSONdata = data;
    })
    .catch((error) => {
      console.log("json error", error);
    });
}

function clearPlaceholder() {
  if (inputText.value === "请输入文字") {
    inputText.value = "";
  }
}

const leftDiv = document.getElementById("word_edit_en");
const rightDiv = document.getElementById("word_edit");

// 记录左右两个 div 的滚动状态
let isLeftScrolling = false;
let isRightScrolling = false;

// 处理双击事件
let clicks = 0;
let timer2;

// 鼠标滚轮
document.querySelectorAll(".div_after > div").forEach(function (div) {
  div.addEventListener("wheel", tabwheel);
});

getElement(".zh_wrap .status_bar").addEventListener("wheel", tabwheel);
// 添加鼠标滚轮事件监听器
function tabwheel(event) {
  // console.log(event.target);
  let ul;
  let scrollDirection = (event.deltaX || event.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
  let scrollAmount = 150;
  // console.log(event.target.tagName);
  if (event.target.tagName === "BUTTON") {
    // console.log(event.target.dataset.name);
    ul = document.querySelector(
      `.div_after div[data-name="${event.target.dataset.name}"] > ul`,
    );
  } else {
    ul = event.target.closest("ul");
  }

  ul.scrollTop += scrollAmount * scrollDirection;
  event.preventDefault(); // 阻止事件的默认行为，避免影响其他滚动
}

// tab切换
getElement(".zh_wrap .status_bar").addEventListener("mouseover", function () {
  const button = event.target.closest("button");

  if (button) {
    const name = button.dataset.name;
    const tabs = document.querySelectorAll(".div_after > div");

    // 重置
    tabs.forEach((content) => {
      content.classList.remove("active");
    });

    let div = document.querySelector(`.div_after div[data-name="${name}"]`);
    if (div) {
      // console.log("div", div);
      div.classList.add("active");
      let ul = div.querySelector("ul");
      // 如果ul子元素为空，加载JSON数据
      if (ul) {
        if (prompt_unselectPrompt.childElementCount === 0) {
          renderJSON_search(button.dataset.tab);
        }
      } else {
        renderJSON_search(button.dataset.tab);
      }
    }
  }
});
// 通过关键词找 替换元素 数据库 查询关键词
function renderJSON_search(keyword) {
  let result;
  if (!g_JSONdata) {
    return;
  }
  let data = g_JSONdata;
  for (let key in data["关键词"]) {
    for (let key2 in data["关键词"][key]) {
      if (key2 === keyword) {
        result = data["关键词"][key][keyword];
        // console.log(result);
        let div = document.createElement("div");
        let ul = document.createElement("ul");
        for (const [key4, value4] of Object.entries(result)) {
          let li = document.createElement("li");
          let h4 = document.createElement("h4");
          let span = document.createElement("span");
          let img = document.createElement("img");

          h4.textContent = value4;
          span.textContent = key4;
          li.dataset.cn = value4;
          li.dataset.en = key4;
          img.setAttribute("src", "./img/placeholder.png");
          h4.appendChild(span);
          li.appendChild(h4);
          li.appendChild(img);
          ul.appendChild(li);
        }
        const tab = document.querySelector(
          `.div_after div[data-name="${keyword}"]`,
        );
        div.appendChild(ul);
        tab.innerHTML = div.innerHTML;
        break;
      }
    }
  }
}

//点击构图
getElement(".div_after").addEventListener("click", composition_click);
function composition_click(event) {
  let li;
  if (event.target.tagName === "LI") {
    li = event.target;
  } else {
    li = event.target.closest("li");
  }
  if (li) {
    li.classList.toggle("selected"); //切换
    if (li.classList.contains("selected")) {
      if (p_en.innerText.includes("," + li.dataset.en)) {
      } else {
        p_en.innerText = add_keyword(p_en.innerText, "," + li.dataset.en);
      }
    } else {
      if (p_en.innerText.includes("," + li.dataset.en)) {
        p_en.innerText = p_en.innerText.replace("," + li.dataset.en, "");
      }
    }
  }
}

// weiji("keyword");

function weiji(keyword) {
  // 维基百科API的请求地址，指定语言为中文
  const apiUrl = `https://zh.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(
    keyword,
  )}`;

  // 发送GET请求
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      // 获取页面的内容
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      const extract = pages[pageId].extract;
      console.log(extract);

      // 将内容显示在页面上
      // const resultDiv = document.getElementById("result");
      // resultDiv.textContent = extract;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// 调整滑块单击和双击
getElement(".resize").addEventListener("click", function () {
  clicks++;
  if (clicks === 1) {
    timer2 = setTimeout(function () {
      // 处理单击事件
      // console.log("单击");
      clicks = 0;
    }, 300); // 等待第二次点击的时间（毫秒）
  } else if (clicks === 2) {
    clearTimeout(timer2);
    // 处理双击事件
    resize_reset();
    // console.log("双击");
    clicks = 0;
  }
});

// 点击折叠按钮
getElement(".resize i").addEventListener("click", function (event) {
  if (event.target.parentNode.classList.contains("mgleft")) {
    resize_reset();
  } else {
    resize_reset();
  }
});

// 调整滑块重置
function resize_reset() {
  getElement(".resize").style.left = "";
  getElement(".en_wrap").style.width = "";
  getElement(".zh_wrap").style.width = "";
  getElement(".resize").classList.remove("mgleft");
  getElement(".resize").classList.remove("mgright");
}

// 项目拖拽
keyword_drags();
function keyword_drags() {
  const list = getElement("#word_edit ul");
  let currentLi;
  list.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    currentLi = e.target;
    setTimeout(() => {
      currentLi.classList.add("moving");
    });
  });

  list.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if (e.target === currentLi || e.target === list) {
      return;
    }
    let liArray = Array.from(list.childNodes);
    let currentIndex = liArray.indexOf(currentLi);
    let targetindex = liArray.indexOf(e.target);

    if (currentIndex < targetindex) {
      list.insertBefore(currentLi, e.target.nextElementSibling);
    } else {
      list.insertBefore(currentLi, e.target);
    }
  });
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  list.addEventListener("dragend", (e) => {
    currentLi.classList.remove("moving");
  });
}

// 调整元素大小拖拽
new Resize(".rz1").main();

// 监听左侧 div 的滚动事件
leftDiv.addEventListener("scroll", function () {
  if (!isLeftScrolling) {
    isRightScrolling = true;
    rightDiv.scrollTop = leftDiv.scrollTop;
  }
  isLeftScrolling = false;
});

// 监听右侧 div 的滚动事件
rightDiv.addEventListener("scroll", function () {
  if (!isRightScrolling) {
    isLeftScrolling = true;
    leftDiv.scrollTop = rightDiv.scrollTop;
  }
  isRightScrolling = false;
});

// 载入最后一次使用的提示词
loadRecentPrompt();

// 添加拆分词
// AddSplitWords();

// 格式化提示词
// prompts_format();

// 所选字体显示为大字号
getById("imagelist2").addEventListener("mouseover", setFontToLargeSize);

getElement(".commonds_wrap").addEventListener("change", comman_click);
getElement(".commonds_wrap").addEventListener("input", commond_input);
// getElement(".commonds_wrap").addEventListener("change", clickcommonds);

// 点击命令
function commond_input(event) {
  const tagname = event.target.tagName;
  if (tagname === "INPUT") {
    console.log("input", event.target.value);
  }
}

// 点击命令
function comman_click(event) {
  const tagname = event.target.tagName;
  const promptcontent = p_en.innerText;
  let paramName = "";
  if (tagname === "SELECT") {
    paramName = event.target.dataset.paramName;
    console.log(
      event.target.name,
      event.target.dataset.paramName,
      event.target.value,
    );
    const commond = paramName + " " + event.target.value;
    let commond_after = prompts_alterCommand(
      promptcontent,
      paramName + "\\s+[^\\s]+",
      commond,
    );
    p_en.innerText = commond_after;
    // console.log(commond_after);
  }
  if (tagname === "INPUT") {
    console.log(event.target.name, event.target.value);
    // alert(event.target.value);
  }
}

// 修改命令
function prompts_alterCommand(sourceText, regexPattern, replacementText) {
  var regex = new RegExp(regexPattern, "g");
  if (regex.test(sourceText)) {
    sourceText = sourceText.replace(regex, replacementText);
  } else {
    sourceText += " " + replacementText;
  }
  return sourceText;
}

// 提示词多行显示
document.querySelectorAll(".tab-container").forEach(function (div) {
  div.addEventListener("click", switchToMultiLinePrompt);
});

// 添加所选提示词
getById("view_bar-add").addEventListener("click", prompt_addSelectedPrompt);

// 载入提示词库
getById("bt_add").addEventListener("click", prompt_loadPromptLibrary);
getElement(".zh_wrap .status_bar").addEventListener(
  "click",
  prompt_loadPromptLibrary,
);

// 取消所选提示词
getById("view_bar-unselect").addEventListener("click", prompt_unselectPrompt);

// 延迟加载图片
window.addEventListener("load", delayedImageLoading);

// 翻译为中文
bt_en.addEventListener("click", translateToChinese);

// 翻译为英文
bt_zh.addEventListener("click", translateToEnglish);

// 高亮/取消鼠标经过的提示词
p_en.addEventListener("mouseover", hoverHighlight);
p_en.addEventListener("mouseout", clearHighlight);

getById("full_screen").addEventListener("mouseover", function (event) {
  if (event.target.id === "full_screen") {
    event.target.style.cursor = "not-allowed";
  }
});
getById("full_screen").addEventListener("mouseout", function (event) {
  if (event.target.id === "full_screen") {
    event.target.style.cursor = "default";
  }
});

// 键盘弹起
document.addEventListener("keyup", keyupEvent);
document.addEventListener("keydown", keydownEvent);

// 全屏点击
getById("full_screen").addEventListener("click", onFullScreenClick);

// 关闭提示词弹窗
getElement("#full_screen button.close").addEventListener(
  "click",
  full_screenclose,
);

getById("bt_save").addEventListener("click", savePrompts);
getById("bt_copy").addEventListener("click", copyPrompt);
getById("bt_paste").addEventListener("click", pastePrompt);
getById("bt_clear").addEventListener("click", clearPrompts);

// 载入最后一次使用的提示词
function loadRecentPrompt() {
  const last_text = localStorage.getItem("last_text");
  if (last_text === "") {
  } else {
    getById("p_en").innerText = last_text;
    // translate_tmt(last_text, "en", "zh").then((result) => {
    // getById("p_zh").innerText = result.translation;
    // prompts_format(); // 拆分段落
    // AddSplitWords();
    // });
    // getById("p_zh").innerText = localStorage.getItem(last_text);
  }
}

if (p_zh.innerText === "") {
  // p_zh.innerText = "请输入提示词";
}

// 设置输入框焦点
p_zh.focus();
getById("zh_tabs").addEventListener("click", function (event) {
  p_zh.focus();
});
getById("en_tabs").addEventListener("click", function (event) {
  p_en.focus();
});

// 实时翻译
// getById("p_zh").addEventListener("input", debounce(liveTranslate, 500));

// 实时翻译
function liveTranslate(event) {
  const text = p_zh.innerText;
  translate_API(text, true, "en").then((result) => {
    p_en.innerText = result.translations[0].text;
  });
}

// 所选字体显示为大字号
function setFontToLargeSize(event) {
  if (event.target.tagName === "LI") {
    getById("zh_preview").innerText = event.target.dataset.zh;
    getById("en_preview").innerText = event.target.dataset.en;
    let image = document.querySelector("#fixed-header img");
    let randomParam = Math.random(); // 生成一个随机数作为参数
    image.src = "https://picsum.photos/200?" + randomParam;
  }
}

// 提示词多行显示
function switchToMultiLinePrompt(event) {
  const tagName = event.target.tagName;
  let li;
  if (event.target.closest("li")) {
    if (tagName === "LI") {
      li = event.target;
    }
    if (tagName === "I") {
      li = event.target.parentElement;
    }
    const tabtext = li.dataset.tab;
    // console.log("#zh_tabs ." + tabtext);

    convertToMultiLinePrompt_cn();
    convertToMultiLinePrompt_en();

    const nav_zh = document.querySelector(".en_wrap .active");
    if (nav_zh) {
      nav_zh.classList.remove("active");
    }
    const nav_en = document.querySelector(".zh_wrap .active");
    if (nav_en) {
      nav_en.classList.remove("active");
    }

    document
      .querySelector('.zh_wrap [data-tab="' + tabtext + '"]')
      .classList.add("active");
    document
      .querySelector('.en_wrap [data-tab="' + tabtext + '"]')
      .classList.add("active");

    const ontopElement_zh = document.querySelector("#zh_tabs .ontop");
    if (ontopElement_zh) {
      ontopElement_zh.classList.remove("ontop");
    }
    const ontopElement_en = document.querySelector("#en_tabs .ontop");
    if (ontopElement_en) {
      ontopElement_en.classList.remove("ontop");
    }
    document.querySelector("#zh_tabs ." + tabtext).classList.add("ontop");
    document.querySelector("#en_tabs ." + tabtext).classList.add("ontop");
  }
}

// convertToMultiLinePrompt_cn();
// convertToMultiLinePrompt_en();

// 提示词转换为多行
function convertToMultiLinePrompt_cn() {
  const text = getById("p_zh").innerText;
  const punctuations = [",", "，", ".", "。", "、", ";", "；"];
  const lines = text.split(new RegExp(`[${punctuations.join("")}]`));
  const ul_local = document.querySelector("#word_edit ul");
  const ul = document.createElement("ul");
  lines.forEach((line) => {
    if (line.trim() !== "") {
      const li = document.createElement("li");
      li.style.backgroundColor = random_bkcolor(1);
      li.setAttribute("draggable", "true");
      li.textContent = line.trim();
      ul.appendChild(li);
    }
  });
  ul_local.innerHTML = ul.innerHTML;
}
// 提示词转换为多行
function convertToMultiLinePrompt_en() {
  const text = getById("p_en").innerText;
  const punctuations = [",", "，", ".", "。", "、", ";", "；"];
  const lines = text.split(new RegExp(`[${punctuations.join("")}]`));
  const ul = document.createElement("ul");
  const ul_local = document.querySelector("#en_tabs .tab2 ul");
  lines.forEach((line) => {
    if (line.trim() !== "") {
      const li = document.createElement("li");
      li.textContent = line.trim();
      ul.appendChild(li);
    }
  });
  ul_local.innerHTML = ul.innerHTML;
}

// 添加所选提示词
function prompt_addSelectedPrompt(event) {
  const lis = document.querySelectorAll("#full_screen li.selected");
  let text_en = p_en.textContent; // 当前文本
  let words_zh = "";
  let words_en = "";

  lis.forEach((li) => {
    if (text_en.includes("," + li.dataset.en)) {
    } else {
      words_zh = "," + li.dataset.zh + words_zh;
      words_en = "," + li.dataset.en + words_en;
    }
  });

  words_zh === "," ? "" : words_zh;
  words_en === "," ? "" : words_en;
  if (p_zh.textContent.length === 0) {
    p_zh.textContent = words_zh;
  } else {
    p_zh.textContent += words_zh;
  }

  if (p_en.textContent.length === 0) {
    p_en.textContent = words_en;
  } else {
    p_en.textContent = add_keyword(p_en.textContent, words_en);
  }

  let full_screen = document.getElementById("full_screen");
  full_screen.style.zIndex = "-99";
}

// 载入提示词库
function prompt_loadPromptLibrary(event) {
  const bt_title = event.target.dataset.name;
  let full_screen = document.getElementById("full_screen");
  full_screen.style.zIndex = "99";
  let imagelist2 = document.getElementById("imagelist2");
  getById("temp_en_edit").innerHTML = getById("p_en").innerHTML;
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      renderJSON(imagelist2, data); //载入json
      document.querySelector("h3[data-title=" + bt_title + "]").scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    })
    .catch((error) => {
      console.error("加载 JSON 文件时出错：", error);
    });
}

// 渲染 JSON 数据的函数
function renderJSON(container, data) {
  const div = document.createElement("div");
  // console.log("typeof data: ", typeof data);
  let json = JSON.stringify(data);
  // console.log("typeof json: ", typeof json);
  for (let key in data["关键词"]) {
    // console.log(data["关键词"][key]);
    for (let key2 in data["关键词"][key]) {
      const h3 = document.createElement("h3");
      const ul = document.createElement("ul");
      h3.textContent = key2;
      h3.dataset.title = key2;
      div.appendChild(h3);
      div.appendChild(ul);
      // console.log("key2", key2);
      for (let key3 in data["关键词"][key][key2]) {
        const h2 = document.createElement("h2");
        const li = document.createElement("li");
        const span = document.createElement("span");
        h2.textContent = data["关键词"][key][key2][key3];
        span.textContent = key3;
        // h2.appendChild(span);
        li.dataset.en = key3;
        li.dataset.zh = data["关键词"][key][key2][key3];
        li.appendChild(h2);
        ul.appendChild(li);
      }
    }
  }
  let childNodes = div.childNodes;
  let div2 = document.createElement("div");
  for (var i = 0; i < childNodes.length; i++) {
    div2.appendChild(childNodes[i].cloneNode(true));
  }
  container.innerHTML = div2.innerHTML;
}

// 取消所选提示词
function prompt_unselectPrompt(event) {
  const result = window.confirm("您确定要执行此操作吗？");
  if (result) {
    getById("temp_en_edit").innerText = "";
    const lis = document.querySelectorAll("#full_screen .selected");
    lis.forEach((li) => {
      li.classList.remove("selected");
    });
  }
}

// 格式化提示词
function prompts_format(prompts = "") {
  prompts === "" ? (prompts = p_en.textContent) : (prompts = "");
  prompts = prompts_DeleteCommand(prompts);
  const commands = prompts_GetCommand(p_en.textContent);

  // 指令标签
  let htmlcommand = "";
  if (commands && commands.length > 0) {
    htmlcommand = commands
      .map((command) => {
        return `<strong uuid="${uuid()}">${command}</strong>`;
      })
      .join("");
    // console.log(htmlcommand);
  }

  // 描述词标签
  const text_spans = prompts_splitwords(prompts);
  if (text_spans && text_spans.length > 0) {
    p_en.innerHTML =
      text_spans
        .map((text_span) => {
          // console.log(text_span);
          return `<span data-tooltip="这里是屋顶" uuid="${uuid()}">${text_span}</span>`;
        })
        .join("") + htmlcommand;

    // 拆词
    const spans = p_en.querySelectorAll("span");
    spans.forEach((span) => {
      let words = span.textContent.split(" ");
      span.innerHTML = words
        .map((word) => {
          if (word.trim() !== "") {
            Translated = localStorage.getItem(word);
            if (!Translated) {
              translate_API(word).then((result) => {
                let result_text = result.translations[0].text;
                localStorage.setItem(word, result_text); // 存储翻译结果到本地
                document.getElementById("p_words").innerText = result_text;
              });
            }
            return `<i>${word}</i>`;
          } else {
            return word; // 如果为空，保持原样
          }
        })
        .join(" ");
    });
  }
}

// 添加拆分词
function AddSplitWords() {
  const sentenceSpans = p_en.querySelectorAll("span");
  sentenceSpans.forEach((span) => {
    const li = document.createElement("li");
    const i = document.createElement("i");
    i.innerText = span.innerText;
    const span1 = document.createElement("span");
    li.setAttribute("uuid", span.getAttribute("uuid"));
    span1.innerText = localStorage.getItem(span.innerText);
    li.style.backgroundColor = random_bkcolor(1);
    li.appendChild(i);
    li.appendChild(span1);
    word_edit_ul.appendChild(li);
  });
}

// 翻译为中文
function translateToChinese() {
  let text_en = p_en.textContent;

  // 清空p标签
  while (p_zh.firstChild) {
    p_zh.removeChild(p_zh.firstChild);
  }
  while (word_edit_ul.firstChild) {
    word_edit_ul.removeChild(word_edit_ul.firstChild);
  }

  //翻译
  Translated = localStorage.getItem(text_en);
  if (Translated) {
    p_zh.innerText = Translated;
    prompts_format(); // 拆分段落
    AddSplitWords();
  } else {
    translate_tmt(text_en, "en", "zh").then((result) => {
      let result_text = result.translation;
      localStorage.setItem(text_en, result_text); // 存储翻译结果到本地
      p_zh.innerText = result_text; // 替换内容
      prompts_format(); // 拆分段落
      AddSplitWords();
    });

    // translate_API(text_en, true, "ZH")
    //   .then((result) => {/
    //     let result_text = result.translations[0].text;
    //     localStorage.setItem(text_en, result_text); // 存储翻译结果到本地
    //     p_zh.innerText = result_text; // 替换内容
    //     prompts_format(); // 拆分段落
    //     AddSplitWords();
    //   })
    //   .catch((error) => {
    //     console.error("translate_API翻译出错:", error);
    //   });
  }
}

// 翻译为英文
function translateToEnglish(event) {
  let p_zh = document.getElementById("p_zh").textContent;
  //翻译
  Translated = localStorage.getItem(p_zh);
  // 清空p标签
  while (p_en.firstChild) {
    p_en.removeChild(p_en.firstChild);
  }

  // 清空p标签
  while (word_edit_ul.firstChild) {
    word_edit_ul.removeChild(word_edit_ul.firstChild);
  }

  if (Translated) {
    p_en.innerText = Translated;
    prompts_format(); // 拆分段落
    AddSplitWords();
  } else {
    translate_API(p_zh, true, "EN")
      .then((result) => {
        let result_text = result.translations[0].text;
        localStorage.setItem(p_zh, result_text);
        p_en.innerText = result_text;
        prompts_format();
        AddSplitWords();
      })
      .catch((error) => {
        console.error("translate_API翻译出错:", error);
      });
  }
}

// 高亮鼠标经过的提示词
function hoverHighlight(event) {
  p_en.classList.add("textdark");
  if (event.target.tagName === "I") {
    currenuuid = event.target.parentNode.getAttribute("uuid");
  } else {
    if (event.target.tagName === "SPAN") {
      currenuuid = event.target.getAttribute("uuid");
    } else {
      currenuuid = "";
    }
  }

  const lis1 = document.querySelectorAll("li.on");
  lis1.forEach((lis) => {
    lis.classList.remove("on");
  });

  if (event.target && event.target.tagName === "I") {
    event.target.classList.add("highlighted-word");
    if (event.target.parentNode.tagName === "SPAN") {
      event.target.parentNode.classList.add("highlighted");

      // 判断是否翻译过
      let searchword = event.target.parentNode.innerText; // 搜索词
      Translated = localStorage.getItem(searchword);
      if (Translated) {
        document.getElementById("p_words").innerText = Translated;

        // 高亮编辑区单词
        document.querySelector(`li[uuid="${currenuuid}"]`).classList.add("on");
      } else {
        translate_API(searchword)
          .then((result) => {
            let result_text = result.translations[0].text;
            localStorage.setItem(searchword, result_text); // 存储翻译结果到本地
            document.getElementById("p_words").innerText = result_text;
          })
          .catch((error) => {
            console.error("translate_API翻译出错:", error);
          });
      }
    }
  }

  if (currenuuid) {
    if (currenuuid === lastparent_uuid) {
    } else {
      const paragraphs = document.querySelectorAll("span.highlighted");
      paragraphs.forEach((paragraph) => {
        paragraph.classList.remove("highlighted");
      });

      document
        .querySelector(`[uuid="${currenuuid}"]`)
        .classList.remove("highlighted");
      lastparent_uuid = currenuuid;
    }
  }
}

// 取消提示词高亮
function clearHighlight(event) {
  if (event.target.parentNode.tagName === "SPAN") {
    p_en.classList.remove("textdark");
  }

  if (event.target && event.target.tagName === "I") {
    if (!lastparent_uuid) {
      lastparent_uuid = event.target.parentNode.getAttribute("uuid");
    } else {
      event.target.parentNode.classList.remove("highlighted");
      document.getElementById("p_words").innerText = "";
    }
    // console.log(lastmove);
    event.target.classList.remove("highlighted-word");
    if (event.target.parentNode.tagName === "SPAN") {
      // event.target.parentNode.classList.remove("highlighted");
    }
  }
}

// 全屏点击
function onFullScreenClick(event) {
  const temp_en_edit = getById("temp_en_edit");
  let li;

  // console.log(event);
  let full_screen = getById("full_screen");

  if (event.target.tagName === "DIV") {
    let full_screen = getById("full_screen");
    full_screen.style.zIndex = "-99";
    return;
  }

  if (event.target.tagName === "H2") {
    li = event.target.parentElement;
  } else {
    li = event.target;
  }

  // if (event.target.tagName === "LI") {
  //   li = event.target;
  // } else {
  //   li = event.target;
  // }

  if (li.tagName === "LI") {
    li.classList.toggle("selected"); //切换
    if (li.classList.contains("selected")) {
      if (temp_en_edit.innerText.includes("," + li.dataset.en)) {
      } else {
        temp_en_edit.innerText = add_keyword(
          temp_en_edit.innerText,
          "," + li.dataset.en,
        );
      }
    } else {
      if (temp_en_edit.innerText.includes("," + li.dataset.en)) {
        temp_en_edit.innerText = temp_en_edit.innerText.replace(
          "," + li.dataset.en,
          "",
        );
      }
    }
  }
  return;

  if (event.target.tagName === "IMG") {
    const li = event.target.parentElement.parentElement;
    if (li.tagName === "LI") {
      li.classList.toggle("selected");
    }
  }
}

// 键盘弹起
function keyupEvent(event) {
  if (event.keyCode === 17) {
    ctrlPressed = false;
  }
}

// 键盘按下
function keydownEvent(event) {
  // 检查是否按下 Ctrl 键 (键码为 17)
  if (event.keyCode === 17) {
    ctrlPressed = true;
  }

  // 检查是否按下 ESC 键 (键码为 27)
  if (event.keyCode === 27) {
    // 处理 ESC 键事件
    let full_screen = getById("full_screen");
    full_screen.style.zIndex = "-99";
  }

  // 检查是否按下 `~` 键 (键码为 192)
  if (event.keyCode === 192) {
    // 处理 `~` 键事件
    let full_screen = getById("full_screen");
    full_screen.style.zIndex = "99";
  }
}

// 关闭提示词弹窗
function full_screenclose(event) {
  let full_screen = document.getElementById("full_screen");
  full_screen.style.zIndex = "-99";
}

// 清空提示词
function clearPrompts(event) {
  p_en.innerHTML = "";
  p_en.innerHTML = "";
  localStorage.setItem("last_text", "");
}

// 保存提示词
function savePrompts(event) {
  localStorage.setItem("last_text", p_en.innerText);
  startCountdown(document.getElementById("bt_save"));
}

// 复制提示词
function copyPrompt(event) {
  let textToCopy = document.getElementById("p_en").innerText;
  navigator.clipboard
    .writeText(textToCopy)
    .then(function () {
      startCountdown(document.getElementById("bt_copy"), "复制成功");
    })
    .catch(function (error) {
      console.error("无法写入剪贴板:", error);
      startCountdown(document.getElementById("bt_copy"), "失败");
    });
}

// 粘贴提示词
function pastePrompt(event) {
  navigator.clipboard
    .readText()
    .then(function (clipboardText) {
      document.getElementById("p_en").innerText = clipboardText;
      prompts_format();
      startCountdown(document.getElementById("bt_paste"), "成功");
      translateToChinese(); // 翻译成中文
      localStorage.setItem("last_text", clipboardText); //  保存到最后一次
    })
    .catch(function (error) {
      console.error("无法访问剪贴板:", error);
      startCountdown(document.getElementById("bt_paste"), "失败");
    });
}

// 防抖函数，用于减少频繁触发API请求
function debounce(func, delay) {
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

document.querySelectorAll("button").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});

document.querySelectorAll(".commonds_wrap > div").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});

function button_mouseover(event) {
  let anchorElem = event.target.closest("[data-tooltip]");
  if (!anchorElem) return;
  tooltip = showTooltip(anchorElem, anchorElem.dataset.tooltip);
}

function button_mouseout(event) {
  if (tooltip) {
    tooltip.remove();
    tooltip = false;
  }
}

function showTooltip(anchorElem, html) {
  let tooltipElem = document.createElement("div");
  tooltipElem.className = "tooltip";
  tooltipElem.innerHTML = html;
  document.body.append(tooltipElem);

  let coords = anchorElem.getBoundingClientRect();

  // position the tooltip over the center of the element
  let left =
    coords.left + (anchorElem.offsetWidth - tooltipElem.offsetWidth) / 2;
  if (left < 0) left = 0;

  let top = coords.top - tooltipElem.offsetHeight - 5;
  if (top < 0) {
    top = coords.top + anchorElem.offsetHeight + 5;
  }

  tooltipElem.style.left = left + "px";
  tooltipElem.style.top = top + "px";

  return tooltipElem;
}

// 延迟加载图片
function delayedImageLoading(event) {
  const images = document.querySelectorAll("img[data-src]");
  images.forEach(function (img) {
    img.onload = function () {
      img.parentElement.classList.remove("load");
    };
    // 将图片的src设置为data-src以开始加载
    img.src = img.getAttribute("data-src");
  });
}
