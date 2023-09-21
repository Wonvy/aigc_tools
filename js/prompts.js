export { prompts_DeleteCommand, prompts_GetCommand, prompts_splitwords };

// 删除指令
function prompts_DeleteCommand(text) {
  return text.replace(/--\w+[^-]*/g, "");
}

// 提取指令，返回数组
function prompts_GetCommand(text) {
  return text.match(/--\w+[^-]*/g);
}

// 拆分描述词
function prompts_splitwords(text) {
  return text.match(/[^,.]+[,.]/g);
}
