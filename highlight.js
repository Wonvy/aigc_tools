// document.addEventListener("DOMContentLoaded", function () {
//   // 拆分句子
//   function aa() {
//     const textElement = document.getElementById("text");
//     // const multiline = document.getElementById('multiline');
//   }

//   // 拆句
//   const textElement = document.getElementById("text");
//   const multiline = document.getElementById("multiline");
//   const sentences = textElement.textContent.split(". "); // 假设每句话以句号和空格分隔
//   textElement.innerHTML = sentences
//     .map((sentence) => `<span>${sentence}</span>`)
//     .join(". "); // 将每句话包装在 <span> 元素中

//   // 拆词
//   const sentenceSpans = textElement.querySelectorAll("span");
//   sentenceSpans.forEach((span) => {
//     // const p = document.createElement('p');
//     // p.innerText = span.innerText
//     // multiline.appendChild(p);

//     let words = span.textContent.split(" ");
//     span.innerHTML = words.map((word) => `<i>${word}</i>`).join(" ");
//   });

//   //拆分单词
//   function highlightWords2(span) {
//     let words = span.textContent.split(" ");
//     span.innerHTML = words.map((word) => `<i>${word}</i>`).join(" ");
//   }

//   let initialText = textElement.textContent; // 初始文本
//   let searchword = "";

//   let ctrlPressed = false;
//   document.addEventListener("keydown", function (event) {
//     if (event.key === "Control") {
//       ctrlPressed = true;
//     }
//   });
//   document.addEventListener("keyup", function (event) {
//     if (event.key === "Control") {
//       ctrlPressed = false;
//     }
//   });

//   // 添加 input 事件监听器
//   textElement.addEventListener("input", function () {
//     const currentText = textElement.textContent;
//     if (currentText !== initialText) {
//       // 文本内容发生变化，执行您的事件处理代码
//       console.log("文本内容已更新:", currentText);
//       // 在这里执行您的事件处理代码

//       // 更新初始文本内容以便下次比较
//       initialText = currentText;
//     }
//   });

//   sentenceSpans.forEach((span) => {
//     span.addEventListener("mouseover", function () {
//       removeHighlights(); // 移除之前的高亮
//       if (ctrlPressed) {
//         // highlightWords(span); // 如果按下 Ctrl 键，高亮当前单词
//       } else {
//         searchword = span.innerText; // 搜索词
//         translate_API(); //翻译

//         highlightSentence(span); // 否则，高亮整个句子
//       }
//     });
//   });

//   function highlightSentence(span) {
//     span.classList.add("highlighted");
//   }

//   //拆分单词
//   function highlightWords(span) {
//     // span.innerHTML = span.textContent.split(' ').map(word => `<span>${word}</span>`).join(' ');
//     span.querySelectorAll("i").forEach((wordSpan) => {
//       wordSpan.addEventListener("mouseover", function () {
//         wordSpan.classList.add("highlighted-word");
//       });
//       wordSpan.addEventListener("mouseleave", function () {
//         wordSpan.classList.remove("highlighted-word");
//       });
//     });
//   }

//   // 翻译API
//   async function translate_API() {
//     const data = {
//       auth_key: "b58a33ae-817a-42dc-c021-9e5cef793e16:fx",
//       text: searchword,
//       target_lang: "ZH"
//     };

//     fetch("https://api-free.deepl.com/v2/translate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: new URLSearchParams(data)
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         document.getElementById("translationResult").innerText =
//           data.translations[0].text;
//       });
//   }

//   function removeHighlights() {
//     sentenceSpans.forEach((span) => {
//       span.classList.remove("highlighted");
//       span.querySelectorAll("span").forEach((wordSpan) => {
//         wordSpan.classList.remove("highlighted");
//       });
//     });
//   }
// });
