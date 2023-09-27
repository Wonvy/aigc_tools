export { prompts_DeleteCommand, prompts_GetCommand, prompts_splitwords };

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
