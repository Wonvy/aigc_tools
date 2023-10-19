"use strict";
console.log("严格模式:", this === undefined); // 输出 true 表示严格模式启用
// import { Vue } from "./js/vue.esm.browser.js"
import Vue from './js/vue.esm.browser.js'

import { translate_API } from "./js/translate.js";
import { Resize } from "./js/ui.js";
import {
  getById,
  getEl,
  getElA,
  uuid,
  sha256,
  random_bkcolor,
  startCountdown,
  getCurrentDateTime,
  wiki_APi,
  debounce
} from "./js/func.js";
import {
  prompts_DeleteCommand,
  prompts_GetCommand,
  prompts_splitwords,
  add_keyword,
} from "./js/prompts.js";

const full_version = document.getElementById("full_version");
const line_en = document.querySelector("#word_edit_en ul");
const line_zh = document.querySelector("#word_edit ul");
const full_screen = document.getElementById("full_screen");
const list_wrap = document.querySelector(".list_wrap");
const en_wrap = document.querySelector(".en_wrap");
const zh_wrap = document.querySelector(".zh_wrap");
const div_after = document.querySelector(".div_after");

const status_bar = zh_wrap.querySelector(".status_bar");
const p_zh = document.getElementById("p_zh"); // 英文指令编辑区
const p_en = document.getElementById("p_en"); // 中文指令编辑区
const ul_en = document.getElementById("ul_en"); // 英文翻译按钮
const ul_zh = document.getElementById("ul_zh"); // 英文翻译按钮
const view_img4 = document.querySelector(".view_img4");
let show_en = false; // 元素拖拽
let lastparent_uuid = "";
let currenuuid, Translated;
let ctrlPressed = false;
let tooltip, show_1;
let g_hash_zh, g_hash_en;

let clicks = 0, timer2, timeoutId; // 处理双击事件
// 初始化JSON数据
let g_JSONdata, storedData;

