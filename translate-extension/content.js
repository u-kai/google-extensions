let tooltip = null;
let translateTimeout = null;

function isAlphanumericAndEmpty(str) {
  return /^[a-zA-Z0-9\s]*$/.test(str);
}

document.addEventListener("mouseup", async function (e) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // 既存のツールチップを削除
  if (tooltip) {
    document.body.removeChild(tooltip);
    tooltip = null;
  }

  if (selectedText && isAlphanumericAndEmpty(selectedText)) {
    // 選択範囲の位置を取得
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 翻訳の遅延を設定
    const translation = await translateText(selectedText);
    showTooltip(translation, rect);
  }
});

document.addEventListener("mousedown", function (e) {
  if (tooltip && !tooltip.contains(e.target)) {
    document.body.removeChild(tooltip);
    tooltip = null;
  }
});

async function translateText(text) {
  const req = {
    method: "POST",
    body: JSON.stringify({
      prompt: `Could you translate "${text}" into Japanese? Your answer must consist only of the translation.`,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  };
  const res = await fetch("http://localhost:9999/gpt4o-mini", req)
    .then((res) => res.json())
    .then((res) => res.result);
  return res;
}

function showTooltip(text, selectionRect) {
  tooltip = document.createElement("div");
  tooltip.className = "translation-tooltip";

  // テキストを行ごとに分割して、各行をspan要素として追加
  text.split("\n").forEach((line) => {
    const lineElement = document.createElement("span");
    lineElement.className = "translation-line";
    lineElement.textContent = line;
    tooltip.appendChild(lineElement);
  });
  tooltip.style.visibility = "hidden";
  document.body.appendChild(tooltip);

  const tooltipRect = tooltip.getBoundingClientRect();

  // スクロール位置を考慮した絶対位置の計算
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  // 選択範囲の中央下に配置
  let tooltipX =
    scrollX +
    selectionRect.left +
    selectionRect.width / 2 -
    tooltipRect.width / 2;
  let tooltipY = scrollY + selectionRect.bottom + 8; // 8pxの余白

  // 画面端での位置調整
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 左右の調整
  if (tooltipX < scrollX) {
    tooltipX = scrollX + 8; // 左端から8px
  } else if (tooltipX + tooltipRect.width > scrollX + viewportWidth) {
    tooltipX = scrollX + viewportWidth - tooltipRect.width - 8; // 右端から8px
  }

  // 下部の調整
  if (tooltipY + tooltipRect.height > scrollY + viewportHeight) {
    // 選択範囲の上に表示
    tooltipY = scrollY + selectionRect.top - tooltipRect.height - 8;
  }

  // 位置を設定して表示
  tooltip.style.left = `${tooltipX}px`;
  tooltip.style.top = `${tooltipY}px`;
  tooltip.style.visibility = "visible";
}
