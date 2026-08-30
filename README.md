# KindlesMind

繁體中文的線上依附類型診斷。28 道情境題、4 個心理向度，以依附理論（Attachment Theory）判讀使用者在親密關係中的模式，對應到 12 種依附原型之一。

正式站：<https://www.kindlesmind.com>

---

## 快速開始

```bash
npm install
npm run dev      # http://localhost:5173
```

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | 產出 `dist/` |
| `npm run preview` | 以正式環境的方式預覽 `dist/` |
| `npm test` | 跑測試（`node:test`，無需額外框架） |

## 技術組成

React 18 · Vite · Tailwind CSS v3 · Framer Motion v11 · Lucide React
部署於 Vercel，`api/` 底下為 Serverless Functions。

## 專案結構

```
index.html            進入點，含 meta 與結構化資料
src/
  main.jsx            掛載 React
  App.jsx             所有畫面元件（hero / quiz / calculating / result）
  lib/quiz.js         題目、原型資料與計分邏輯（純函式，可測試）
  index.css           Tailwind 指令與字型
api/                  Vercel Serverless Functions
public/               靜態資產（含各原型的 .mp4 動畫）
tests/                node:test 測試
vercel.json           路由與回應標頭
```

`src/lib/quiz.js` 刻意不含任何渲染，所以計分邏輯可以在沒有 DOM 的情況下測試。要改題目、原型文案或計分規則，都在這裡。

## 計分模型

**4 個向度，各 7 題，每題 1–5 分 → 每個向度 7–35 分。**

| 向度 | 代號 | 意義 |
| --- | --- | --- |
| 親密焦慮 | A | 對疏離、被取代與失去回應的敏感度 |
| 親密迴避 | B | 面對靠近、承諾與情感揭露時的退開反射 |
| 原生家庭印記 | C | 早年照顧經驗留在關係腳本裡的痕跡 |
| 衝突應激模式 | D | 爭執當下的戰、逃、凍結與解離反應 |

四個向度依分數由高到低排序（**同分時 id 大者在前**，確保結果具決定性），再由 `calcResults` 的路由表決定原型。三個門檻值：

| 常數 | 值 | 意義 |
| --- | --- | --- |
| `HIGH` | 22 | 主向度達此值才算「高」；未達則一律判為安全型 |
| `EXTREME` | 28 | 主向度達此值走「極高」專屬分支 |
| `SEC_HI` | 20 | 次高向度達此值才能與主向度配對 |

### 12 種原型

| 代碼 | 原型 | 依附類型 |
| --- | --- | --- |
| `KM-01` | 溫熱的孤島 | 安全型依附 |
| `KM-02` | 永恆的觀測者 | 迴避型依附 |
| `KM-03` | 暫停的焦慮家 | 焦慮型依附 |
| `KM-04` | 溺水的迴聲 | 衝突應激軸 × 迴避型 |
| `KM-05` | 華麗的受難者 | 原生家庭軸 × 焦慮型 |
| `KM-06` | 規訓的流放者 | 衝突應激軸 × 原生家庭 |
| `KM-07` | 曠野的復讀機 | 混亂型依附 |
| `KM-08` | 失訊的預言家 | 衝突應激軸 |
| `KM-09` | 微光的殉道者 | 焦慮型依附 |
| `KM-10` | 孤獨的領跑者 | 原生家庭軸 |
| `KM-11` | 斷線的呼喚者 | 焦慮型依附 |
| `KM-12` | 永存的瞬間 | 原生家庭軸 × 衝突應激 |

### 診斷代碼

格式 `KM-XX-A#B#C#D#`，例如 `KM-09-A5B1C2D1`。`XX` 是原型編號，四個 `#` 是各向度的分桶（1–5）：

| 分桶 | 原始分數 |
| --- | --- |
| 1 | ≤ 11 |
| 2 | 12–16 |
| 3 | 17–21 |
| 4 | 22–27 |
| 5 | 28–35 |

使用者可以在首頁貼上這組代碼重新叫回結果（`parseCode` 以各分桶的中位數還原分數，因此是近似還原，不是原始作答）。

## 狀態如何保存

測驗**完全在瀏覽器端計分**，答案不會上傳伺服器。

- 網址參數 `?a=` 存 28 個作答權重，`&u=1` 代表已解鎖
- `localStorage` 的 `km_last_result` 作為備援

## 測試

```bash
npm test
```

測試以 Node 內建的 `node:test` 撰寫，不需要額外的測試框架或 jsdom。`tests/quiz-scoring.test.mjs` 涵蓋路由表的每一條分支、三個門檻的邊界值、診斷碼分桶、`parseCode` 的接受與拒絕案例。

**改動 `src/lib/quiz.js` 的計分規則前請先跑測試**——路由表有 16 個分支，改錯了畫面上不會有任何徵兆。

## 部署

推上 GitHub 由 Vercel 自動建置。路由、改寫規則與回應標頭都定義在 `vercel.json`，該檔案是唯一的真實來源。

### 環境變數

| 變數 | 用途 | 狀態 |
| --- | --- | --- |
| `KV_*` / `REDIS_URL` | Vercel KV，儲存付款旗標 | 已由 Vercel KV 整合自動注入 |
| `PORTALY_WEBHOOK_SECRET` | 驗證 Portaly webhook 簽章 | ⚠️ **尚未設定** |

拉取本機開發用的環境變數：

```bash
npx vercel env pull
```

## 已知限制

- **付費牆在前端。** 12 種原型的完整報告全文都打包在 JS bundle 裡，網址加上 `&u=1` 即可解鎖。要真正擋住需要改成付款驗證後才由伺服器提供內容。
- **`PORTALY_WEBHOOK_SECRET` 未設定。** `api/portaly-webhook.js` 目前在沒有簽章時會跳過驗證。
- **`.git` 約 124 MB。** 歷史中含有已移除的重複影片檔，需要改寫歷史才能回收。
- **`src/App.jsx` 仍有約 2,300 行**，尚未拆分成元件。

## 授權

© 2026 uiuxtogether 科技鴨鴨. All rights reserved.
