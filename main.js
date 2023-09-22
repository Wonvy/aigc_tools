import { translate_API } from "./js/translate.js";
import { uuid, random_bkcolor, startCountdown } from "./js/func.js";
import {
  prompts_DeleteCommand,
  prompts_GetCommand,
  prompts_splitwords,
} from "./js/prompts.js";

const p_zh = document.getElementById("p_zh"); // 英文指令编辑区
const p_en = document.getElementById("p_en"); // 中文指令编辑区
const bt_zh = document.getElementById("bt_zh"); // 中文翻译按钮
const bt_en = document.getElementById("bt_en"); // 英文翻译按钮
const word_edit_ul = document.querySelector("#word_edit ul");
let lastparent_uuid = "";
let currenuuid;
let Translated;

// 延迟加载图片
window.addEventListener("load", function () {
  const images = document.querySelectorAll("img[data-src]");
  images.forEach(function (img) {
    img.onload = function () {
      img.parentElement.classList.remove("load");
    };
    // 将图片的src设置为data-src以开始加载
    // img.src = img.getAttribute("data-src");
  });
});

// 载入最后一次指令
const last_text = localStorage.getItem("last_text");
if (last_text === "") {
} else {
  p_en.innerText = localStorage.getItem("last_text");
  p_zh.innerText = localStorage.getItem(last_text);
}

// 添加所选关键词
document
  .getElementById("view_bar-add")
  .addEventListener("click", function (event) {
    const lis = document.querySelectorAll("#full_screen li.selected");
    let words_zh, words_en;
    lis.forEach((li) => {
      words_zh = li.dataset.zh + "," + words_zh;
      words_en = li.dataset.en + "," + words_en;
    });

    if (p_zh.textContent.length === 0) {
      p_zh.textContent = words_zh;
    } else {
      p_zh.textContent += ", " + words_zh;
    }

    if (p_en.textContent.length === 0) {
      p_en.textContent = words_en;
    } else {
      p_en.textContent += ", " + words_en;
    }

    let full_screen = document.getElementById("full_screen");
    full_screen.style.zIndex = "-99";
  });

// 全屏显示并加载json
document.getElementById("bt_add").addEventListener("click", function (event) {
  let full_screen = document.getElementById("full_screen");
  full_screen.style.zIndex = "99";
  let imagelist2 = document.getElementById("imagelist2");
  fetch("data.json")
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      renderJSON(imagelist2, data);
    })
    .catch((error) => {
      console.error("加载 JSON 文件时出错：", error);
    });
});

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
        li.dataset.zh = key3;
        li.dataset.en = data["关键词"][key][key2][key3];

        li.appendChild(h2);
        ul.appendChild(li);
        // console.log("key3", key3);
        // console.log("key4", data["关键词"][key][key2][key3]);
      }
    }
  }
  var childNodes = div.childNodes;
  for (var i = 0; i < childNodes.length; i++) {
    container.appendChild(childNodes[i].cloneNode(true));
  }
}

// 取消选择
document
  .getElementById("view_bar-unselect")
  .addEventListener("click", function (event) {
    const result = window.confirm("您确定要执行此操作吗？");
    if (result) {
      const lis = document.querySelectorAll("#full_screen .selected");
      lis.forEach((li) => {
        li.classList.remove("selected");
      });
    }
  });

prompts_format(); // 格式化描述词
AddSplitWords(); // 添加拆分词

let tooltip;
let ctrlPressed = false;

p_en.onmouseover = function (event) {
  let anchorElem = event.target.closest("[data-tooltip]");
  if (!anchorElem) return;
  // tooltip = showTooltip(anchorElem, anchorElem.dataset.tooltip);
};

p_en.onmouseout = function () {
  if (tooltip) {
    tooltip.remove();
    tooltip = false;
  }
};

// 显示提示
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

// 键盘弹起
document.addEventListener("keyup", function (event) {
  // 检查是否释放 Ctrl 键
  if (event.keyCode === 17) {
    ctrlPressed = false;
  }
});

