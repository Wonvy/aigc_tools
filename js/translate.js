import { prompts_DeleteCommand } from "../js/prompts.js";
export { translate_API, translate_tmt };
// export * 1from …

// deepl翻译 split_text｜是否翻译整段  lang | 翻译语言
// result.translation
async function translate_tmt(text, sourceLanguage, targetLanguage) {
  // 删除提示词
  text = prompts_DeleteCommand(text);
  const apiUrl = "https://wonvy.cn/fanyi";

  try {
    const data = {
      text: text,
      source: sourceLanguage,
      target: targetLanguage,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    const translatedText = result.translation;
    return translatedText;
  } catch (error) {
    throw error;
  }
}

// deepl翻译 split_text｜是否翻译整段  lang | 翻译语言
async function translate_deepl(text, sourceLanguage = "en", targetLanguage = "zh", split_text = false) {
  text = prompts_DeleteCommand(text);

  if (split_text === true) {
    text = removeNewlines(text);
  }
  const authKey = "b2141899-62d5-120e-a7c9-47d17e08539f:fx";
  const apiUrl = "https://api-free.deepl.com/v2/translate";

  const data = new URLSearchParams({
    auth_key: authKey,
    text: text,
    target_lang: targetLanguage,
  });

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const result = await response.json();
    const translatedText = result.translations[0].text;
    return translatedText;
  } catch (error) {
    throw error;
  }
}



// translationOption: deepl tmt
function translate_API(text, sourceLanguage = "en", targetLanguage = "zh", translationOption = 'deepl') {
  text = prompts_DeleteCommand(text); // 删除提示词
  return new Promise(async (resolve, reject) => {
    try {
      let translatedText;
      if (translationOption === 'tmt') {
        translatedText = await translate_tmt(text, sourceLanguage, targetLanguage);
      } else if (translationOption === 'deepl') {
        translatedText = await translate_deepl(text, sourceLanguage, targetLanguage);
      } else {
        reject('Invalid translation option'); // 如果选项无效，拒绝 Promise
        return;
      }
      resolve(translatedText);
    } catch (error) {
      reject(error);
    }
  });
}


// 删除回车和空行
function removeNewlines(text) {
  return text.replace(/[\r\n]+/g, "");
}
