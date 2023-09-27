import { prompts_DeleteCommand } from "../js/prompts.js";
export { translate_API, translate_tmt };
// export * from …

// deepl翻译 split_text｜是否翻译整段  lang | 翻译语言
function translate_tmt(text, sourceLanguage, targetLanguage) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = {
        text: text,
        source: sourceLanguage,
        target: targetLanguage,
      };

      // 在这里执行异步操作
      const response = await fetch("https://wonvy.cn/fanyi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      resolve(response.json());
    } catch (error) {
      reject(error);
    }
  });
}

function translate_tmt2(text, sourceLanguage, targetLanguage) {
  // 构建 POST 请求的数据
  const data = {
    text: text,
    source: sourceLanguage,
    target: targetLanguage,
  };

  // 发起 POST 请求
  fetch("https://wonvy.cn/fanyi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      // 处理翻译结果
      const translation = data.translation;
      console.log("翻译结果：", translation);
    })
    .catch((error) => {
      console.error("翻译请求出错：", error);
    });
}

// deepl翻译 split_text｜是否翻译整段  lang | 翻译语言
function translate_API(text, split_text = false, lang = "ZH") {
  text = prompts_DeleteCommand(text);
  return new Promise(async (resolve, reject) => {
    try {
      if (split_text === true) {
        text = removeNewlines(text);
      }
      const data = {
        auth_key: "b2141899-62d5-120e-a7c9-47d17e08539f:fx",
        text: text,
        target_lang: lang,
      };

      // 在这里执行异步操作
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(data),
      });
      resolve(response.json());
    } catch (error) {
      reject(error);
    }
  });
}

// 删除回车和空行
function removeNewlines(text) {
  return text.replace(/[\r\n]+/g, "");
}