const app = new Vue({
  el: '#full_version .nav',
  data: {
    title: '收藏夹'
  }
});

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
    // console.log(file);
    var self = this; // 保存Prompt_favorites对象的引用
    if (file) {
      var reader = new FileReader();
      reader.onload = function (event) {
        try {
          let jsonData = JSON.parse(event.target.result); // 解析JSON数据       
          storedData = jsonData; // 替换全局的data变量
          // console.log('替换后的data:', storedData); // 打印替换后的data
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
    // console.log("uuidstr", uuidstr);
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


  // 新建提示词
  new: function (event) {
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
    p_zh.focus();
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

    const lis = document.querySelectorAll("li.selected");
    lis.forEach((li) => {
      li.classList.remove("selected");
    });
    p_zh.focus();
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
              translate_API(word).then((result_text) => {
                // console.log(word, result_text);
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
              translate_API(word).then((result_text) => {
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

    // console.log("uuid: ", uuidtext)
    sha256(p_en.innerText).then(hash => {

      // 判断uuid是否存在
      // console.log("has", Prompt_favorites.has_uuid(uuidtext))
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
    // console.log("regexPattern", regexPattern);
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
    const ulen_lis = document.querySelectorAll("#ul_en li");

    // console.log("ulen_lis", ulen_lis.length, lines.length);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() !== "") {
        const li = document.createElement("li");
        // console.log(ul_en[i].dataset.bkcolor);
        // li.style.backgroundColor = ul_en[i].dataset.bkcolor;
        if (ulen_lis[i]) {
          // console.log("ul_en[i].backgroundColor", window.getComputedStyle(ulen_lis[i]).backgroundColor);
          li.style.backgroundColor = window.getComputedStyle(ulen_lis[i]).backgroundColor;
          li.dataset.uuid = ulen_lis[i].dataset.uuid;
          li.dataset.en = ulen_lis[i].dataset.en;
        }
        li.setAttribute("draggable", "true");
        li.dataset.zh = line.trim();
        li.textContent = line.trim();
        ul.appendChild(li);
      }
    }
    ul_local.innerHTML = ul.innerHTML;
  },

  // 英文提示词转为多行
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
        li.dataset.bkcolor = random_bkcolor(1);;
        li.dataset.en = line.trim();
        li.dataset.uuid = uuid();
        li.dataset.zh = "222";
        li.textContent = line.trim();
        ul.appendChild(li);
      }
    });
    ul_local.innerHTML = ul.innerHTML;
  },

  // 提示词多行显示
  switch_multiLine: function (event) {
    let li = event.target.closest("li");
    if (!li) { return }
    console.log(li);
    const tabtext = li.dataset.tab;
    const liIndex = li.dataset.index;
    const tabcss = li.dataset.css;

    Prompt.en_MultiLine();
    Prompt.zh_MultiLine();

    const lis = document.querySelectorAll(`.main_wrap [class*="active"]`);
    lis.forEach(li => {
      li.classList.remove("active");
    });


    document.querySelector(`.en_wrap [data-index="${liIndex}"]`).classList.add("active");
    document.querySelector(`.zh_wrap [data-index="${liIndex}"]`).classList.add("active");

    const elements = document.querySelectorAll(`.main_wrap [class*="ontop"]`);
    elements.forEach(element => {
      const classes = element.classList;
      for (let i = 0; i < classes.length; i++) {
        const className = classes[i];
        if (className.startsWith("ontop")) {
          element.classList.remove(className);
        }
      }
    });

    document.querySelector(`#zh_tabs .${tabtext}`).classList.add(tabcss);
    document.querySelector(`#en_tabs .${tabtext}`).classList.add(tabcss);
  }


}

const Prompt_Words = {

  load: function (event) {
    const bt_title = event.target.dataset.name;
    let imagelist2 = getById("imagelist2");

    JSONS.render(imagelist2, g_JSONdata);

    getById("temp_en_edit").innerHTML = getById("p_en").innerHTML;
    // document.querySelector("h3[data-title=" + bt_title + "]").scrollIntoView({
    //   behavior: "smooth",
    //   block: "center",
    //   inline: "nearest",
    // });
    full_screen.classList.add("ontop");
  },

  add_selected: function (event) {
    const lis = document.querySelectorAll("#full_screen li.selected");
    lis.forEach((li) => {
      const bkcolor = random_bkcolor(1);
      const uuidstr = uuid();
      checkElementType(p_en, li.dataset.en, "add", li.dataset.en);
      checkElementType(p_zh, li.dataset.zh, "add", li.dataset.en);
      checkElementType(ul_en, li.dataset.en, "add", li.dataset.en, bkcolor, uuidstr);
      checkElementType(ul_zh, li.dataset.zh, "add", li.dataset.en, bkcolor, uuidstr);
    });
    full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop")
  },

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
            .then((result_text) => {
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
    // console.log("typeof data: ", typeof data);
    let json = JSON.stringify(data);
    // console.log("typeof json: ", typeof json);
    for (let key in data["关键词"]) {
      // console.log(data["关键词"][key]);
      for (let key2 in data["关键词"][key]) {
        const div = document.createElement("div");
        const h3 = document.createElement("h3");
        const ul = document.createElement("ul");
        const span1 = document.createElement("span");
        h3.textContent = key2;
        h3.appendChild(span1);
        h3.dataset.title = key2;
        div.appendChild(h3);
        div.appendChild(ul);
        div.classList.add("word_wrap");
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
        container.appendChild(div);
      }
    }

    // let childNodes = div.childNodes;
    // let div2 = document.createElement("div");
    // for (var i = 0; i < childNodes.length; i++) {
    //   div2.appendChild(childNodes[i].cloneNode(true));
    // }
    // container.innerHTML = div2.innerHTML;

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
        .then((result_text) => {
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
      translate_API(p_zh, "ZH", "EN") // true
        .then((result_text) => {
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
    const lang = event.target.closest("p").dataset.lang;
    if (lang === "en") {
      translate_API(p_en.innerText, "en", "zh").then((result) => {
        p_zh.innerText = result;
      });
    } else { // zh
      translate_API(p_zh.innerText, "zh", "en").then((result) => {
        p_en.innerText = result;
      });
    }
  },
}

const el_FullScreen = {
  // 关闭
  close: function (e) {
    full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop");
  },

  mouseout: function (e) {
    if (e.target.id === "full_screen") {
      e.target.style.cursor = "default";
    }
  },

  mouseover: function (e) {
    if (e.target.id === "full_screen") {
      e.target.style.cursor = "not-allowed";
    }
  },

  click: function (e) {
    if (e.target === full_screen && !e.target.closest('.full_screen-wrap')) {
      el_FullScreen.close(e);
    }

    return;
    const temp_en_edit = getById("temp_en_edit");
    let li;
    const tagName = event.target.tagName
    // console.log(tagName)
    // if (tagName === "DIV") {
    //   full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop");
    //   return;
    // }

    if (tagName === "H2") {
      li = event.target.parentElement;
    } else {
      li = event.target;
    }

    if (tagName === "LI") {
      li = event.target;
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
  },

}

const el_ViewList = {
  // 所选字体显示为大字号
  mouseover: (e) => {
    let li;
    if (e.target.tagName === "LI") {
      li = e.target;
    } else {
      li = e.target.closest("li");
    }
    if (!li) { return };
    getById("zh_preview").textContent = li.dataset.zh;
    getById("en_preview").textContent = li.dataset.en;
    wiki_APi(li.dataset.zh, "zh");
    // let image = document.querySelector("#fixed-header img");
    // let src = li.querySelector("img");
    // image.src = src.dataset.src;
    // let randomParam = Math.random(); // 生成一个随机数作为参数
    // image.src = "https://picsum.photos/200?" + randomParam;
  },

  // 所选字体显示为大字号
  click: (e) => {
    let li;
    if (e.target.tagName === "LI") {
      li = e.target;
    } else {
      li = e.target.closest("li");
    }
    if (!li) {
      return;
    }
    li.classList.toggle("selected");

    let ul = e.target.closest("ul");
    let h3 = ul.previousElementSibling;
    let span = h3.querySelector("span");
    const li_parent = li.parentNode;
    const isSelected = li.classList.contains("selected");
    const li_height = li.offsetHeight + parseInt(window.getComputedStyle(li).marginBottom);

    if (isSelected) {
      // li_parent.prepend(li);

      const bkcolor = random_bkcolor(1);
      const uuidstr = uuid();
      checkElementType(p_en, li.dataset.en, "add", li.dataset.en);
      checkElementType(p_zh, li.dataset.zh, "add", li.dataset.en);
      checkElementType(ul_en, li.dataset.en, "add", li.dataset.en, bkcolor, uuidstr);
      checkElementType(ul_zh, li.dataset.zh, "add", li.dataset.en, bkcolor, uuidstr);
      li_parent.querySelectorAll("li.selected").forEach((element, index) => {
        const offset = index * li_height; // 每个元素的偏移量为 50px（可以根据需要调整）
        // element.style.top = offset + 'px';
      });
    } else {
      // li_parent.appendChild(li);
      li.style.removeProperty('top');
      checkElementType(p_en, li.dataset.en, "del");
      checkElementType(p_zh, li.dataset.zh, "del");
      checkElementType(ul_en, li.dataset.zh, "del");
      checkElementType(ul_zh, li.dataset.zh, "del");
      // li_parent.querySelectorAll("li:not(.selected)").forEach((element, index) => {
      //   element.style.removeProperty('top');
      // });
    }
    let li_num = li_parent.querySelectorAll("li.selected").length;
    if (li_num <= 0) {
      span.textContent = "";
    } else {
      // span.textContent = `(${li_num})`;
    }


  },

  wheel: (e) => {
    let tagName = e.target.tagName;
    if (tagName === "H3" || tagName === "H3") {
      let scrollwidth = view_img4.offsetWidth - e.target.offsetWidth;
      let scrollDirection = (e.deltaX || e.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
      blur
      view_img4.classList.add("blur");
      view_img4.scrollLeft += scrollwidth * scrollDirection;
      view_img4.classList.remove("blur");
      return;
    }
    let ul = e.target.closest("ul");

    if (ul) {
      // let scrollheight = view_img4.offsetHeight;
      console.log(ul);
      let scrollheight = ul.clientHeight;
      console.log("e", e)
      console.log("e.deltaX:", e.deltaX);
      console.log("e.deltaY:", e.deltaY);
      let scrollDirection = (e.deltaX || e.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
      console.log("scrollDirection:", scrollDirection);
      console.log("scrollHeight:", ul.scrollHeight);
      console.log("clientHeight:", ul.clientHeight);
      console.log("scrollTop:", ul.scrollTop);
      console.log("scroll:", scrollheight * scrollDirection);
      ul.scrollTop += scrollheight * scrollDirection;
      return;
    }
  },

  scroll: (e) => {
    const prev = document.querySelector(".list_wrap .prev");
    const next = document.querySelector(".list_wrap .next");
    let lastScrollLeft = view_img4.scrollLeft;
    const scrollWidth = view_img4.scrollWidth;
    const clientWidth = view_img4.clientWidth;
    const scrollLeft = view_img4.scrollLeft;
    const scrollright = scrollWidth - clientWidth - scrollLeft;

    // console.log("scrollright", scrollright);
    if (scrollLeft <= 100) {
      prev.classList.add("hide");
    } else {
      prev.classList.contains("hide") && prev.classList.remove("hide");
    }

    if (scrollright <= 100) {
      next.classList.add("hide");
    } else {
      next.classList.contains("hide") && next.classList.remove("hide");
    }
  }

}

const el_Listwrap = {

  click: (event) => {

    let scrollwidth = view_img4.querySelector(".word_wrap").offsetWidth

    const prev = document.querySelector(".list_wrap .prev");
    const next = document.querySelector(".list_wrap .next");

    let pagediv = event.target.closest(".page")
    console.log("before", view_img4.scrollLeft);
    if (!pagediv) { return };
    if (pagediv.classList.contains("prev")) {
      view_img4.scrollLeft -= scrollwidth;
    }

    if (pagediv.classList.contains("next")) {
      view_img4.scrollLeft += scrollwidth;
    }

    // console.log("after", view_img4.scrollLeft);

    // if (view_img4.scrollLeft <= 0) {
    //   prev.classList.add("hide");
    // } else {
    //   prev.classList.contains("hide") && prev.classList.remove("hide");
    // }
  },

  wheel: (event) => {
    let tagName = event.target.tagName;
    if (tagName === "H3" || tagName === "DIV" || tagName === "I") {
      let scrollwidth = view_img4.offsetWidth - event.target.offsetWidth;
      let scrollDirection = (event.deltaX || event.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
      blur
      view_img4.classList.add("blur");
      view_img4.scrollLeft += scrollwidth * scrollDirection;
      view_img4.classList.remove("blur");
      return;
    }
  },

  mouseover: (event) => {
    const div_page = event.target.closest(".page");
    const scrollwidth = view_img4.querySelector(".word_wrap").offsetWidth;

    if (!div_page) { return }

    if (div_page.classList.contains("prev") && !div_page_Triggered) {
      console.log(scrollwidth);
      view_img4.scrollLeft -= scrollwidth;
      div_page_Triggered = true;
      return;
    }
    if (div_page.classList.contains("next") && !div_page_Triggered) {
      view_img4.scrollLeft += scrollwidth;
      div_page_Triggered = true;
      return;
    }
  },

  mouseout: (event) => {
  }
}

const el_ulzh = {

  click: (e) => {
    const li = e.target.closest("li");
    if (!li) { return };
    const liIndex = Array.from(li.parentNode.children).indexOf(li); // 获取当前索引

    const lis = document.querySelectorAll(".main_wrap li.clicked");
    lis.forEach((li_clicked) => {
      if (li.dataset.uuid != li_clicked.dataset.uuid) {
        li_clicked.classList.remove("clicked");
      }
    });

    li.classList.toggle("clicked")
    const curuuid = li.dataset.uuid;
    const en_li = ul_en.querySelector(`[data-uuid="${curuuid}"]`)
    if (!en_li) { return }
    en_li.classList.toggle("clicked")

    el_iframe.open(li.dataset.en);
  },

  mouseover: (e) => {
    const li = e.target.closest("li");
    if (!li) { return };
    li.classList.add("on");
    const curuuid = li.dataset.uuid;
    const en_li = ul_en.querySelector(`[data-uuid="${curuuid}"]`)
    if (!en_li) { return }
    en_li.classList.add("on");
    show_1 = show_close(li, "x");
  },

  mouseout: (e) => {
    if (show_1) {
      show_1.remove();
      show_1 = false;
    }
    const li = e.target.closest("li");
    if (!li) { return };
    li.classList.contains("on") && li.classList.remove("on");
    const curuuid = li.dataset.uuid;
    const en_li = ul_en.querySelector(`[data-uuid="${curuuid}"]`)
    if (!en_li) { return }
    en_li.classList.contains("on") && en_li.classList.remove("on");
  },
  keyup: (event) => {
  },
  keydown: (event) => {
  },
  change: (event) => {
  },
  input: (event) => {
  },
}

const el_ulen = {

  click: (e) => {
    const li = e.target.closest("li");
    if (!li) { return };
    const liIndex = Array.from(li.parentNode.children).indexOf(li); // 获取当前索引
    console.log(liIndex);
    const lis = document.querySelectorAll(".main_wrap li.clicked");
    lis.forEach((li_clicked) => {
      if (li.dataset.uuid != li_clicked.dataset.uuid) {
        li_clicked.classList.remove("clicked");
      }
    });

    li.classList.toggle("clicked")
    const curuuid = li.dataset.uuid;
    const zh_li = ul_zh.querySelector(`[data-uuid="${curuuid}"]`)
    if (!zh_li) { return }
    zh_li.classList.toggle("clicked")
    el_iframe.open(li.dataset.en);
  },

  mouseover: (e) => {
    const li = e.target.closest("li");
    if (!li) { return };
    li.classList.add("on");
    const curuuid = li.dataset.uuid;
    const zh_li = ul_zh.querySelector(`[data-uuid="${curuuid}"]`)
    if (!zh_li) { return }
    zh_li.classList.add("on");
  },

  mouseout: (e) => {
    const li = e.target.closest("li");
    if (!li) { return };
    li.classList.contains("on") && li.classList.remove("on");
    const curuuid = li.dataset.uuid;
    const zh_li = ul_zh.querySelector(`[data-uuid="${curuuid}"]`)
    if (!zh_li) { return }
    zh_li.classList.contains("on") && zh_li.classList.remove("on");
  },
  keyup: (event) => {
  },
  keydown: (event) => {
  },
  change: (event) => {
  },
  input: (event) => {
  },

}

const el_iframe = {
  open: (q) => {
    let iframe = getEl("iframe");
    let url1 = `https://lexica.art/?q=${q}`;
    iframe.src = url1;;
    let left = iframe.closest(".left");
    const info = getEl(".info");
    const hasClicked = document.querySelectorAll("#ul_en li.clicked").length > 0;
    if (hasClicked) {
      info.classList.add("on");
      left.classList.add("on");
    } else {
      info.classList.remove("on");
      left.classList.remove("on");
    }
  },
}

const el_Status_bar = {
  click: (e) => {
  },
  wheel: (e) => {
  },
  mouseover: (e) => {
    timeoutId = setTimeout(() => {
      tab_switch(e);
    }, 200);
  },
  mouseout: (e) => {
    clearTimeout(timeoutId);
  },
  keyup: (e) => {
  },
  keydown: (e) => {
  },
  change: (e) => {
  },
  input: (e) => {
  },

}

const el_Button = {
  click: (e) => {
  },
  wheel: (e) => {
  },
  mouseover: (e) => {
    let el = e.target.closest("[data-tooltip]");
    if (!el) return;
    tooltip = show_Tooltip(el, el.dataset.tooltip);
  },
  mouseout: (e) => {
    if (tooltip) {
      tooltip.remove();
      tooltip = false;
    }
  },
  keyup: (e) => {
  },
  keydown: (e) => {
  },
  change: (e) => {
  },
  input: (e) => {
  },

}

const el_div_after = {
  tab_wheel: (e) => {
    let ul;
    let scrollDirection = (e.deltaX || e.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
    let scrollAmount = 150;
    e.preventDefault();
    if (e.target.tagName === "BUTTON") {
      ul = document.querySelector(
        `.div_after div[data-name="${e.target.dataset.name}"] > ul`,
      );
    } else {
      ul = e.target.closest("ul");
    }
    if (!ul) { return };
    ul.scrollTop += scrollAmount * scrollDirection;
  },
  click: (e) => {
  },
  wheel: (e) => {
  },
  mouseover: (e) => {
  },
  mouseout: (e) => {
  },
  keyup: (e) => {
  },
  keydown: (e) => {
  },
  change: (e) => {
  },
  input: (e) => {
  },

}

const el_commonds = {
  click: (e) => {
  },
  wheel: (e) => {
  },
  mouseover: (e) => {
  },
  mouseout: (e) => {
  },
  keyup: (e) => {
  },
  keydown: (e) => {
  },
  change: (e) => {
    const tagname = e.target.tagName;
    const promptcontent = p_en.innerText;
    let paramName = "", regexPattern = "";
    let commond = "";
    let value = e.target.value;
    if (tagname === "SELECT" || tagname === "INPUT") {
      paramName = e.target.dataset.paramName;
      if (value === "" || value === "---" || value === "0") {
        regexPattern = paramName + "\\s+[^\\s]+";
        commond = " ";
        // console.log("paramName1", paramName);
      } else {
        regexPattern = paramName + "\\s+[^\\s]+";
        commond = paramName + " " + e.target.value;
        // console.log("paramName2", paramName);
      }

      let commond_after = Prompt.command_replace(
        promptcontent,
        regexPattern,
        commond,
      );
      p_en.innerText = commond_after;
    }
  },
  input: (e) => {
  },

}



const el_Template = {
  click: (e) => {
  },
  wheel: (e) => {
  },
  mouseover: (e) => {
  },
  mouseout: (e) => {
  },
  keyup: (e) => {
  },
  keydown: (e) => {
  },
  change: (e) => {
  },
  input: (e) => {
  },

}

const Excel = {
  read: (e) => {
    const file = event.target.files[0];
    // 使用FileReader读取文件
    const reader = new FileReader();
    reader.onload = function (event) {
      const data = event.target.result;

      // 通过xlsx库解析Excel数据
      const workbook = XLSX.read(data, { type: 'binary' });

      // 获取所有工作表名称
      var sheetNames = workbook.SheetNames;
      console.log('工作表名称：', sheetNames);

      // 获取第一个工作表的数据
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);  // 将Excel数据转换为JSON格式
      // 处理jsonData
      console.log(jsonData);
    };
    reader.readAsBinaryString(file);
  },
  export: (e) => {

  },

}

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
        if (Prompt_Words.unselect.childElementCount === 0) {
          JSONS.render_search(button.dataset.tab);
        }
      } else {
        JSONS.render_search(button.dataset.tab);
      }
    }
  }
}

function composition_click(event) {
  let li;
  console.log(event);
  if (event.target.tagName === "LI") {
    li = event.target;
  } else {
    li = event.target.closest("li");
  }
  if (!li) { return };
  li.classList.toggle("selected");
  const isSelected = li.classList.contains("selected");
  if (isSelected) {
    const bkcolor = random_bkcolor(1);
    const uuidstr = uuid();
    checkElementType(p_en, li.dataset.en, "add", li.dataset.en);
    checkElementType(p_zh, li.dataset.zh, "add", li.dataset.en);
    checkElementType(ul_en, li.dataset.en, "add", li.dataset.en, bkcolor, uuidstr);
    checkElementType(ul_zh, li.dataset.zh, "add", li.dataset.en, bkcolor, uuidstr);
  } else {
    checkElementType(ul_en, li.dataset.en, "del");
    checkElementType(ul_zh, li.dataset.zh, "del");
  }
}

function checkElementType(
  node,
  word,
  operation,
  langEN = "",
  bkcolor = "#333",
  uuid = ""
) {
  let searchText;
  if (node.nodeType !== 1) {
    return;
  }
  console.log(node.textContent, word, operation);
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

function resize_reset() {
  getEl(".resize").style.left = "";
  en_wrap.style.width = "";
  zh_wrap.style.width = "";
  getEl(".resize").classList.remove("mgleft");
  getEl(".resize").classList.remove("mgright");
}

function keyword_drags() {
  let curLi, curLi_Index;
  let en_curLi;
  ul_zh.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    curLi = e.target;
    curLi_Index = Array.from(curLi.parentNode.children).indexOf(curLi);
    en_curLi = ul_en.querySelector(`[data-uuid="${curLi.dataset.uuid}"]`);

    setTimeout(() => {
      curLi.classList.add("moving");
      const en_li = ul_en.children[curLi_Index];
      if (en_li) {
        en_li.classList.add("moving");
      };
    });

  });

  // 当拖拽的元素进入目标区域时触发事件
  ul_zh.addEventListener("dragenter", (e) => {
    // console.log(e); // 打印事件对象，用于调试和查看事件信息
    e.preventDefault(); // 阻止默认的拖拽行为，通常在这种情况下要阻止默认行为以避免问题

    // 如果拖拽的目标是当前正在拖动的元素或者是列表本身，则不执行后续操作
    if (e.target === curLi || e.target === ul_zh) {
      return;
    }

    // 将列表中的所有子元素（<li>元素）转换为数组
    let liArray = Array.from(ul_zh.childNodes);

    // 获取当前正在拖动的元素在列表中的索引
    let currentIndex = liArray.indexOf(curLi);

    // 获取拖拽目标元素在列表中的索引
    let targetIndex = liArray.indexOf(e.target);

    // 打印转换后的数组和当前和目标元素的索引，用于调试
    // console.log("liArray:", liArray);
    // console.log("currentIndex:", currentIndex);
    // console.log("targetIndex:", targetIndex);

    // 如果当前元素的索引小于目标元素的索引，将当前元素插入到目标元素的下一个兄弟元素的位置
    if (currentIndex < targetIndex) {
      const referenceChild = e.target.nextElementSibling;
      ul_zh.insertBefore(curLi, referenceChild);
      ul_en.insertBefore(en_curLi, ul_en.querySelector(`[data-uuid="${referenceChild.dataset.uuid}"]`));
    } else { // 否则，将当前元素插入到目标元素的位置
      ul_zh.insertBefore(curLi, e.target);
      ul_en.insertBefore(en_curLi, ul_en.querySelector(`[data-uuid="${e.target.dataset.uuid}"]`));
    }
  });

  ul_zh.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  ul_zh.addEventListener("dragend", (e) => {
    curLi.classList.remove("moving");
    en_curLi.classList.remove("moving");

  });
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
    full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop")
  }

  // 检查是否按下 `~` 键 (键码为 192)
  if (event.keyCode === 192) {
    // 处理 `~` 键事件
    full_screen.classList.add("ontop")
  }
}

JSONS.init()
Prompt_favorites.load();
keyword_drags(); // 项目

new Resize(".rz1").main(); // 调整元素大小拖拽
Prompt.load_last(); // 载入最后一次使用的提示词
p_zh.focus(); // 设置输入框焦点

status_bar.addEventListener("mouseover", el_Status_bar.mouseover);
status_bar.addEventListener("mouseout", el_Status_bar.mouseout);
status_bar.addEventListener("click", Prompt_Words.load);
status_bar.addEventListener("wheel", el_div_after.tab_wheel);
div_after.addEventListener("wheel", el_div_after.tab_wheel);

div_after.addEventListener("click", composition_click);

document.querySelector("#main .left").addEventListener("mouseover", function (event) {
  let left = document.querySelector("#main .left");
  left.classList.contains("on") && left.classList.remove("on")
})

document.querySelector("iframe").addEventListener('load', function () {
  let info = document.querySelector("#main .left .info");
  info.classList.contains("on") && info.classList.remove("on")
  console.log('外链网页加载完成！');
});

getEl(".main_wrap .resize").addEventListener("click", () => {
  clicks++;
  if (clicks === 1) {
    timer2 = setTimeout(function () {
      clicks = 0;
    }, 300);
  } else if (clicks === 2) {
    clearTimeout(timer2);
    resize_reset();
    clicks = 0;
  }
});

getEl(".main_wrap .resize i").addEventListener("click", (e) => {
  if (e.target.parentNode.classList.contains("mgleft")) {
    resize_reset();
  } else {
    resize_reset();
  }
});

const leftDiv = document.getElementById("word_edit_en");
const rightDiv = document.getElementById("word_edit");
let isLeftScrolling = false, isRightScrolling = false; // 记录左右两个 div 的滚动状态
leftDiv.addEventListener("scroll", function () {
  if (!isLeftScrolling) {
    isRightScrolling = true;
    rightDiv.scrollTop = leftDiv.scrollTop;
  }
  isLeftScrolling = false;
});
rightDiv.addEventListener("scroll", function () {
  if (!isRightScrolling) {
    isLeftScrolling = true;
    leftDiv.scrollTop = rightDiv.scrollTop;
  }
  isRightScrolling = false;
});

getEl(".commonds_wrap").addEventListener("change", el_commonds.change);
getElA(".tab_container").forEach((nav) => {
  nav.addEventListener("click", Prompt.switch_multiLine);
})
getEl(".button_wrap #view_bar-add").addEventListener("click", Prompt_Words.add_selected);
getEl(".button_wrap #view_bar-unselect").addEventListener("click", Prompt_Words.unselect);
getEl("#bt_add").addEventListener("click", Prompt_Words.load);
getEl("#bt_en").addEventListener("click", Translates.toZH);
getEl("#bt_zh").addEventListener("click", Translates.toEN);


full_screen.addEventListener("mouseover", el_FullScreen.mouseover);
full_screen.addEventListener("mouseout", el_FullScreen.mouseout);
full_screen.addEventListener("click", el_FullScreen.click, true);
full_screen.querySelector("button.close").addEventListener("click", el_FullScreen.close);

view_img4.addEventListener("mouseover", el_ViewList.mouseover);
view_img4.addEventListener("click", el_ViewList.click);
view_img4.addEventListener("wheel", el_ViewList.wheel)
view_img4.addEventListener("scroll", el_ViewList.scroll);

getEl(".view_bar .lang_zh").addEventListener("click", () => {
  view_img4.classList.toggle("en");
})

zh_tabs.addEventListener("click", () => { p_zh.focus(); });

p_zh.addEventListener("input", debounce(Translates.live, 500));

ul_zh.addEventListener("click", el_ulzh.click)
ul_zh.addEventListener("mouseover", el_ulzh.mouseover)
ul_zh.addEventListener("mouseout", el_ulzh.mouseout)
ul_en.addEventListener("click", el_ulen.click)
ul_en.addEventListener("mouseover", el_ulen.mouseover)
ul_en.addEventListener("mouseout", el_ulen.mouseout)

getEl("#p_en").addEventListener("input", debounce(Translates.live, 500));
getEl("#bt_new").addEventListener("click", Prompt.new);
getEl("#bt_save").addEventListener("click", Prompt.nesavew);
getEl("#bt_copy").addEventListener("click", Prompt.copy);
getEl("#bt_paste").addEventListener("click", Prompt.paste);
getEl("#bt_clear").addEventListener("click", Prompt.clear);

getEl("#p_en").addEventListener("mouseover", Prompt_Words.highlight_hover);
getEl("#p_en").addEventListener("mouseout", Prompt_Words.highlight_clear);
getEl("#en_tabs").addEventListener("click", () => { getEl("#p_en").focus() });

document.querySelectorAll("button").forEach(function (button) {
  button.addEventListener("mouseover", el_Button.mouseover);
  button.addEventListener("mouseout", el_Button.mouseout);
});


function show_close(anchorElem, html) {
  let div = document.createElement("div");
  div.className = "show_weight";
  div.innerHTML = html;
  document.body.append(div);

  let coords = anchorElem.getBoundingClientRect();
  let left = coords.left;
  if (left < 0) left = 0;

  let top = coords.top;
  if (top < 0) {
    top = coords.top + anchorElem.offsetHeight + 5;
  }

  div.style.left = left + "px";
  div.style.top = top + "px";

  return div;
}

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

window.addEventListener("load", delayedImageLoading); // 延迟加载图片
function delayedImageLoading(event) {
  let images = document.querySelectorAll("img[data-src]");
  images.forEach(function (img) {
    let dataSrc = img.dataset.src;
    if (dataSrc) {
      img.src = dataSrc;
    }
  });

  let iframe = document.querySelector("iframe");
  // 判断是否
  if (isMobileDevice()) {
  } else {
    iframe.src = `https://lexica.art/`;
  }

}

document.querySelectorAll(".div_after img").forEach(function (div) {
  div.addEventListener("mouseover", el_Button.mouseover);
  div.addEventListener("mouseout", el_Button.mouseout);
});

document.querySelectorAll(".commonds_wrap > div").forEach(function (div) {
  div.addEventListener("mouseover", el_Button.mouseover);
  div.addEventListener("mouseout", el_Button.mouseout);
});

document.querySelectorAll(".tab_container ul li").forEach(function (div) {
  div.addEventListener("mouseover", el_Button.mouseover);
  div.addEventListener("mouseout", el_Button.mouseout);
});

full_version.addEventListener('click', function (event) {
  const classLists = event.target.classList;
  const full_version = document.querySelector("#full_version")
  const lang_en = document.querySelector("#full_version .lang_en");
  const lang_zh = document.querySelector("#full_version .lang_zh");
  // 折叠
  if (event.target.closest(".folding")) {
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

let div_page_Triggered = false; // 标志，用于控制事件触发次数
list_wrap.addEventListener("click", el_Listwrap.click);
list_wrap.addEventListener("wheel", el_Listwrap.wheel);
list_wrap.addEventListener("mouseover", el_Listwrap.mouseover);

document.querySelectorAll(".list_wrap .page").forEach(function (page) {
  page.addEventListener("mouseout", (event) => {
    div_page_Triggered = false;
  });
})

document.getElementById('file-input').addEventListener('change', Prompt_favorites.import);
document.addEventListener("keyup", keyupEvent);
document.addEventListener("keydown", keydownEvent);

const ListSlider_width = document.getElementById("ListSlider_width");
const ListSlider_width_value = document.getElementById("ListSlider_width_value");

ListSlider_width.addEventListener("input", function () {
  ListSlider_width_value.textContent = ListSlider_width.value;
  const elements = document.querySelectorAll('.word_wrap');
  elements.forEach(el => {
    el.style.setProperty('width', ListSlider_width.value + "px");
  });
});

document.querySelector(".view_bar").addEventListener("click", function (e) {
  let li = e.target.closest("li");
  let imagelist = document.getElementById("imagelist2");
  if (!li) { return };
  let view_name = li.dataset.button;
  imagelist.classList.forEach(className => {
    if (className.startsWith("cssview_")) {
      imagelist.classList.remove(className);
    }
  });
  imagelist.classList.add(view_name);
})

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}