// 添加键盘事件监听器
document.addEventListener("keydown", function (event) {
  // 检查是否按下 Ctrl 键 (键码为 17)
  if (event.keyCode === 17) {
    ctrlPressed = true;
  }

  // 检查是否按下 ESC 键 (键码为 27)
  if (event.keyCode === 27) {
    // 处理 ESC 键事件
    let full_screen = document.getElementById("full_screen");
    full_screen.style.zIndex = "-99";
  }

  // 检查是否按下 `~` 键 (键码为 192)
  if (event.keyCode === 192) {
    // 处理 `~` 键事件
    let full_screen = document.getElementById("full_screen");
    full_screen.style.zIndex = "99";
  }
});

document
  .getElementById("full_screen")
  .addEventListener("click", function (event) {
    // console.log(event.target.tagName);
    // console.log(event);
    let full_screen = document.getElementById("full_screen");

    if (event.target.tagName === "DIV") {
      let full_screen = document.getElementById("full_screen");
      full_screen.style.zIndex = "-99";
      return;
    }

    if (event.target.tagName === "H2") {
      const li = event.target.parentElement;
      if (li.tagName === "LI") {
        li.classList.toggle("selected");
      }
      return;
    }

    if (event.target.tagName === "IMG") {
      const li = event.target.parentElement.parentElement;
      if (li.tagName === "LI") {
        li.classList.toggle("selected");
      }
    }
  });

// 取消选择
function unselect() {}

// 点击弹出关键词列表
document
  .querySelector("#full_screen button.close")
  .addEventListener("click", function (event) {
    let full_screen = document.getElementById("full_screen");
    full_screen.style.zIndex = "-99";
  });

// 保存按钮 单击事件
document.getElementById("bt_save").addEventListener("click", function (event) {
  localStorage.setItem("last_text", p_en.innerText);
  startCountdown(document.getElementById("bt_save"));
});

// 复制按钮 单击事件
document.getElementById("bt_copy").addEventListener("click", function (event) {
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
});

// 粘贴按钮 单击事件
document.getElementById("bt_paste").addEventListener("click", function (event) {
  navigator.clipboard
    .readText()
    .then(function (clipboardText) {
      document.getElementById("p_en").innerText = clipboardText;
      prompts_format();
      startCountdown(document.getElementById("bt_paste"), "成功");
      bt_en_translate(); // 翻译成中文
      localStorage.setItem("last_text", clipboardText); //  保存到最后一次
    })
    .catch(function (error) {
      console.error("无法访问剪贴板:", error);
      startCountdown(document.getElementById("bt_paste"), "失败");
    });
});

// 中文翻译按钮 单击事件
bt_zh.addEventListener("click", function (event) {
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
});

// 英文翻译按钮 单击事件
bt_en.addEventListener("click", bt_en_translate);

function bt_en_translate() {
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
    translate_API(text_en, true, "ZH")
      .then((result) => {
        let result_text = result.translations[0].text;
        localStorage.setItem(text_en, result_text); // 存储翻译结果到本地
        p_zh.innerText = result_text; // 替换内容
        prompts_format(); // 拆分段落
        AddSplitWords();
      })
      .catch((error) => {
        console.error("translate_API翻译出错:", error);
      });
  }
}

// 英文指令编辑区 鼠标移入事件
p_en.addEventListener("mouseover", function (event) {
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
});

// 英文指令编辑区 鼠标移出事件
p_en.addEventListener("mouseout", function (event) {
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
});

//格式化提示词
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

//添加拆分词
function AddSplitWords() {
  const sentenceSpans = p_en.querySelectorAll("span");
  sentenceSpans.forEach((span) => {
    const li = document.createElement("li");
    const i = document.createElement("i");
    i.innerText = span.innerText;
    const span1 = document.createElement("span");
    li.setAttribute("uuid", span.getAttribute("uuid"));
    span1.innerText = localStorage.getItem(span.innerText);
    li.style.backgroundColor = random_bkcolor(0);
    li.appendChild(i);
    li.appendChild(span1);
    word_edit_ul.appendChild(li);
  });
}
