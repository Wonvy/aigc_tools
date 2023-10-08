"use strict";
console.log("严格模式:", this === undefined); // 输出 true 表示严格模式启用

import { translate_API, translate_tmt } from "./js/translate.js";
import { Resize } from "./js/ui.js";
import {
  getById,
  getElement,
  uuid,
  sha256,
  random_bkcolor,
  startCountdown,
  getCurrentDateTime
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
const ul_en = getById("ul_en"); // 英文翻译按钮
const ul_zh = getById("ul_zh"); // 英文翻译按钮

const line_en = getElement("#word_edit_en ul");
const line_zh = getElement("#word_edit ul");

let show_en = false;
// 元素拖拽

let lastparent_uuid = "";
let currenuuid, Translated;
let tooltip;
let ctrlPressed = false;
const leftDiv = document.getElementById("word_edit_en");
const rightDiv = document.getElementById("word_edit");

// 记录左右两个 div 的滚动状态
let isLeftScrolling = false;
let isRightScrolling = false;

// 处理双击事件
let clicks = 0;
let timer2;

let timeoutId;
let status_bar = getElement(".zh_wrap .status_bar");

// 初始化JSON数据
let g_JSONdata;
let storedData;


// 提示词收藏夹
const Prompt_favorites = {

  // 渲染
  render: function (ul, item) {
    let li = document.createElement('li');
    let h2 = document.createElement('h2');
    let p = document.createElement('p');
    let h2_p = document.createElement('p');
    let span = document.createElement('span');
    h2_p.innerHTML = `<i class="li_edit fa-solid fa-pen"></i><i class="del fa-solid fa-trash-can"></i>`
    span.textContent = item.time;
    h2.appendChild(span);
    h2.appendChild(h2_p);
    if (show_en) {
      p.textContent = item.en;
    } else {
      p.textContent = item.zh;
    }
    p.dataset.zh = item.zh;
    p.dataset.en = item.en;
    li.appendChild(h2);
    li.appendChild(p);
    li.dataset.uuid = item.uuid;
    ul.appendChild(li);
    return li;
  },


  // 加载
  load: function () {
    storedData = JSON.parse(localStorage.getItem('storedData')) || [];
    let ul = document.querySelector('#full_version .wrap ul');
    while (ul.firstChild) { ul.removeChild(ul.firstChild); }
    storedData.forEach(function (item) {
      this.render(ul, item);
    }.bind(this));
  },


  // 导入
  import: function (event) {
    var fileInput = document.getElementById('file-input');
    var file = fileInput.files[0];
    var self = this; // 保存Prompt_favorites对象的引用
    if (file) {
      var reader = new FileReader();
      reader.onload = function (event) {
        try {
          let jsonData = JSON.parse(event.target.result); // 解析JSON数据       
          storedData = jsonData; // 替换全局的data变量
          console.log('替换后的data:', storedData); // 打印替换后的data
          localStorage.setItem('storedData', JSON.stringify(storedData));
          Prompt_favorites.load();
        } catch (error) {
          console.error('无法解析JSON文件:', error);
        }
      };
      reader.readAsText(file);
    } else {
      console.error('未选择文件');
    }
  },

  // 是否包含指定的uuid
  has_uuid: function (uuidstr) {
    console.log("uuidstr", uuidstr);
    if (!uuidstr) {
      return false
    };
    const isUuidExist = storedData.some(item => item.uuid === uuidstr);
    if (isUuidExist) {
      return true;
    } else {
      return false;
    }
  },


  // 添加
  add: function (item) {
    storedData.push(item);
    let ul = document.querySelector('#full_version .wrap ul');
    let li = this.render(ul, item);
    li.scrollIntoView();
    localStorage.setItem('storedData', JSON.stringify(storedData));
  },

  // 删除
  del: function (uuid) {
    storedData = removeRecordByUUID(storedData, uuid);
    localStorage.setItem('storedData', JSON.stringify(storedData));

    function removeRecordByUUID(jsonArray, uuid) {
      return jsonArray.filter(item => item.uuid !== uuid);
    }

    // function replaceRecordByUUID(jsonArray, newRecord, uuid) {
    //   return jsonArray.map(item => {
    //     if (item.uuid === uuid) {
    //       // 如果uuid匹配，替换记录的字段
    //       return {
    //         time: newRecord.time || item.time,
    //         en: newRecord.en || item.en,
    //         zh: newRecord.zh || item.zh,
    //         hash: newRecord.hash || item.hash,
    //         uuid: item.uuid // 保持原有的uuid
    //       };
    //     }
    //     return item; // 如果uuid不匹配，保持原有的记录
    //   });
    // }


  },

  // 导出
  export: function () {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    const fileName = `PromptData_${year}-${month}-${day}(${hours}-${minutes}-${seconds}).json`;

    let data = JSON.stringify(storedData);
    let blob = new Blob([data], { type: 'text/plain' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    // 释放URL对象
    URL.revokeObjectURL(url);
  },

  // 编辑
  edit: function (uuid, new_item) {
    let newdata2 = replaceRecordByUUID(storedData, new_item, uuid);

    localStorage.setItem('storedData', JSON.stringify(newdata2));

    // 修改已加载的li
    let li = document.querySelector(`#full_version li[data-uuid="${uuid}"]`);
    if (!li) { return }
    li.innerHTML = `
    <h2>
      <span>${new_item.time}</span>
      <p>
        <i class="li_edit fa-solid fa-pen"></i>
        <i class="del fa-solid fa-trash-can"></i>
      </p>
    </h2>
    <p data-zh="${new_item.zh}" data-en="${new_item.en}">
      ${show_en ? new_item.en : new_item.zh}
    </p>`

    function replaceRecordByUUID(jsonArray, newRecord, uuid) {
      return jsonArray.map(item => {
        if (item.uuid === uuid) {
          // 如果uuid匹配，替换记录的字段
          return {
            time: newRecord.time || item.time,
            en: newRecord.en || item.en,
            zh: newRecord.zh || item.zh,
            hash: newRecord.hash || item.hash,
            uuid: item.uuid // 保持原有的uuid
          };
        }
        return item; // 如果uuid不匹配，保持原有的记录
      });
    }
  },

  // 清空所有
  clearAll: function () {
    const isConfirmed = confirm("确定要清空所有的提示词吗？");
    if (isConfirmed) {
      storedData = [];
      localStorage.setItem('storedData', JSON.stringify(storedData));
      Prompt_favorites.load();
    }
  }

}



// 提示词相关
const Prompt = {
  // 载入最后一次使用的提示词
  load_last: function () {
    const last_text = localStorage.getItem("last_text");
    if (last_text === "") {
    } else {
      getById("p_en").innerText = last_text;
      Translates.toZH();
      // translate_tmt(last_text, "en", "zh").then((result) => {
      // getById("p_zh").innerText = result.translation;
      // Prompt.format_Word(); // 拆分段落
      // prompt_split_add();
      // });
      // getById("p_zh").innerText = localStorage.getItem(last_text);
    }
  },

  // 清空提示词
  clear: function (event) {


    p_en.innerHTML = "";
    p_zh.innerHTML = "";
    localStorage.setItem("last_text", "");
    while (ul_en.firstChild) {
      ul_en.removeChild(ul_en.firstChild);
    }

    while (ul_zh.firstChild) {
      ul_zh.removeChild(ul_zh.firstChild);
    }
    const uuidstr = uuid();
    p_en.dataset.uuid = uuidstr;
    p_zh.dataset.uuid = uuidstr;

    const lis = document.querySelectorAll("li.selected");
    lis.forEach((li) => {
      li.classList.remove("selected");
    });
  },

  // 格式化提示词
  format_Sentence: function (prompts = "") {
    prompts === "" ? (prompts = p_en.textContent) : (prompts = "");
    prompts = prompts_DeleteCommand(prompts);
    const commands = prompts_GetCommand(p_en.textContent);

    // 指令标签
    let strongs = "";
    if (commands && commands.length > 0) {
      strongs = commands
        .map((command) => {
          return `<strong uuid="${uuid()}">${command}</strong>`;
        })
        .join("");
    }

    // 描述词标签
    const text_spans = prompts_splitwords(prompts);
    if (!text_spans || text_spans.length <= 0) { return };

    p_en.innerHTML = text_spans.map((text_span) => {
      return `<span data-tooltip="" uuid="${uuid()}">${text_span}</span>`;
    }).join("") + strongs;

    // 拆词
    const spans = p_en.querySelectorAll("span");
    spans.forEach((span) => {
      let words = span.textContent.split(" "); // 翻译单词
      span.innerHTML = words
        .map((word) => {
          if (word.trim() !== "") {
            Translated = localStorage.getItem(word);
            if (!Translated) {
              translate_API(word).then((result) => {
                let result_text = result.translations[0].text;
                console.log(word, result_text);
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
  },

  // 格式化提示词
  format_Word: function (prompts = "") {
    prompts === "" ? (prompts = p_en.textContent) : (prompts = "");
    prompts = prompts_DeleteCommand(prompts);
    const commands = prompts_GetCommand(p_en.textContent);

    // 指令标签
    let strongs = "";
    if (commands && commands.length > 0) {
      strongs = commands
        .map((command) => {
          return `<strong uuid="${uuid()}">${command}</strong>`;
        })
        .join("");
    }

    // 描述词标签
    const text_spans = prompts_splitwords(prompts);
    if (!text_spans || text_spans.length <= 0) { return };

    p_en.innerHTML = text_spans.map((text_span) => {
      return `<span data-tooltip="" uuid="${uuid()}">${text_span}</span>`;
    }).join("") + strongs;

    // 拆词
    const spans = p_en.querySelectorAll("span");
    spans.forEach((span) => {
      let words = span.textContent.split(" "); // 翻译单词
      span.innerHTML = words
        .map((word) => {
          if (word.trim() !== "") {
            Translated = localStorage.getItem(word);
            if (!Translated) {
              translate_API(word).then((result) => {
                let result_text = result.translations[0].text;
                console.log(word, result_text);
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
  },



  // 保存提示词
  save: function (event) {
    let uuidtext = p_en.dataset.uuid;
    if (!uuidtext) {
      p_en.dataset.uuid = uuid();
      uuidtext = p_en.dataset.uuid;
    }

    console.log("uuid: ", uuidtext)
    sha256(p_en.innerText).then(hash => {

      // 判断uuid是否存在
      console.log("has", Prompt_favorites.has_uuid(uuidtext))
      if (Prompt_favorites.has_uuid(uuidtext)) {
        let item = {
          "time": getCurrentDateTime(),
          "en": p_en.innerText,
          "zh": p_zh.innerText,
          "hash": hash,
          "uuid": uuidtext
        };
        Prompt_favorites.edit(uuidtext, item);
      } else {
        let item = {
          "time": getCurrentDateTime(),
          "en": p_en.innerText,
          "zh": p_zh.innerText,
          "hash": hash,
          "uuid": uuidtext
        };
        Prompt_favorites.add(item);
        startCountdown(document.getElementById("bt_save"));
      }
    });

  },

  // 复制提示词
  copy: function (event) {
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
  },

  // 粘贴提示词
  paste: function (event) {
    navigator.clipboard
      .readText()
      .then(function (clipboardText) {
        // 清空p标签
        while (p_en.firstChild) { p_en.removeChild(p_en.firstChild); }
        while (line_en.firstChild) {
          line_en.removeChild(line_en.firstChild)
        };
        while (line_zh.firstChild) {
          line_zh.removeChild(line_zh.firstChild)
        };
        const uuidstr = uuid();
        p_en.dataset.uuid = uuidstr;
        p_zh.dataset.uuid = uuidstr;
        document.getElementById("p_en").innerText = clipboardText;
        startCountdown(document.getElementById("bt_paste"), "成功");
        Translates.toZH(); // 翻译成中文
        localStorage.setItem("last_text", clipboardText); //  保存到最后一次
      })
      .catch(function (error) {
        console.error("无法访问剪贴板:", error);
        startCountdown(document.getElementById("bt_paste"), "失败");
      });
  },

  // 修改提示词
  command_replace: function (sourceText, regexPattern, replacementText) {
    var regex = new RegExp(regexPattern, "g");
    if (regex.test(sourceText)) {
      sourceText = sourceText.replace(regex, replacementText);
    } else {
      sourceText += " " + replacementText;
    }
    return sourceText;
  },

  // 中文提示词转为多行
  zh_MultiLine: function () {
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
        li.dataset.en = "111";
        li.dataset.zh = "222";
        li.textContent = line.trim();
        ul.appendChild(li);
      }
    });
    ul_local.innerHTML = ul.innerHTML;
  },

  // 中文提示词转为多行
  en_MultiLine: function () {
    const text = getById("p_en").innerText;
    // const punctuations = [",", "，", ".", "。", "、", ";", "；"];
    const punctuations = [".", ",", "，", "。", "、", ";", "；"];
    const lines = text.split(new RegExp(`[${punctuations.join("")}]`));
    const ul = document.createElement("ul");
    const ul_local = document.querySelector("#en_tabs .tab2 ul");
    lines.forEach((line) => {
      if (line.trim() !== "") {
        const li = document.createElement("li");
        li.style.backgroundColor = random_bkcolor(1);
        li.setAttribute("draggable", "true");
        li.dataset.en = "111";
        li.dataset.zh = "222";
        li.textContent = line.trim();
        ul.appendChild(li);
      }
    });
    ul_local.innerHTML = ul.innerHTML;
  }

}

// 提示关键词
const PromptWords = {

  // 载入提示词库
  load: function (event) {
    const bt_title = event.target.dataset.name;
    let full_screen = getById("full_screen");
    let imagelist2 = getById("imagelist2");

    JSONS.render(imagelist2, g_JSONdata);

    getById("temp_en_edit").innerHTML = getById("p_en").innerHTML;
    document.querySelector("h3[data-title=" + bt_title + "]").scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    full_screen.classList.add("ontop");
  },

  // 添加所选关键词
  add_selected: function (event) {
    const lis = document.querySelectorAll("#full_screen li.selected");
    const full_screen = getById("full_screen")
    lis.forEach((li) => {
      const bkcolor = random_bkcolor(1);
      checkElementType(p_en, li.dataset.en, "add", li.dataset.en, bkcolor);
      checkElementType(p_zh, li.dataset.zh, "add", li.dataset.en, bkcolor);
      checkElementType(ul_en, li.dataset.en, "add", li.dataset.en);
      checkElementType(ul_zh, li.dataset.zh, "add", li.dataset.en);
    });
    full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop")
  },

  // 取消所选提示词
  unselect: function (event) {
    const result = window.confirm("您确定要执行此操作吗？");
    if (result) {
      getById("temp_en_edit").innerText = "";
      const lis = document.querySelectorAll("#full_screen .selected");
      lis.forEach((li) => {
        li.classList.remove("selected");
      });
    }
  },

  // 高亮鼠标经过的提示词
  highlight_hover: function (event) {
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
  },

  // 取消提示词高亮
  highlight_clear: function (event) {
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

}

// JSON相关
const JSONS = {

  // 初始化
  init: function () {
    return new Promise((resolve, reject) => {
      fetch("data.json")
        .then((response) => response.json())
        .then((data) => {
          g_JSONdata = data; // 将数据存储在全局变量 g_JSONdata 中
          resolve(data); // 数据获取成功，将数据传递给 resolve 函数
        })
        .catch((error) => {
          console.log("json error", error);
          reject(error); // 数据获取失败，将错误信息传递给 reject 函数
        });
    });
  },

  // 渲染 JSON 数据的函数
  render: function (container, data) {
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
          const li = document.createElement("li");
          const h4 = document.createElement("h4");
          const span = document.createElement("span");
          const img = document.createElement("img");

          h4.textContent = data["关键词"][key][key2][key3].content;
          span.textContent = key3;
          // h2.appendChild(span);
          li.dataset.en = key3;
          li.dataset.zh = data["关键词"][key][key2][key3].content;
          img.dataset.src = data["关键词"][key][key2][key3].img;
          img.setAttribute("src", "./img/placeholder.png");
          h4.appendChild(span);
          li.appendChild(h4);
          li.appendChild(img);
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

    let images = container.querySelectorAll(`img[data-src]`);
    images.forEach(function (img) {
      let dataSrc = img.dataset.src;
      if (dataSrc) {
        img.src = dataSrc;
      }
    });
  },

  // 通过关键词找 替换元素 数据库 查询关键词
  render_search: function (keyword) {
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

            h4.textContent = value4.content;
            span.textContent = key4;
            li.dataset.tooltip = key4;
            li.dataset.cn = value4.content;
            li.dataset.en = key4;
            img.dataset.src = value4.img;
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

    let images = document.querySelectorAll(`.div_after div[data-name="${keyword}"] img[data-src]`);
    images.forEach(function (img) {
      // console.log(img);
      let dataSrc = img.dataset.src;
      if (dataSrc) {
        // console.log(dataSrc);
        img.src = dataSrc;
      }
    });
  }



}

// 翻译相关
const Translates = {
  // 翻译为中文
  toZH: function () {
    let text_en = p_en.textContent;

    // 清空p标签
    while (p_zh.firstChild) {
      p_zh.removeChild(p_zh.firstChild);
    }
    while (line_zh.firstChild) {
      line_zh.removeChild(line_zh.firstChild);
    }

    p_zh.innerText = "正在翻译···"

    //翻译
    Translated = localStorage.getItem(text_en);
    if (Translated) {
      p_zh.innerText = Translated;
      // Prompt.format_Word(); // 拆分段落
      prompt_split_add();
    } else {

      translate_API(text_en, "en", "zh")
        .then((result) => {
          let result_text = result.translations[0].text;
          localStorage.setItem(text_en, result_text); // 存储翻译结果到本地
          p_zh.innerText = result_text; // 替换内容
          Prompt.en_MultiLine(); //多行布局
          Prompt.zh_MultiLine(); //多行布局
          // Prompt.format_Word(); // 拆分段落
          // prompt_split_add();
        })
        .catch((error) => {
          console.error("translate_API翻译出错:", error);
        });;
    }
  },

  // 翻译为英文
  toEN: function () {
    let p_zh = document.getElementById("p_zh").textContent;
    //翻译
    Translated = localStorage.getItem(p_zh);

    // 清空
    while (p_en.firstChild) {
      p_en.removeChild(p_zh.firstChild);
    }
    while (line_en.firstChild) {
      line_en.removeChild(line_en.firstChild);
    }


    if (Translated) {
      p_en.innerText = Translated;
      // Prompt.format_Word(); // 拆分段落
      // prompt_split_add();
    } else {
      translate_API(p_zh, "ZH", "EN", true)
        .then((result) => {
          let result_text = result.translations[0].text;
          localStorage.setItem(p_zh, result_text);
          p_en.innerText = result_text;
          // Prompt.format_Word();
          // prompt_split_add();
        })
        .catch((error) => {
          console.error("translate_API翻译出错:", error);
        });
    }
  },

  // 实时翻译
  live: function (event) {
    const text = p_zh.innerText;
    translate_API(text, "zh", "en", true).then((result) => {
      p_en.innerText = result.translations[0].text;
    });
  },
}

JSONS.init()
Prompt_favorites.load();
// console.log("Prompt_favorites", storedData)


// wheel 鼠标滚轮
document.querySelectorAll(".div_after > div").forEach(function (div) {
  div.addEventListener("wheel", tab_wheel, { passive: true });
});


getElement(".zh_wrap .status_bar").addEventListener("wheel", tab_wheel, { passive: true });
// 添加鼠标滚轮事件监听器
function tab_wheel(event) {
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

status_bar.addEventListener("mouseover", (event) => {
  timeoutId = setTimeout(() => {
    tab_switch(event);
  }, 200);
});
status_bar.addEventListener("mouseout", () => {
  clearTimeout(timeoutId);
});

//#ul_zh click
document.querySelector("#ul_zh").addEventListener("click", function (event) {
  const li = event.target.closest("li");
  if (!li) { return };
  const lis = document.querySelectorAll("#ul_zh li.clicked");
  lis.forEach((li1) => {
    li1.classList.remove("clicked");
  });
  li.classList.toggle("clicked")
})

//#ul_en click
document.querySelector("#ul_en").addEventListener("click", function (event) {
  const li = event.target.closest("li");
  if (!li) { return };
  let q = li.innerText;
  const lis = document.querySelectorAll("#ul_en li.clicked");
  lis.forEach((li1) => {
    if (li !== li1) {
      li1.classList.remove("clicked");
    }
  });
  li.classList.toggle("clicked")
  let iframe = document.querySelector("iframe");
  let url1 = `https://lexica.art/?q=${q}`
  let url2 = `https://prompthero.com/search?model=Midjourney&q=${q}`
  iframe.src = url1;
  let left = iframe.closest(".left")
  const info = left.querySelector(".info")


  const hasclicked = document.querySelector("#ul_en li.clicked");
  if (hasclicked) {
    info.classList.add("on")
    left.classList.add("on")

  } else {
    info.classList.contains("on") && info.classList.remove("on")
    left.classList.contains("on") && left.classList.remove("on")
  }

})


// .left mouseover
document.querySelector("#main .left").addEventListener("mouseover", function (event) {
  let left = document.querySelector("#main .left");
  left.classList.contains("on") && left.classList.remove("on")
})


// 监听 iframe 的 load 事件
document.querySelector("iframe").addEventListener('load', function () {
  let info = document.querySelector("#main .left .info");
  info.classList.contains("on") && info.classList.remove("on")
  console.log('外链网页加载完成！');
});


// tab切换
function tab_switch(event) {
  const button = event.target.closest("button");

  if (button) {
    const name = button.dataset.tab;
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
        if (PromptWords.unselect.childElementCount === 0) {
          JSONS.render_search(button.dataset.tab);
        }
      } else {
        JSONS.render_search(button.dataset.tab);
      }
    }
  }
}

//click 点击构图
getElement(".div_after").addEventListener("click", composition_click);
getElement(".right").addEventListener("click", composition_click);
function composition_click(event) {
  let li;
  if (event.target.tagName === "LI") {
    li = event.target;
  } else {
    li = event.target.closest("li");
  }

  if (!li) {
    return;
  }

  li.classList.toggle("selected");
  let isSelected = li.classList.contains("selected");
  if (isSelected) {
    const bkcolor = random_bkcolor(1);
    checkElementType(p_en, li.dataset.en, "add", li.dataset.en);
    checkElementType(p_zh, li.dataset.cn, "add", li.dataset.en);
    checkElementType(ul_en, li.dataset.en, "add", li.dataset.en, bkcolor);
    checkElementType(ul_zh, li.dataset.cn, "add", li.dataset.en, bkcolor);
  } else {
    checkElementType(p_en, li.dataset.en, "del");
    checkElementType(p_zh, li.dataset.cn, "del");
    checkElementType(ul_en, li.dataset.en, "del");
    checkElementType(ul_zh, li.dataset.cn, "del");
  }
}

function checkElementType(
  node,
  word,
  operation,
  langEN = "",
  bkcolor = "#333",
) {
  let searchText;
  if (node.nodeType !== 1) {
    return;
  }
  // console.log(node.textContent, word, operation);
  switch (node.tagName) {
    case "P":
      const Text = node.textContent;
      searchText = "," + word;
      const hastext = Text.includes(searchText); // 是否包含文本

      if (operation === "add" && hastext === false) {
        node.textContent = add_keyword(Text, searchText);
      } else if (operation === "del" && hastext) {
        node.textContent = Text.replace(searchText, "");
      }
      break;

    case "UL":
      searchText = word;
      const liElements = node.querySelectorAll("li");

      if (operation === "add") {
        const li = document.createElement("li");
        li.setAttribute("draggable", "true");
        li.dataset.en = langEN;
        li.style.backgroundColor = bkcolor;
        li.innerText = word;
        node.appendChild(li);
      } else if (operation === "del") {
        liElements.forEach((li) => {
          const liText = li.textContent || li.innerText;
          if (liText.includes(searchText)) {
            node.removeChild(li);
          }
        });
      }
      break;
  }
}

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
      // console.log(extract);

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
Prompt.load_last();

// 所选字体显示为大字号
getById("imagelist2").addEventListener("mouseover", setFontToLargeSize);
getElement(".commonds_wrap").addEventListener("change", comman_click);
getElement(".commonds_wrap").addEventListener("input", commond_input);

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
    // console.log(
    //   event.target.name,
    //   event.target.dataset.paramName,
    //   event.target.value,
    // );
    const commond = paramName + " " + event.target.value;
    let commond_after = Prompt.command_replace(
      promptcontent,
      paramName + "\\s+[^\\s]+",
      commond,
    );
    p_en.innerText = commond_after;
    // console.log(commond_after);
  }
  if (tagname === "INPUT") {
    // console.log(event.target.name, event.target.value);
    // alert(event.target.value);
  }
}


// 提示词多行显示
document.querySelectorAll(".tab-container").forEach(function (div) {
  div.addEventListener("click", prompt_switch_multiLine);
});

// 添加所选提示词-确定
getById("view_bar-add").addEventListener("click", PromptWords.add_selected);

// 载入提示词库
getById("bt_add").addEventListener("click", PromptWords.load);
getElement(".zh_wrap .status_bar").addEventListener(
  "click",
  PromptWords.load,
);

getById("view_bar-unselect").addEventListener("click", PromptWords.unselect); // 取消所选提示词
bt_en.addEventListener("click", Translates.toZH); // 翻译为中文
bt_zh.addEventListener("click", Translates.toEN); // 翻译为英文

// 高亮/取消鼠标经过的提示词
p_en.addEventListener("mouseover", PromptWords.highlight_hover);
p_en.addEventListener("mouseout", PromptWords.highlight_clear);

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

document.addEventListener("keyup", keyupEvent); // 键盘弹起
document.addEventListener("keydown", keydownEvent); // 键盘按下

// 全屏点击
getById("full_screen").addEventListener("click", fullScreen_click);

// 关闭提示词弹窗
getElement("#full_screen button.close").addEventListener(
  "click",
  full_screenclose,
);

getById("bt_save").addEventListener("click", Prompt.save); // 保存
getById("bt_copy").addEventListener("click", Prompt.copy); // 复制
getById("bt_paste").addEventListener("click", Prompt.paste); // 粘贴
getById("bt_clear").addEventListener("click", Prompt.clear); // 清空


// 设置输入框焦点
p_zh.focus();
getById("zh_tabs").addEventListener("click", function (event) {
  p_zh.focus();
});
getById("en_tabs").addEventListener("click", function (event) {
  p_en.focus();
});

// 实时翻译
getById("p_zh").addEventListener("input", debounce(Translates.live, 500));


// 所选字体显示为大字号
function setFontToLargeSize(event) {
  let li;

  if (event.target.tagName === "LI") {
    li = event.target;
  } else {
    li = event.target.closest("li");
  }

  if (!li) { return };

  getById("zh_preview").innerText = li.dataset.zh;
  getById("en_preview").innerText = li.dataset.en;
  let image = document.querySelector("#fixed-header img");
  let src = li.querySelector("img");
  image.src = src.dataset.src;
  // let randomParam = Math.random(); // 生成一个随机数作为参数
  // image.src = "https://picsum.photos/200?" + randomParam;

}

// 提示词多行显示
function prompt_switch_multiLine(event) {
  const tagName = event.target.tagName;
  let li = event.target.closest("li");

  if (!li) { return }
  if (tagName === "LI") { li = event.target; }
  if (tagName === "I") { li = event.target.parentElement; }

  // 获取所在的ul
  const enzh = li.closest("ul").dataset.class;
  const tabtext = li.dataset.tab;
  const tabclass = li.dataset.class;

  if (enzh === "zh") { Prompt.zh_MultiLine() };// 转成多行
  if (enzh === "en") { Prompt.en_MultiLine() };// 转成多行

  const nav = document.querySelector(`.${enzh}_wrap .active`);
  nav && nav.classList.remove("active");

  const current_tab = document.querySelector(`.${enzh}_wrap [data-tab=${tabtext}]`);
  current_tab && current_tab.classList.add("active");
  const tab = document.querySelector(`#${enzh}_tabs .ontop`);
  tab && tab.classList.remove("ontop");
  document.querySelector(`#${enzh}_tabs .${tabtext}`).classList.add("ontop");
}

// 添加拆分词
function prompt_split_add() {
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

// 全屏点击
function fullScreen_click(event) {
  const temp_en_edit = getById("temp_en_edit");
  let li;
  let full_screen = getById("full_screen");

  if (event.target.tagName === "DIV") {
    full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop");
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

  // 检查是否按下了Ctrl键（或Cmd键）
  let isCtrl = event.ctrlKey || event.metaKey;

  // 检查是否按下 Ctrl 键 (键码为 17)
  if (event.keyCode === 17) {
    ctrlPressed = true;
  }

  // 检查是否同时按下了S键
  if (isCtrl && event.key === 's') {
    event.preventDefault();
    Prompt.save();
  }

  // 检查是否按下 ESC 键 (键码为 27)
  if (event.keyCode === 27) {
    // 处理 ESC 键事件
    let full_screen = getById("full_screen");
    full_screen.classList.add("ontop")
  }

  // 检查是否按下 `~` 键 (键码为 192)
  if (event.keyCode === 192) {
    // 处理 `~` 键事件
    let full_screen = getById("full_screen");
    full_screen.classList.add("ontop")
  }
}

// 关闭提示词弹窗
function full_screenclose(event) {
  let full_screen = document.getElementById("full_screen");
  full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop")
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

document.querySelectorAll(".div_after img").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});

document.querySelectorAll(".commonds_wrap > div").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});

document.querySelectorAll(".tab-container ul li").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});






// 按钮停留
function button_mouseover(event) {
  let anchorElem = event.target.closest("[data-tooltip]");
  if (!anchorElem) return;
  tooltip = show_Tooltip(anchorElem, anchorElem.dataset.tooltip);
}

// 按钮离开
function button_mouseout(event) {
  if (tooltip) {
    tooltip.remove();
    tooltip = false;
  }
}

// 显示提示
function show_Tooltip(anchorElem, html) {
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
window.addEventListener("load", delayedImageLoading); // 延迟加载图片
function delayedImageLoading(event) {
  let images = document.querySelectorAll("img[data-src]");
  images.forEach(function (img) {
    // img.onload = function () {
    //   img.parentElement.classList.remove("load");
    // };
    // 将图片的src设置为data - src以开始加载
    let dataSrc = img.dataset.src;
    // console.log("dataSrc", dataSrc);
    if (dataSrc) {
      // console.log(dataSrc);
      img.src = dataSrc;
    }
  });
}

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



// 历史记录 - 预览
document.querySelector('#full_version').addEventListener('click', function (event) {
  const classLists = event.target.classList;
  const full_version = document.querySelector("#full_version")
  const lang_en = document.querySelector("#full_version .lang_en");
  const lang_zh = document.querySelector("#full_version .lang_zh");

  // 折叠
  if (classLists.contains('folding') || event.target.parentNode.classList.contains('folding')) {
    full_version.classList.toggle("on")
    return;
  }

  // 导出
  if (classLists.contains('export')) {
    Prompt_favorites.export();
    return;
  }

  //  清空数据
  if (classLists.contains('clearAll')) {
    Prompt_favorites.clearAll();
    return;
  }

  // 显示中文
  if (classLists.contains('lang_zh')) {
    show_en = false;
    lang_en.classList.contains("on") && lang_en.classList.remove("on");
    lang_zh.classList.add("on");
    const li_ps = document.querySelectorAll('#full_version .wrap li > p');
    li_ps.forEach(function (p) {
      p.innerText = p.dataset.zh;
    });
    return;
  }

  // 显示英文
  if (classLists.contains('lang_en')) {
    show_en = true;
    lang_zh.classList.contains("on") && lang_zh.classList.remove("on");
    lang_en.classList.add("on");
    const li_ps = document.querySelectorAll('#full_version .wrap li > p');
    li_ps.forEach(function (p) {
      p.innerText = p.dataset.en;
    });
    return;
  }

  console.log(111);
  const li = event.target.closest("li");
  if (!li) { return };
  const uuid = li.dataset.uuid;
  if (!uuid) { return };

  // 编辑记录
  if (classLists.contains('li_edit')) {
    alert("编辑");
    return;
  }

  // 删除
  if (event.target.classList.contains('del')) {
    Prompt_favorites.del(uuid);
    li.remove();
    return;
  }

  // 加载
  const text_en = li.querySelector("[data-en]").dataset.en;
  const text_zh = li.querySelector("[data-zh]").dataset.zh;
  if (text_en) {
    p_en.textContent = text_en;
    p_en.dataset.uuid = uuid;
  };
  if (text_zh) {
    p_zh.textContent = text_zh
    p_zh.dataset.uuid = uuid;
  };

})

document.getElementById('file-input').addEventListener('change', Prompt_favorites.import);



