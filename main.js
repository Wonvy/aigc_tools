"use strict";
console.log("严格模式:", this === undefined); // 输出 true 表示严格模式启用
// import { Vue } from "./js/vue.esm.browser.js"
import Vue from './js/vue.esm.browser.js'

import { translate_API, translate_tmt } from "./js/translate.js";
import { Resize } from "./js/ui.js";
import {
  getById,
  getElement,
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

const full_version = getById("full_version");
const line_en = getElement("#word_edit_en ul");
const line_zh = getElement("#word_edit ul");
const full_screen = getById("full_screen");
const list_wrap = document.querySelector(".list_wrap");
const en_wrap = getElement(".en_wrap");
const zh_wrap = getElement(".zh_wrap");
const status_bar = zh_wrap.querySelector(".status_bar");
const p_zh = getById("p_zh"); // 英文指令编辑区
const p_en = getById("p_en"); // 中文指令编辑区
const ul_en = getById("ul_en"); // 英文翻译按钮
const ul_zh = getById("ul_zh"); // 英文翻译按钮
const view_img4 = document.querySelector(".view_img4");
let show_en = false; // 元素拖拽
let lastparent_uuid = "";
let currenuuid, Translated;
let ctrlPressed = false;
let tooltip;

let clicks = 0, timer2, timeoutId; // 处理双击事件
// 初始化JSON数据
let g_JSONdata, storedData;

const app = new Vue({
  el: '#full_version .nav',
  data: {
    title: '收藏夹'
  }
});

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
              translate_API(word).then((result) => {
                let result_text = result.translations[0].text;
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
              translate_API(word).then((result) => {
                let result_text = result.translations[0].text;
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

// FullScreen
const elFullScreen = {
  // 关闭
  close: (e) => {
    full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop")
  },

  mouseout: (e) => {
    if (e.target.id === "full_screen") {
      e.target.style.cursor = "default";
    }
  },

  mouseover: (e) => {
    if (e.target.id === "full_screen") {
      e.target.style.cursor = "not-allowed";
    }
  },

  click: (event) => {
    const temp_en_edit = getById("temp_en_edit");
    let li;
    const tagName = event.target.tagName
    // console.log(tagName)
    // if (tagName === "DIV") {
    //   full_screen.classList.contains("ontop") && full_screen.classList.remove("ontop");
    //   return;
    // }
    return;
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

// elViewList
const elViewList = {
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
      checkElementType(p_en, li.dataset.en, "add", li.dataset.en);
      checkElementType(p_zh, li.dataset.cn, "add", li.dataset.en);
      checkElementType(ul_en, li.dataset.en, "add", li.dataset.en, bkcolor);
      checkElementType(ul_zh, li.dataset.cn, "add", li.dataset.en, bkcolor);
      li_parent.querySelectorAll("li.selected").forEach((element, index) => {
        const offset = index * li_height; // 每个元素的偏移量为 50px（可以根据需要调整）
        // element.style.top = offset + 'px';
      });
    } else {
      // li_parent.appendChild(li);
      li.style.removeProperty('top');
      checkElementType(p_en, li.dataset.en, "del");
      checkElementType(p_zh, li.dataset.cn, "del");
      checkElementType(ul_en, li.dataset.en, "del");
      checkElementType(ul_zh, li.dataset.cn, "del");
      // li_parent.querySelectorAll("li:not(.selected)").forEach((element, index) => {
      //   element.style.removeProperty('top');
      // });
    }
    let li_num = li_parent.querySelectorAll("li.selected").length;
    if (li_num <= 0) {
      span.textContent = "";
    } else {
      span.textContent = `(${li_num})`;
    }


  },

  wheel: (e) => {
    let tagName = e.target.tagName;
    if (tagName === "H3" || tagName === "H3") {
      let scrollwidth = view_img4.offsetWidth - e.target.offsetWidth;
      let scrollDirection = (e.originalEvent.deltaX || e.originalEvent.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
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
      console.log("e.deltaX:", e.originalEvent.deltaX);
      console.log("e.deltaY:", e.originalEvent.deltaY);
      let scrollDirection = (e.originalEvent.deltaX || e.originalEvent.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
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


const elListwrap = {

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


const elTemplate = {
  click: (event) => {
  },
  wheel: (event) => {
  },
  mouseover: (event) => {
  },
  mouseout: (event) => {
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



// function ---------------------------------------------------------------------------------

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
  const isSelected = li.classList.contains("selected");
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

// 调整滑块重置
function resize_reset() {
  getElement(".resize").style.left = "";
  en_wrap.style.width = "";
  zh_wrap.style.width = "";
  getElement(".resize").classList.remove("mgleft");
  getElement(".resize").classList.remove("mgright");
}

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




// init ---------------------------------------------------------------------------------
JSONS.init()
Prompt_favorites.load();
keyword_drags(); // 项目拖拽
new Resize(".rz1").main(); // 调整元素大小拖拽
Prompt.load_last(); // 载入最后一次使用的提示词
p_zh.focus(); // 设置输入框焦点

// div_after --------------------------------------------------------------------------
$(".div_after > div").on("wheel", tab_wheel);

function tab_wheel(event) {
  // console.log(event.target);
  let ul;
  let scrollDirection = (event.deltaX || event.deltaY) > 0 ? 1 : -1; // 获取滚动的方向
  let scrollAmount = 150;
  if (event.target.tagName === "BUTTON") {
    ul = document.querySelector(
      `.div_after div[data-name="${event.target.dataset.name}"] > ul`,
    );
  } else {
    ul = event.target.closest("ul");
  }

  ul.scrollTop += scrollAmount * scrollDirection;
  event.preventDefault(); // 阻止事件的默认行为，避免影响其他滚动
}

// status_bar ---------------------------------------------------------------------------------
status_bar.addEventListener("mouseover", (e) => {
  timeoutId = setTimeout(() => {
    tab_switch(e);
  }, 200);
});
status_bar.addEventListener("mouseout", () => {
  clearTimeout(timeoutId);
});
status_bar.addEventListener("wheel", tab_wheel, { passive: true });

// iframe ---------------------------------------------------------
document.querySelector("#main .left").addEventListener("mouseover", function (event) {
  let left = document.querySelector("#main .left");
  left.classList.contains("on") && left.classList.remove("on")
})

document.querySelector("iframe").addEventListener('load', function () {
  let info = document.querySelector("#main .left .info");
  console.log(info);
  info.classList.contains("on") && info.classList.remove("on")
  console.log('外链网页加载完成！');
});


getElement(".div_after").addEventListener("click", composition_click);

// resize ---------------------------------------------------------------

$(".main_wrap .resize").on("click", () => {
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
$(".main_wrap .resize i").on("click", (e) => {
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

getElement(".commonds_wrap").addEventListener("change", comman_click);

function comman_click(event) {
  const tagname = event.target.tagName;
  const promptcontent = p_en.innerText;
  let paramName = "", regexPattern = "";
  let commond = "";
  let value = event.target.value;
  if (tagname === "SELECT" || tagname === "INPUT") {
    paramName = event.target.dataset.paramName;
    if (value === "" || value === "---" || value === "0") {
      regexPattern = paramName + "\\s+[^\\s]+";
      commond = " ";
      // console.log("paramName1", paramName);
    } else {
      regexPattern = paramName + "\\s+[^\\s]+";
      commond = paramName + " " + event.target.value;
      // console.log("paramName2", paramName);
    }

    let commond_after = Prompt.command_replace(
      promptcontent,
      regexPattern,
      commond,
    );
    p_en.innerText = commond_after;
    // console.log(commond_after);
  }
}

// 提示词多行显示
$(".tab_container").on("click", prompt_switch_multiLine);
$(".button_wrap #view_bar-add").on("click", PromptWords.add_selected);
$(".button_wrap #view_bar-unselect").on("click", PromptWords.unselect);  // 取消所选提示词
$("#bt_add").on("click", PromptWords.load);  // 载入提示词库
$("#bt_en").on("click", Translates.toZH); // 载入提示词库
$("#bt_zh").on("click", Translates.toEN); // 载入提示词库
$(".status_bar button").on("click", PromptWords.load);  // 载入提示词库

full_screen.addEventListener("mouseover", elFullScreen.mouseover);
full_screen.addEventListener("mouseout", elFullScreen.mouseout);
full_screen.addEventListener("click", elFullScreen.click);
full_screen.querySelector("button.close").addEventListener("click", elFullScreen.close);


$(".view_img4").on("mouseover", elViewList.mouseover);
$(".view_img4").on("click", elViewList.click);
$(".view_img4").on("wheel", elViewList.wheel)
$(".view_img4").on("scroll", elViewList.scroll);

document.querySelector(".view_bar .lang_zh").addEventListener("click", () => {
  view_img4.classList.toggle("en");
})


// zh_wrap  ------------------------------------------------------------
zh_wrap.querySelector("#zh_tabs").addEventListener("click", () => {
  p_zh.focus();
});
zh_wrap.querySelector("#ul_zh").addEventListener("click", function (event) {
  const li = event.target.closest("li");
  if (!li) { return };
  const lis = document.querySelectorAll("#ul_zh li.clicked");
  lis.forEach((li1) => {
    li1.classList.remove("clicked");
  });
  li.classList.toggle("clicked")
})
zh_wrap.querySelector("#p_zh").addEventListener("input",
  debounce(Translates.live, 500)
);

// en_wrap -------------------------------------------------------------
$("#bt_new").on("click", Prompt.new); // 新建咒语
$("#bt_save").on("click", Prompt.save); // 保存咒语
$("#bt_copy").on("click", Prompt.copy); // 复制咒语
$("#bt_paste").on("click", Prompt.paste); // 粘贴咒语
$("#bt_clear").on("click", Prompt.clear); // 清空咒语
$("#en_tabs").on("click", () => { $("#p_en").focus() });
$("#p_en").on("mouseover", PromptWords.highlight_hover);
$("#p_en").on("mouseout", PromptWords.highlight_clear);
$("#ul_en").on("click", "li", function () {
  const li = $(this);
  if (!li.length) {
    return;
  }
  let q = li.text();
  $("#ul_en li.clicked").not(li).removeClass("clicked");
  li.toggleClass("clicked");
  let iframe = $("iframe");
  let url1 = `https://lexica.art/?q=${q}`;
  iframe.attr("src", url1);
  let left = iframe.closest(".left");
  const info = left.find(".info");
  const hasClicked = $("#ul_en li.clicked").length > 0;
  if (hasClicked) {
    info.addClass("on");
    left.addClass("on");
  } else {
    info.removeClass("on");
    left.removeClass("on");
  }
});


// tooltips ----------------------------------------------------------------
$("button").on({
  mouseover: button_mouseover,
  mouseout: button_mouseout
});


function button_mouseover(event) {
  let anchorElem = event.target.closest("[data-tooltip]");
  if (!anchorElem) return;
  tooltip = show_Tooltip(anchorElem, anchorElem.dataset.tooltip);
}
function button_mouseout(event) {
  if (tooltip) {
    tooltip.remove();
    tooltip = false;
  }
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

// window ------------------------------------------------------------------
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
  iframe.src = `https://lexica.art/`;
}
document.querySelectorAll(".div_after img").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});
document.querySelectorAll(".commonds_wrap > div").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});
document.querySelectorAll(".tab_container ul li").forEach(function (div) {
  div.addEventListener("mouseover", button_mouseover);
  div.addEventListener("mouseout", button_mouseout);
});

// full_version -------------------------------------------------------------
full_version.addEventListener('click', function (event) {
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


// list_wrap -------------------------------------------------------------
let div_page_Triggered = false; // 标志，用于控制事件触发次数
list_wrap.addEventListener("click", elListwrap.click);
list_wrap.addEventListener("wheel", elListwrap.wheel);
list_wrap.addEventListener("mouseover", elListwrap.mouseover);

document.querySelectorAll(".list_wrap .page").forEach(function (page) {
  page.addEventListener("mouseout", (event) => {
    div_page_Triggered = false;
  });
})

// Excel -------------------------------------------------------------
document.getElementById('file-input').addEventListener('change', Prompt_favorites.import);
document.getElementById('file-excel').addEventListener('change', Excel.read);

// keybord -------------------------------------------------------------
document.addEventListener("keyup", keyupEvent); // 键盘弹起
document.addEventListener("keydown", keydownEvent); // 键盘按下


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