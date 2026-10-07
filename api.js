async function fetchLatestData() {
  const dotEl = document.getElementById('sync-dot');
  const textEl = document.getElementById('sync-text');
  dotEl.className = "w-3 h-3 rounded-full bg-amber-400 animate-ping";
  textEl.textContent = "讀取中...";

  try {
    const res = await fetch(GAS_API_URL);
    const json = await res.json();
    console.log("1. API 原始回傳資料:", json);
    if (json.status === 'success') {
      currentData = json;
      console.log("2. 寫入後的 currentData:", currentData);
      dotEl.className = "w-3 h-3 rounded-full bg-emerald-400";
      textEl.textContent = "已同步";
      renderApp();
    } else {
      throw new Error(json.message);
    }
  } catch (err) {
    dotEl.className = "w-3 h-3 rounded-full bg-rose-500";
    textEl.textContent = "同步失敗";
    console.error(err);
  }
}
