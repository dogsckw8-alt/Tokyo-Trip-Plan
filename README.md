# Tokyo-Trip-Plan
Link to my google sheet travel plan

tokyo-travel-app/
│
├── index.html              ─── [骨架] 純粹的 HTML 網頁結構
│
├── css/
│   └── style.css           ─── [裝潢] 自訂的美化樣式與動畫
│
└── js/
    ├── config.js           ─── [設定] API 網址、週別常數設定
    ├── utils.js            ─── [工具箱] 算時間、轉換文字、抓圖示等純邏輯
    ├── api.js              ─── [通訊員] 向 Google 抓取最新行程資料
    ├── ui.js               ─── [繪圖師] 畫出時間軸、顯示與關閉彈窗
    └── main.js             ─── [總指揮] 網頁打開時的啟動入口
