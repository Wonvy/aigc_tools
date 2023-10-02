export {
  prompts_DeleteCommand,
  prompts_GetCommand,
  prompts_splitwords,
  add_keyword,
};

// 指定字符串之前添加文本
function add_keyword_begin(paragraphText, keyword) {
  let customString = `${keyword}`;
  let index = paragraphText.indexOf(" --"); // 查找第一个 "--" 符号的索引
  if (index !== -1) {
    // 提取第一个 "--" 符号之前的部分
    var beforeFirstDash = paragraphText.substring(0, index);
    // 更新 <p> 元素的文本内容，添加自定义字符串
    return (paragraphText =
      beforeFirstDash + customString + paragraphText.substring(index));
  } else {
    return (paragraphText += customString);
  }
}


// 指定字符串之前添加文本
function add_keyword(paragraphText, keyword) {
  let customString = `${keyword}`;
  let index = paragraphText.indexOf(" --"); // 查找第一个 "--" 符号的索引
  if (index !== -1) {
    // 提取第一个 "--" 符号之前的部分
    var beforeFirstDash = paragraphText.substring(0, index);
    // 更新 <p> 元素的文本内容，添加自定义字符串
    return (paragraphText =
      beforeFirstDash + customString + paragraphText.substring(index));
  } else {
    return (paragraphText += customString);
  }
}

// 删除指令
function prompts_DeleteCommand(text) {
  if (text === null || text === undefined) {
    return "";
  }
  return text.replace(/--\w+[^-]*/g, ""); // 执行 replace 操作
}

// 提取指令，返回数组
function prompts_GetCommand(text) {
  if (text === null || text === undefined) {
    return "";
  }
  return text.match(/--\w+[^-]*/g);
}

// 拆分描述词
function prompts_splitwords(text) {
  if (text === null || text === undefined) {
    return "";
  }
  return text.match(/[^,.]+[,.]/g);
}
