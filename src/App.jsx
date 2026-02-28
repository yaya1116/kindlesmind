import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Thermometer, Lock, Unlock, Sparkles, FileText,
  CheckCircle, ArrowRight, X, Brain, Shield, TrendingUp,
  ChevronRight, ChevronLeft, Star, Flame, Leaf, Sun, Moon,
  Wind, Clock, Eye, RefreshCw, AlertCircle, Mail, ExternalLink,
  UserCheck, ShieldCheck, BadgeCheck
} from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  { id: 1, name: '關係溫度的流失', sub: 'Temperature Loss',   Icon: Thermometer, color: '#D48C70' },
  { id: 2, name: '互動中的防衛',   sub: 'Defensive Patterns', Icon: Shield,      color: '#7B9EE8' },
  { id: 3, name: '不安的內在根源', sub: 'Root Causes',        Icon: Brain,       color: '#E8956A' },
  { id: 4, name: '對未來的預期',   sub: 'Future Outlook',     Icon: TrendingUp,  color: '#5F7161' },
]

const QUESTIONS = [
  // 維度 1：關係溫度的流失
  { id:  1, dim: 1, text: '在等待回覆時，我會不自覺地翻看以前熱烈的對話，懷念那時候的溫度。' },
  { id:  2, dim: 1, text: '即使對方就在身邊，我依然能感覺到一種難以言說的隔閡感。' },
  { id:  3, dim: 1, text: '我覺得分享生活中的瑣事對對方來說，漸漸變成了一種打擾。' },
  { id:  4, dim: 1, text: '當對方語氣稍微冷淡，我會立刻陷入自省，擔心自己做錯了什麼。' },
  { id:  5, dim: 1, text: '相比三個月前，我覺得我們之間發自內心的笑聲減少了許多。' },
  // 維度 2：互動中的防衛機制
  { id:  6, dim: 2, text: '在爭吵之後，我通常是那個為了維持關係而先主動破冰、卻感到委屈的人。' },
  { id:  7, dim: 2, text: '我常為了避免衝突而隱藏真實情緒，選擇用溫和的貼圖遮掩內心的不安。' },
  { id:  8, dim: 2, text: '當對方遲遲不回訊息，我會忍不住反覆查看他的社群在線狀態。' },
  { id:  9, dim: 2, text: '我常在對話框打了一長串心聲，最後卻因為擔心對方的反應而全部刪除。' },
  { id: 10, dim: 2, text: '我有時會透過刻意沈默或不回訊息，來測試對方是否還在乎我的情緒。' },
  // 維度 3：不安的內在根源
  { id: 11, dim: 3, text: '我深信如果我不持續展現自己的價值或照顧對方，這段關係就會瓦解。' },
  { id: 12, dim: 3, text: '當對方表現得極度親密時，我會下意識地感到壓力，甚至產生想拉開距離的衝動。' },
  { id: 13, dim: 3, text: '我在愛中常感到一種「隨時會被拋棄」的恐懼，即便現狀看起來很穩定。' },
  { id: 14, dim: 3, text: '我覺得自己的情緒起伏，幾乎完全取決於對方對我的態度。' },
  { id: 15, dim: 3, text: '回想童年，我發現現在這種渴望得到肯定的焦慮感，與我小時候非常相似。' },
  // 維度 4：對未來的潛意識預期
  { id: 16, dim: 4, text: '我曾在腦中反覆演練過如果有一天我們真的分手了，我該如何面對生活。' },
  { id: 17, dim: 4, text: '我感到這段關係中的疲累感，已經開始透支我靈魂的能量。' },
  { id: 18, dim: 4, text: '我覺得自己在這場關係長跑中，體力已經快要耗盡。' },
  { id: 19, dim: 4, text: '對於「我們能一起走到最後」這件事，我的信心正在逐漸動搖。' },
  { id: 20, dim: 4, text: '我覺得自己在目前的關係中，更像是一個「隨時會被退租的客房房客」。' },
]

const ANSWERS = [
  { label: '非常符合，深有同感', weight: 4 },
  { label: '大多時候是這樣',     weight: 3 },
  { label: '偶爾有這種感覺',     weight: 2 },
  { label: '不，幾乎沒有',   weight: 1 },
]

const MILESTONES = [
  {
    afterIdx: 4, progress: 25,
    title: '你很勇敢，願意面對這份不安。',
    body: '許多人選擇迴避這些問題。你選擇了面對，這本身就是一種療癒的開始。',
    nextDim: '互動中的防衛', nextSub: 'Defensive Patterns',
  },
  {
    afterIdx: 9, progress: 50,
    title: '你正在觸碰內心最深處的角落。',
    body: '這些問題也許讓你感到不舒服，那正是因為它們擊中了某些重要的事情。允許自己感受。',
    nextDim: '不安的內在根源', nextSub: 'Root Causes',
  },
  {
    afterIdx: 14, progress: 75,
    title: '快到了，你的勇氣值得被看見。',
    body: '最後五個問題，將帶你看見這段關係的未來向度。深呼吸，繼續前行。',
    nextDim: '對未來的預期', nextSub: 'Future Outlook',
  },
]

// ─── PROFILES ────────────────────────────────────────────────────────────────

const PROFILES = {
  frozen: {
    minScore: 60,
    baseTemp: 17,
    label: '冰點依附型',
    tag: '嚴重焦慮依附',
    tagBg: '#EEF2FF', tagColor: '#4F6EE8', tagBorder: '#C7D2FE',
    emoji: '🧊',
    summary: '你的心靈溫度極低。長期的不安感已悄悄侵蝕了你在關係中的自我價值感，讓你不斷在渴望與逃避之間拉扯。',
    freeInsight: '偵測到強烈的「拋棄恐懼」核心信念，這往往與早期依附創傷有關聯。',
    accentColor: '#4F6EE8',
    archetype: '深海裡的螢火蟲',
    archetypeDesc: '在最幽暗的地方，你獨自發著微弱的光，等待有人潛入深海來找你。',
    soulParadox: '你最深的矛盾是：你比任何人都渴望被愛，卻又比任何人都更擅長在被愛之前，先把自己推開。你把每一次靠近都當作即將到來的離別的預演，所以你的靈魂學會了一邊敞開，一邊在心裡偷偷打包行李。你疲憊，不是因為愛得太少，而是因為你同時在愛與恐懼之間拔河，從未停歇。而那個在夜裡反覆翻看舊對話的你，只是在尋找一個答案：「有沒有哪一刻，我是真的被好好愛過的？」',
    rootAnalysis: `您的心靈溫度偵測到深層的「拋棄恐懼圖式」（Abandonment Fear Schema）。這並非您天生如此，而是在生命早期，您反覆經歷了「情感上的不確定性」——也許是一個情緒不穩定的照顧者，一段改變認知的青春期友誼，或是一次徹底重塑您對愛之理解的失去。

您的神經系統學到了一個殘酷的等式：「愛 = 危險 + 隨時消失的可能。」為了生存，您發展出了矛盾的策略：一邊拼命靠近，一邊用全身感官偵測「被拋棄」的預警訊號。這讓您極度疲憊，卻又無法停下來。

您現在的「超敏感狀態」（Hypervigilance）——不斷確認、不斷解讀對方的語氣——並不是您的弱點。它是一個曾經幫助您在不安全環境中生存的機制，只是它現在已成為阻礙您真正靠近愛的牆。`,
    partnerDecode: `根據您的測驗結果，您在關係中吸引並被吸引的，很可能是帶有「迴避型依附」特質的人。他們在親密感升高時，會本能地後退——不是因為不在乎，而是因為親密對他們代表著「失去自我控制」的威脅。

這形成了心理學所說的「焦慮-迴避陷阱」（Anxious-Avoidant Trap）：您越追逐確認，他越退縮自保；他越退縮，您越焦慮。這個循環創造了一種高強度的情感張力，讓雙方都可能誤以為這種拉扯就是「激情」。

他的「消失」並非故意懲罰您，而是他在無聲地說：「我需要空間才能感到安全。」理解這一點，不是要您接受不好的對待，而是讓您從「是我不夠好」的內疚深井中解脫出來。`,
    prescription: [
      {
        month: '第一個月', title: '中斷驗證循環',
        steps: [
          '每當想確認對方是否在乎時（查看已讀、刷新社群），先暫停，插入一個深呼吸的空間。',
          '練習「5-4-3-2-1接地法」：說出5樣看到的、4樣摸到的、3樣聽到的事物，讓自己回到當下。',
          '建立「情緒溫度計」：每天早晨用1-10分記錄自己的焦慮程度，觀察規律，而非評判自己。',
        ],
      },
      {
        month: '第二個月', title: '重建內在安全基地',
        steps: [
          '每天進行10分鐘「自我父母化」練習：對自己說你最需要聽到的溫柔話語。',
          '列出5件「不依賴對方回應，我依然感到完整」的事，每週實踐其中一件。',
          '閱讀推薦：《依附》(Attached) by Levine & Heller——這本書會讓你感到被深刻理解。',
        ],
      },
      {
        month: '第三個月', title: '學習健康的距離',
        steps: [
          '當你有衝動要傳訊息確認，等候30分鐘，用這段時間做一件滋養自己的事。',
          '每週投入至少2小時在純屬於你的事情上——工作、創作、友誼，重建「關係以外」的身份。',
          '認真考慮尋求心理諮商師支持，許多早期依附創傷需要在安全的關係中被溫柔地釋放。',
        ],
      },
    ],
  },

  cold: {
    minScore: 44,
    baseTemp: 22,
    label: '寒流焦慮型',
    tag: '焦慮依附',
    tagBg: '#EFF6FF', tagColor: '#2E6EB5', tagBorder: '#BFDBFE',
    emoji: '❄️',
    summary: '你的關係溫度偏低。你非常渴望真實的連結，但內心的不安讓你無法完全放鬆地享受這段感情的溫度。',
    freeInsight: '偵測到「愛情焦慮」模式——對方的一個眼神或沉默，都能在你心中掀起波瀾。',
    accentColor: '#2E6EB5',
    archetype: '霧氣中的領航員',
    archetypeDesc: '你有清晰看見方向的能力，卻總是在進港之前，被自己製造的霧氣迷失。',
    soulParadox: '你的矛盾在於：你擁有比大多數人更深刻的情感感知力，卻把這份天賦用來預警危險，而非享受溫暖。你總能在對話中捕捉到對方語氣的毫釐變化，你以為這是細心，但其實你的大腦一直在問同一個問題：「他還在愛我嗎？」這種高速運轉的愛情雷達，讓你永遠比別人先看見風暴，卻也讓你錯過了最多的晴天。那些你在對話框裡打了又刪掉的話，正是你真實的靈魂，每一次都差一點點，被好好說出口。',
    rootAnalysis: `您的心靈溫度顯示出典型的「焦慮依附」特徵。您不是不懂愛，您是「太懂得如何在愛中受傷」。這種高度敏感來自於您在某段重要關係中，學到了一個信念：「愛是不穩定的、需要努力才能維持。」

您的大腦已經習慣了把「對方的沉默」解讀為威脅訊號。這不是多疑，而是您的神經系統正在盡職地保護您——只是它用的是一張幾年前的「危險地圖」，未必適用於現在的關係。

好消息是：焦慮依附是後天學習的，也可以後天重新改寫。您的高度情感敏感性，其實是一種珍貴的禮物，只是需要找到它更滋養的表達方式。`,
    partnerDecode: `您在關係中的模式顯示，您對伴侶的情緒變化異常敏感。這種「關係雷達」讓您能夠深刻地理解他人，但同時也讓您承受著比一般人更沉重的情感負荷。

您的伴侶（或讓您心動的人）可能帶有一定的「情感不可預測性」，而這種不可預測性反而激活了您的依附系統——因為「間歇性強化」（Intermittent Reinforcement）是讓大腦最為上癮的獎勵模式。當對方給予關注時你如沐春風，對方沉默時你如墜深淵，這種強烈的對比，會被大腦解讀為「這一定是真愛」。

試著練習區分：「他真的在疏遠我」vs「我的依附恐懼在自動放大解讀」。`,
    prescription: [
      {
        month: '第一個月', title: '建立情緒覺察習慣',
        steps: [
          '設置每天兩次的「情緒check-in」提醒，記錄：當下感受 / 觸發原因 / 身體哪裡感到緊繃。',
          '建立你的「焦慮觸發清單」：哪些對方的行為最容易引起你的焦慮反應？把它們列出來，開始觀察。',
          '練習「滾動暫停」：在任何衝動反應（傳訊息、追問、確認）前，插入一個30秒的空白。',
        ],
      },
      {
        month: '第二個月', title: '溝通模式升級',
        steps: [
          '學習非暴力溝通的需求表達：「當（具體行為）發生，我感到（情緒），因為我需要（需求）。」',
          '區分「需求」和「要求」：允許自己有需求，但練習用邀請而非要求的方式來表達。',
          '每週一次「關係回顧」：這週哪一刻讓你感到被好好接住了？記錄下來，留住它。',
        ],
      },
      {
        month: '第三個月', title: '重新定義「夠了」',
        steps: [
          '建立「充足感日記」：今天對方做了什麼讓你感受到他的在乎？哪怕只是一件小事也算。',
          '練習接受「不完美的親密」：沒有任何一段關係能全天候滿足你，而這並不代表他不愛你。',
          '每週保留2-3小時完全屬於自己的時間，享受它，不要為此感到罪惡感。',
        ],
      },
    ],
  },

  warm: {
    minScore: 28,
    baseTemp: 28,
    label: '溫熱探索型',
    tag: '矛盾依附',
    tagBg: '#FFF7ED', tagColor: '#B45309', tagBorder: '#FED7AA',
    emoji: '🌤️',
    summary: '你的關係溫度尚可，但仍有些波動。你渴望深度連結，偶爾對關係的走向感到迷惘，在靠近與遠離之間搖擺。',
    freeInsight: '偵測到「矛盾依附」傾向——時而安全、時而焦慮，關鍵在於找到穩定的自我錨點。',
    accentColor: '#B45309',
    archetype: '候鳥的漂泊季節',
    archetypeDesc: '你知道溫暖的地方在哪裡，卻總在抵達之前，就已開始計劃下一次的離開。',
    soulParadox: '你的矛盾是：你同時住著兩個截然不同的靈魂。一個渴望紮根——想要被好好愛著，有人始終在那裡；另一個卻在親密感升溫的瞬間本能後退，害怕那份溫暖有一天會消失，所以不如自己先走。這讓你在愛情裡忽冷忽熱，不是因為你善變，而是因為你的內心，從未對「被愛是安全的」這件事，真正放下戒備。那個下一秒又想靠近的你，和下一秒又想逃開的你，其實都是同一個人——只是還沒找到可以真正放心停留的地方。',
    rootAnalysis: `您的測驗結果顯示出「矛盾型依附」的特徵——您有時能夠輕鬆享受關係，有時又會突然陷入強烈的不確定感。這種忽冷忽熱，讓您和伴侶都感到困惑。

這種模式通常源於一個「部分安全、部分不安全」的成長環境：您的照顧者大多時候是溫暖的，但在關鍵時刻可能出現了不可預測的反應。這讓您學到：「愛是真實的，但它消失的可能也是真實的。」

您天生擁有較高的情感智商與對他人的敏銳感知，只是需要建立更穩定的「內在錨點」，讓自己不再因對方的情緒起伏而全盤動搖。`,
    partnerDecode: `您與伴侶之間的互動可能存在一種「溫度落差」——您熱情投入時，對方可能反應平淡；您想抽離時，對方又突然靠近。這並非刻意操控，而是兩種依附模式在無意識層面的複雜互動。

您偶爾出現的「逃避衝動」是一種防衛機制——當親密感讓你感到不安全時，拉開距離比承受可能的拒絕更「安全」。但這樣的衝動如果未被認識與命名，可能會無意間傷害真正在乎你的人。

在下一次「想逃走」的衝動來臨時，試著問自己：「我是真的需要空間，還是我在逃避親密帶來的不安感？」`,
    prescription: [
      {
        month: '第一個月', title: '找到你的情緒節奏',
        steps: [
          '記錄「親密-疏離」循環：你在什麼情況下最渴望靠近？什麼時候最想抽離？有哪些觸發因素？',
          '練習「窗口期溝通」：在情緒穩定時，提前跟伴侶說：「我有時候會突然需要空間，這不是針對你的。」',
          '建立個人的「情緒充電儀式」：每週兩次，做一件純粹為自己存在、不需要對任何人交代的事。',
        ],
      },
      {
        month: '第二個月', title: '深化自我了解',
        steps: [
          '探索你的「依附觸發點」：對方的哪些行為讓你感到不安？試著追溯這些感受更早的起源。',
          '練習「向內問」：當焦慮來臨，先問「我的內心需要什麼？」而非「對方應該怎麼做？」',
          '嘗試「漸進式暴露」：在感到安全的範圍內，練習讓對方看到更真實、更脆弱的你。',
        ],
      },
      {
        month: '第三個月', title: '在關係中建立穩定',
        steps: [
          '與伴侶建立「連結儀式」：每週一次固定的深度對話，分享各自這週的高峰與低谷。',
          '練習「微修復技巧」：爭執後不必等情緒完全平復，學習在仍有情緒時做出一個小小的連結動作。',
          '設立「共同的未來錨點」：討論你們希望一年後的關係是什麼樣子，讓未來成為當下的穩定力量。',
        ],
      },
    ],
  },

  secure: {
    minScore: 0,
    baseTemp: 34,
    label: '安全溫暖型',
    tag: '安全依附',
    tagBg: '#F0FDF4', tagColor: '#166534', tagBorder: '#BBF7D0',
    emoji: '☀️',
    summary: '你的心靈溫度相當健康。你在關係中具備較好的安全感基礎，能夠相對平靜地面對不確定性，這是珍貴的情感底氣。',
    freeInsight: '偵測到相對穩定的依附模式，你擁有較紮實的情感彈性與自我邊界意識。',
    accentColor: '#166534',
    archetype: '過度燃燒的壁爐',
    archetypeDesc: '你本是這段關係裡最穩定的溫度，卻在不知不覺中，把自己燒成了灰燼。',
    soulParadox: '你的矛盾是：你明明是最有能力給予溫暖的人，卻漸漸發現自己已經燃燒過度。你習慣成為關係裡那個「穩定的人」，在對方動盪時你是錨，在對方冰冷時你是火。但沒有人問過你：「你自己需要什麼？」於是你的不安，不是來自不夠愛，而是來自長期的情感不對等——你已給出太多，而燃料，已快耗盡。那些你獨自消化的委屈，不是成熟，是你還不相信：你也可以被好好照顧。',
    rootAnalysis: `您的測驗結果顯示出較為健康的「安全依附」傾向。這代表您在成長過程中，至少有過一段讓您感受到「被穩定接住」的重要關係——也許是父母之一、一位老師、或是一段深厚的友誼。這份早期的「安全體驗」成為了您的情感底氣。

但「安全依附」並不代表您不會在感情中受苦。即使是安全型的人，在面對持續的情感冷漠、背叛或高壓的生命事件時，依然會感到動搖與疲憊。

您今天做這個測驗，代表關係中仍有某些部分讓您感到困惑或不確定。接下來的分析，將幫助您找到那個讓您感到「不那麼安全」的具體環節。`,
    partnerDecode: `您的安全感基礎讓您能夠以較少的防衛心接近他人，這是一種珍貴的能力。然而，若您目前的伴侶屬於「迴避型」或「焦慮型」依附，您可能正在承受一種特殊的疲憊：「為什麼我已經給予了足夠多，他/她仍然如此遙遠或如此不安？」

安全型的伴侶有時會無意間成為不安全型伴侶的「情緒容器」，承擔過多的情緒調節功能。這種長期的角色失衡，會漸漸消耗您的安全感底氣，讓您開始懷疑自己是否哪裡做得不夠好。

您需要的，不是更多的包容，而是更清晰的邊界意識與對「對等性」的誠實要求。`,
    prescription: [
      {
        month: '第一個月', title: '釐清關係中的失衡點',
        steps: [
          '列出關係中「付出與接受」的比例感：有哪些部分讓你感到長期不平衡？把它們誠實地寫下來。',
          '練習「邊界聲明」：選一件你一直想說卻沒說的事，這個月溫柔但清楚地表達出來。',
          '問自己：「我的基本需求（被重視、被回應、有安全感）在這段關係中，是否被穩定地滿足？」',
        ],
      },
      {
        month: '第二個月', title: '強化對等溝通',
        steps: [
          '邀請伴侶進行「需求對話」：讓雙方各自分享一個在關係中最重要的需求，讓彼此都被看見。',
          '觀察對方是否有「成長意願」：面對你的需求，他是否願意做出真實的調整？',
          '繼續投資您的獨立性：友誼、興趣、個人發展——不要讓伴侶成為您唯一的情感來源。',
        ],
      },
      {
        month: '第三個月', title: '做出有意識的選擇',
        steps: [
          '誠實問自己：「三個月後，這段關係讓我更完整，還是讓我慢慢縮小了？」',
          '把關係想像成一個合夥系統：你們雙方是否都在為這個系統的健康做出真實的貢獻？',
          '若答案令你不安，考慮尋求伴侶諮商，或為自己制定清晰的關係下一步行動計畫。',
        ],
      },
    ],
  },
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function calcResults(answers) {
  const total = answers.reduce((s, a) => s + a.weight, 0)
  let profile
  if (total >= PROFILES.frozen.minScore)     profile = PROFILES.frozen
  else if (total >= PROFILES.cold.minScore)  profile = PROFILES.cold
  else if (total >= PROFILES.warm.minScore)  profile = PROFILES.warm
  else                                        profile = PROFILES.secure

  // Temperature: score 20 → 38°C, score 80 → 16°C
  const temp = Math.round((38 - ((total - 20) / 60) * 22) * 10) / 10

  // Per-dimension health 0–100 (100 = healthy, 0 = anxious)
  const dimData = DIMENSIONS.map(dim => {
    const da = answers.filter(a => a.dim === dim.id)
    const sum = da.reduce((s, a) => s + a.weight, 0)
    const health = Math.round((1 - (sum - da.length) / (3 * da.length)) * 100)
    return { ...dim, health }
  })

  return { profile, temp, total, dimData }
}

function getDimText(dimId, health) {
  const level = health >= 75 ? 3 : health >= 50 ? 2 : health >= 25 ? 1 : 0
  const map = {
    1: [ // 關係溫度的流失
      '關係溫度已降至臨界值。你長期活在「假性穩定」的表象下，壓力正悄悄積累。',
      '你明顯感受到兩人之間溫度在流失，這份感知是真實的，不是你多想了。',
      '偶爾感覺到疏離，但整體溫度還在。留意那些微小的冷卻訊號。',
      '你們之間的連結感相當穩定，少有「溫度流失」的感覺。',
    ],
    2: [ // 互動中的防衛
      '你的防衛機制高度活躍，幾乎所有真實情緒都被包裹在保護層之下，對方看不見真正的你。',
      '你已建立了一套精密的防衛策略——沉默、刪除、測試——這套系統讓你筋疲力竭。',
      '你有時會選擇迂迴，多數情況下還是能夠表達自己。',
      '你在互動中展現出相當的直接性，較少使用防衛式的迴避。',
    ],
    3: [ // 不安的內在根源
      '你的心理安全感幾乎完全依賴對方的回應，這是最深層的依附傷口，也最值得被療癒。',
      '你的不安已有相當深的根源，對方的每個反應都成為你衡量自我價值的尺。',
      '你的情緒有時會被對方的態度牽動，但你仍保有一定的自我中心。',
      '你的情緒狀態與自我價值感，基本上是獨立於對方反應之外的。',
    ],
    4: [ // 對未來的預期
      '你對這段關係的未來幾乎失去了信心，靈魂已進入「高度消耗」的警戒狀態。',
      '你已開始在潛意識中為「失去」做準備，靈魂的耗損感正悄悄積累。',
      '你對未來的態度有些搖擺，既有期待，也有不安，正在尋找穩定的答案。',
      '你對這段關係的未來抱持著開放而積極的態度，即使偶有不確定。',
    ],
  }
  return map[dimId][level]
}

// ─── ECPAY UTILITIES ─────────────────────────────────────────────────────────

function generateTradeNo() {
  const d = new Date()
  const pad = (n, l = 2) => String(n).padStart(l, '0')
  return `KM${String(d.getFullYear()).slice(-2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
}

function formatTradeDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const ECPAY_PARAMS = {
  MerchantID: '3002607',
  TotalAmount: 299,
  ItemName: 'KindlesMind 深度關係診斷處方箋',
  TradeDesc: 'KindlesMind 靈魂處方箋數位報告',
  ReturnURL: 'https://kindlesmind.com/ecpay/notify',
  ClientBackURL: 'https://kindlesmind.com/result',
  PaymentType: 'aio',
  ChoosePayment: 'ALL',
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Orb({ x, y, size, color, opacity = 0.07, delay = 0 }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, opacity }}
      animate={{ scale: [1, 1.15, 1], opacity: [opacity, opacity * 1.6, opacity] }}
      transition={{ duration: 9 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

function DimBar({ dim, health, delay = 0, text }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-warm-text">
          <dim.Icon size={12} style={{ color: dim.color }} />
          {dim.name}
        </span>
        <span className="text-xs font-bold" style={{ color: dim.color }}>{health}%</span>
      </div>
      <div className="h-1.5 bg-warm-cream-dark rounded-full overflow-hidden mb-2">
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${dim.color}99, ${dim.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${health}%` }}
          transition={{ duration: 1.1, delay, ease: 'easeOut' }}
        />
      </div>
      {text && (
        <p className="text-xs leading-relaxed italic px-0.5" style={{ color: dim.color + 'CC' }}>{text}</p>
      )}
    </div>
  )
}

function CreditCardBadges() {
  const cards = [
    { label: 'VISA',   bg: '#1A1F71', color: '#fff', italic: true,  fw: 800 },
    { label: 'MC',     bg: 'linear-gradient(90deg,#EB001B 38%,#F79E1B)', color: '#fff', fw: 700 },
    { label: 'JCB',    bg: 'linear-gradient(135deg,#003087 0%,#009F6B 100%)', color: '#fff', fw: 700 },
    { label: 'ATM',    bg: '#5F7161', color: '#fff', fw: 600 },
    { label: '超商代碼', bg: '#E8956A', color: '#fff', fw: 600 },
  ]
  return (
    <div className="flex items-center justify-center flex-wrap gap-1.5 mb-4">
      {cards.map((c, i) => (
        <div key={i}
          className="h-6 px-2.5 rounded-md flex items-center justify-center text-white select-none"
          style={{
            background: c.bg, fontWeight: c.fw, fontSize: '9px',
            fontStyle: c.italic ? 'italic' : 'normal',
            minWidth: c.label.length > 4 ? '52px' : '36px',
            letterSpacing: c.italic ? '0.04em' : 0,
          }}>
          {c.label}
        </div>
      ))}
    </div>
  )
}

function MonochromeBadges() {
  const cards = [
    { label: 'VISA', italic: true, fw: 800 },
    { label: 'MC', fw: 600 },
    { label: 'JCB', fw: 600 },
    { label: 'ATM', fw: 600 },
    { label: '超商', fw: 600 },
  ]
  return (
    <div className="flex items-center justify-center gap-1.5">
      {cards.map((c, i) => (
        <div key={i}
          className="h-5 px-2 rounded-md border flex items-center justify-center select-none"
          style={{
            borderColor: '#D4C5BC', color: '#B0A49F', backgroundColor: '#FAF7F5',
            fontSize: '8px', fontWeight: c.fw,
            fontStyle: c.italic ? 'italic' : 'normal',
            minWidth: c.label.length > 3 ? '30px' : '26px',
          }}>
          {c.label}
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ icon: Icon, color, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color + '20' }}>
        <Icon size={12} style={{ color }} />
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>{children}</span>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroScreen({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <Orb x="-5%" y="15%" size={320} color="#D48C70" delay={0} />
      <Orb x="75%" y="60%" size={260} color="#5F7161" opacity={0.06} delay={3} />
      <Orb x="40%" y="40%" size={500} color="#D48C70" opacity={0.03} delay={5} />

      {/* Logo */}
      <motion.div className="flex flex-col items-center mb-10"
        initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <motion.div className="relative mb-5"
          animate={{ filter: ['drop-shadow(0 0 12px rgba(212,140,112,0.3))', 'drop-shadow(0 0 28px rgba(212,140,112,0.6))', 'drop-shadow(0 0 12px rgba(212,140,112,0.3))'] }}
          transition={{ duration: 3, repeat: Infinity }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-terracotta-lg"
            style={{ background: 'linear-gradient(135deg, #D48C70, #B8704F)' }}>
            <Flame size={30} className="text-white" />
          </div>
        </motion.div>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-warm-text mb-1">KindlesMind</h1>
        <p className="text-warm-text-muted text-xs tracking-[0.25em] uppercase">Relationship Temperature Diagnosis</p>
      </motion.div>

      {/* Tagline */}
      <motion.div className="text-center mb-10 max-w-xs"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p className="font-serif text-2xl text-warm-text leading-snug mb-3 font-medium">
          你的關係，現在幾度？
        </p>
        <p className="text-warm-text-muted text-sm leading-relaxed">
          一份誠實的情感溫度測量。<br />
          <span className="text-warm-terracotta">20個問題，找回屬於你的答案。</span>
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="flex items-center gap-5 mb-9"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        {[
          { Icon: Star,  label: '4.9 評分', sub: '心理師團隊認證' },
          { Icon: Heart, label: '12,400+', sub: '已完成診斷' },
          { Icon: Shield,label: '匿名保護', sub: '資料不被儲存' },
        ].map(({ Icon, label, sub }, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Icon size={11} className="text-warm-terracotta" />
              <span className="text-warm-text text-xs font-semibold">{label}</span>
            </div>
            <span className="text-warm-text-light text-xs">{sub}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        className="group relative overflow-hidden px-10 py-4 rounded-2xl text-white font-medium text-base shadow-terracotta-lg"
        style={{ background: 'linear-gradient(135deg, #5F7161, #4A5A4C)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        onClick={onStart}>
        <span className="relative z-10 flex items-center gap-2">
          開始測驗 · 完全免費
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(135deg, #D48C70, #B8704F)' }} />
      </motion.button>

      <motion.p className="text-warm-text-light text-xs mt-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
        約 5 分鐘完成 · 20道深度題目 · 4個維度分析
      </motion.p>

      {/* Dimension preview */}
      <motion.div className="mt-10 grid grid-cols-2 gap-2 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
        {DIMENSIONS.map(dim => (
          <div key={dim.id}
            className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2.5 border border-warm-cream-dark/40 shadow-warm-sm">
            <dim.Icon size={13} style={{ color: dim.color }} />
            <div>
              <div className="text-warm-text text-xs font-medium">{dim.name}</div>
              <div className="text-warm-text-light text-xs">{dim.sub}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── QUIZ ────────────────────────────────────────────────────────────────────

function MilestoneCard({ milestone, onContinue }) {
  const pct = milestone.progress
  const r = 40, circ = 2 * Math.PI * r
  const strokeDash = (pct / 100) * circ
  return (
    <motion.div className="min-h-screen flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="w-full max-w-sm bg-white rounded-3xl shadow-warm-xl border border-warm-cream-dark/40 p-8 text-center"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}>
        {/* Circle progress */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#EDE0D5" strokeWidth="6" />
            <motion.circle cx="48" cy="48" r={r} fill="none" stroke="#D48C70" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - strokeDash }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-xl font-bold text-warm-terracotta">{pct}%</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="font-serif text-lg text-warm-text font-semibold leading-snug mb-3">
            {milestone.title}
          </p>
          <p className="text-warm-text-muted text-sm leading-relaxed mb-6">{milestone.body}</p>

          <div className="bg-warm-cream rounded-2xl px-4 py-3 mb-6 border border-warm-cream-dark/30">
            <p className="text-warm-text-muted text-xs mb-0.5">接下來進入</p>
            <p className="font-serif text-warm-text font-semibold">{milestone.nextDim}</p>
            <p className="text-warm-text-light text-xs">{milestone.nextSub}</p>
          </div>

          <motion.button
            className="w-full py-3.5 rounded-2xl text-white font-medium shadow-warm"
            style={{ background: 'linear-gradient(135deg, #5F7161, #4A5A4C)' }}
            onClick={onContinue}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            繼續前行 <ArrowRight size={14} className="inline ml-1" />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function QuizScreen({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers]   = useState([])
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState(1)
  const [milestone, setMilestone] = useState(null) // null | milestone obj

  const q = QUESTIONS[currentQ]
  const dim = DIMENSIONS.find(d => d.id === q.dim)
  const progressPct = Math.round(((currentQ) / 20) * 100)

  const progressMessages = { 25: '你很勇敢 ✦', 50: '你在深入自己 ✦', 75: '快到了 ✦' }
  const nearestMsg = [75, 50, 25].find(p => progressPct >= p)

  const handleOptionClick = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    setTimeout(() => {
      const answer = { dim: q.dim, weight: ANSWERS[idx].weight, qid: q.id }
      const newAnswers = [...answers, answer]

      const ms = MILESTONES.find(m => m.afterIdx === currentQ)
      if (ms) {
        setAnswers(newAnswers)
        setSelected(null)
        setMilestone(ms)
        return
      }
      if (currentQ === 19) {
        setAnswers(newAnswers)
        onComplete(newAnswers)
        return
      }
      setDirection(1)
      setAnswers(newAnswers)
      setSelected(null)
      setCurrentQ(q => q + 1)
    }, 380)
  }

  const handlePrev = () => {
    if (currentQ === 0) return
    setDirection(-1)
    setSelected(null)
    setAnswers(a => a.slice(0, -1))
    setCurrentQ(q => q - 1)
  }

  const handleMilestoneContinue = () => {
    setMilestone(null)
    setDirection(1)
    setCurrentQ(q => q + 1)
  }

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
  }

  if (milestone) {
    return (
      <AnimatePresence mode="wait">
        <MilestoneCard key="milestone" milestone={milestone} onContinue={handleMilestoneContinue} />
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 max-w-lg mx-auto">
      {/* Header progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: dim.color + '20' }}>
              <dim.Icon size={12} style={{ color: dim.color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: dim.color }}>{dim.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {nearestMsg && (
              <span className="text-warm-terracotta text-xs">{progressMessages[nearestMsg]}</span>
            )}
            <span className="text-warm-text-muted text-xs">{currentQ + 1} / 20</span>
          </div>
        </div>
        <div className="h-1 bg-warm-cream-dark rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${dim.color}99, ${dim.color})` }}
            animate={{ width: `${progressPct + 5}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        {/* Dim dots */}
        <div className="flex gap-1.5 mt-2.5">
          {DIMENSIONS.map((d, i) => (
            <div key={d.id} className="flex gap-0.5">
              {[0,1,2,3,4].map(j => {
                const qIdx = i * 5 + j
                return (
                  <div key={j} className="h-1 w-3 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: qIdx < currentQ
                        ? d.color
                        : qIdx === currentQ
                          ? d.color + '99'
                          : '#EDE0D5'
                    }} />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentQ} custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
            <div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6">
              {/* Dim badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-xs font-medium"
                style={{ backgroundColor: dim.color + '18', color: dim.color, border: `1px solid ${dim.color}30` }}>
                <dim.Icon size={11} />
                {dim.name} · Q{q.id}
              </div>

              <p className="font-serif text-lg text-warm-text leading-relaxed mb-6 font-medium">
                {q.text}
              </p>

              <div className="space-y-2.5">
                {ANSWERS.map((ans, i) => (
                  <motion.button key={i}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm transition-all duration-200 ${
                      selected === i
                        ? 'text-warm-text font-medium'
                        : 'border-warm-cream-dark bg-warm-cream/60 text-warm-text-muted hover:border-warm-sage/40 hover:bg-warm-cream'
                    }`}
                    style={selected === i
                      ? { borderColor: dim.color, backgroundColor: dim.color + '0E' }
                      : {}}
                    onClick={() => handleOptionClick(i)}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileTap={{ scale: 0.99 }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200`}
                        style={{
                          borderColor: selected === i ? dim.color : '#D4C5BC',
                          backgroundColor: selected === i ? dim.color : 'transparent',
                        }}>
                        {selected === i && (
                          <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                            initial={{ scale: 0 }} animate={{ scale: 1 }} />
                        )}
                      </div>
                      {ans.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex justify-between items-center mt-5">
        <button onClick={handlePrev} disabled={currentQ === 0}
          className="flex items-center gap-1 text-warm-text-muted text-sm disabled:opacity-25 hover:text-warm-text transition-colors">
          <ChevronLeft size={16} /> 前一題
        </button>
        <span className="text-warm-text-light text-xs">點選選項自動前進</span>
      </div>
    </div>
  )
}

// ─── CALCULATING ─────────────────────────────────────────────────────────────

function CalculatingScreen() {
  const [step, setStep] = useState(0)
  const steps = [
    '分析你的情感頻率…',
    '解讀潛意識中的關係信念…',
    '校準心靈溫度指標…',
    '生成個人化診斷報告…',
  ]
  useEffect(() => {
    steps.forEach((_, i) => setTimeout(() => setStep(i), i * 750))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Orb x="10%" y="20%" size={250} color="#D48C70" opacity={0.08} />
      <Orb x="60%" y="55%" size={200} color="#5F7161" opacity={0.07} delay={2} />

      {/* Breathing orb */}
      <div className="relative mb-10">
        {[200, 150, 100].map((size, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{
              width: size, height: size,
              left: -size / 2, top: -size / 2,
              border: i < 2 ? `1.5px solid rgba(95,113,97,${0.12 + i * 0.1})` : undefined,
              background: i === 2 ? 'radial-gradient(circle, #5F7161, #4A5A4C)' : undefined,
            }}
            animate={{ scale: [1, 1.08 + i * 0.04, 1], opacity: [0.4 + i * 0.25, 1, 0.4 + i * 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
          />
        ))}
        <motion.div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-warm-xl"
          style={{ background: 'linear-gradient(135deg, #5F7161, #4A5A4C)' }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <Thermometer size={34} className="text-white" />
        </motion.div>
      </div>

      <motion.h2 className="font-serif text-2xl text-warm-text font-medium mb-2 text-center"
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 3.5, repeat: Infinity }}>
        正在分析你的情感頻率…
      </motion.h2>
      <p className="text-warm-text-muted text-sm mb-8 text-center">請保持呼吸，靜靜等待</p>

      <div className="space-y-2.5 w-full max-w-xs">
        {steps.map((text, i) => (
          <motion.div key={i}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500"
            style={i <= step ? { backgroundColor: 'rgba(95,113,97,0.07)' } : {}}
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: i <= step ? 1 : 0.25 }}
            transition={{ delay: i * 0.18 }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
              style={{
                backgroundColor: i < step ? '#5F7161' : i === step ? '#D48C70' : '#EDE0D5'
              }}>
              {i < step
                ? <CheckCircle size={12} className="text-white" />
                : <div className="w-2 h-2 rounded-full bg-white opacity-80" />
              }
            </div>
            <span className={`text-sm ${i <= step ? 'text-warm-text' : 'text-warm-text-muted'}`}>{text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── RESULT ──────────────────────────────────────────────────────────────────

function FullReport({ profile, temp, dimData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="mt-6 space-y-5">

      {/* Unlock banner */}
      <div className="flex items-center gap-2.5 bg-warm-sage/8 border border-warm-sage/20 rounded-2xl px-4 py-3"
        style={{ backgroundColor: 'rgba(95,113,97,0.08)', borderColor: 'rgba(95,113,97,0.2)' }}>
        <Unlock size={16} className="text-warm-sage flex-shrink-0" style={{ color: '#5F7161' }} />
        <p className="text-sm font-medium" style={{ color: '#4A5A4C' }}>
          完整診斷報告已解鎖 · 僅供您個人參考
        </p>
      </div>

      {/* Section: Root Analysis */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm p-6">
        <SectionLabel icon={Brain} color="#E8956A">深度根源分析</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-3">
          你的心靈地圖是如何形成的？
        </p>
        <p className="text-warm-text-muted text-sm leading-loose whitespace-pre-line">
          {profile.rootAnalysis}
        </p>
      </div>

      {/* Section: Partner Decode */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm p-6">
        <SectionLabel icon={Eye} color="#7B9EE8">對方的潛意識行為解讀</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-3">
          他的行為背後，藏著什麼？
        </p>
        <p className="text-warm-text-muted text-sm leading-loose whitespace-pre-line">
          {profile.partnerDecode}
        </p>
      </div>

      {/* Section: Prescription */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm p-6">
        <SectionLabel icon={Clock} color="#5F7161">三個月療癒處方箋</SectionLabel>
        <p className="font-serif text-warm-text text-base leading-relaxed font-medium mb-5">
          接下來，你可以這樣做
        </p>
        <div className="space-y-5">
          {profile.prescription.map((month, i) => (
            <motion.div key={i}
              className="relative pl-5 border-l-2"
              style={{ borderColor: i === 0 ? '#D48C70' : i === 1 ? '#7B9EE8' : '#5F7161' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}>
              <div className="absolute -left-1.5 top-0.5 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: i === 0 ? '#D48C70' : i === 1 ? '#7B9EE8' : '#5F7161' }} />
              <p className="text-xs text-warm-text-muted mb-0.5">{month.month}</p>
              <p className="font-serif text-warm-text font-semibold mb-2">{month.title}</p>
              <ul className="space-y-1.5">
                {month.steps.map((s, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-warm-text-muted leading-relaxed">
                    <CheckCircle size={13} className="flex-shrink-0 mt-0.5 text-warm-sage" style={{ color: '#5F7161' }} />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center py-4">
        <Leaf size={14} className="text-warm-terracotta mx-auto mb-2 opacity-60" />
        <p className="text-warm-text-light text-xs">
          KindlesMind 診斷報告 · 僅供個人參考，不替代專業臨床診療
        </p>
      </div>
    </motion.div>
  )
}

function ResultScreen({ results, onUnlock, isUnlocked, userEmail, onModal, onRetake }) {
  const { profile, temp, dimData } = results
  const [email, setEmail]               = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [resendState, setResendState]   = useState(null) // null | 'sending' | 'sent'
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleResend = () => {
    setResendState('sending')
    setTimeout(() => setResendState('sent'), 1800)
  }

  return (
    <motion.div className="min-h-screen px-5 py-10 max-w-lg mx-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <motion.div className="text-center mb-7"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium mb-4"
          style={{ backgroundColor: '#D48C7018', color: '#D48C70', border: '1px solid #D48C7030' }}>
          <Sparkles size={11} />
          診斷完成 · {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
        </div>
        <h2 className="font-serif text-2xl text-warm-text font-semibold mb-1">你的關係溫度報告</h2>
        <p className="text-warm-text-muted text-sm">以下是根據你的 20 個回答生成的專屬診斷</p>
        <motion.button
          onClick={onRetake}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{ backgroundColor: '#F0EAE4', color: '#8A7F7C', border: '1px solid rgba(212,196,188,0.6)' }}
          whileHover={{ scale: 1.03, backgroundColor: '#EAE0D8' }}
          whileTap={{ scale: 0.97 }}>
          <RefreshCw size={13} />
          重新測驗
        </motion.button>
      </motion.div>

      {/* Temperature card */}
      <motion.div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6 mb-5"
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-warm-text-muted text-xs tracking-widest uppercase mb-1">心靈餘溫值</p>
            <motion.p className="font-serif text-6xl font-bold leading-none mb-1"
              style={{ color: profile.accentColor }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}>
              {temp}°<span className="text-3xl">C</span>
            </motion.p>
            <p className="font-serif text-warm-text font-semibold text-lg">{profile.label}</p>
          </div>
          <div>
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-warm-sm border"
              style={{ backgroundColor: profile.tagBg, borderColor: profile.tagBorder }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              {profile.emoji}
            </motion.div>
          </div>
        </div>

        {/* Tag */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: profile.tagBg, color: profile.tagColor, borderColor: profile.tagBorder }}>
            <AlertCircle size={11} />
            核心焦慮標籤：{profile.tag}
          </span>
        </div>

        <p className="text-warm-text-muted text-sm leading-relaxed bg-warm-cream/80 rounded-2xl p-4 border border-warm-cream-dark/30 mb-5">
          {profile.summary}
        </p>

        {/* Free insight pill */}
        <div className="flex items-start gap-2.5 bg-warm-sage/6 rounded-xl px-4 py-3 border border-warm-sage/15"
          style={{ backgroundColor: 'rgba(95,113,97,0.06)', borderColor: 'rgba(95,113,97,0.15)' }}>
          <Eye size={14} className="text-warm-sage flex-shrink-0 mt-0.5" style={{ color: '#5F7161' }} />
          <p className="text-sm text-warm-text-muted leading-relaxed">
            <span className="font-semibold text-warm-text">初步觀測：</span>{profile.freeInsight}
          </p>
        </div>
      </motion.div>

      {/* Archetype card */}
      <motion.div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6 mb-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <p className="text-xs text-warm-text-muted tracking-widest uppercase mb-4">你的靈魂原型</p>
        <div className="flex items-start gap-4">
          <motion.div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-warm-sm border"
            style={{ backgroundColor: profile.tagBg, borderColor: profile.tagBorder }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
            {profile.emoji}
          </motion.div>
          <div>
            <p className="font-serif text-xl text-warm-text font-semibold leading-tight mb-1.5">{profile.archetype}</p>
            <p className="text-warm-text-muted text-sm leading-relaxed italic">{profile.archetypeDesc}</p>
          </div>
        </div>
      </motion.div>

      {/* Soul paradox card */}
      <motion.div className="rounded-3xl border p-6 mb-5"
        style={{ background: 'linear-gradient(135deg, #FDF3EE 0%, #F5EDE6 100%)', borderColor: 'rgba(212,140,112,0.25)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} style={{ color: '#D48C70' }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#D48C70' }}>靈魂矛盾</p>
        </div>
        <p className="text-warm-text text-sm leading-loose">{profile.soulParadox}</p>
      </motion.div>

      {/* Dimension bars card */}
      <motion.div className="bg-white rounded-3xl shadow-warm-lg border border-warm-cream-dark/40 p-6 mb-5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <p className="text-xs text-warm-text-muted tracking-widest uppercase mb-4">四維度健康評估</p>
        {dimData.map((d, i) => (
          <DimBar key={d.id} dim={d} health={d.health} delay={0.45 + i * 0.1} text={getDimText(d.id, d.health)} />
        ))}
      </motion.div>

      {/* ── LOCKED SECTION ── */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div key="locked"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            exit={{ opacity: 0 }}>

            {/* ── Social proof quote ── */}
            <motion.p
              className="text-center text-sm leading-relaxed mb-5 px-3 font-serif"
              style={{ color: '#9A8E8B' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              「這段路上你並不孤單，<br />
              已有{' '}
              <strong className="text-warm-text not-italic" style={{ fontWeight: 600 }}>12,500+</strong>
              {' '}位靈魂在此獲得平靜與解答。」
            </motion.p>

            {/* ── Main invitation card ── */}
            <motion.div
              className="bg-white overflow-hidden"
              style={{ borderRadius: '28px', border: '1px solid rgba(212,196,188,0.5)', boxShadow: '0 16px 60px rgba(95,113,97,0.12), 0 4px 16px rgba(212,140,112,0.08)' }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>

              {/* ── 1. Blurred report preview ── */}
              <div className="relative overflow-hidden" style={{ height: '196px', backgroundColor: '#F9F4F0' }}>
                {/* Fake report skeleton – blurred */}
                <div className="p-5 space-y-3.5 select-none pointer-events-none" style={{ filter: 'blur(3.5px)', opacity: 0.75 }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#D48C70' }} />
                    <div className="h-2 rounded" style={{ width: '88px', backgroundColor: '#D48C7055' }} />
                  </div>
                  <div className="h-4 rounded" style={{ width: '72%', backgroundColor: '#43424222' }} />
                  <div className="space-y-1.5">
                    {[100, 92, 100, 78, 88].map((w, i) => (
                      <div key={i} className="h-2 rounded" style={{ width: `${w}%`, backgroundColor: '#43424215' }} />
                    ))}
                  </div>
                  {/* Divider + section 2 */}
                  <div className="pt-1">
                    <div className="h-px mb-2.5" style={{ backgroundColor: '#EDE0D5' }} />
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7B9EE8' }} />
                      <div className="h-2 rounded" style={{ width: '72px', backgroundColor: '#7B9EE855' }} />
                    </div>
                    <div className="h-3.5 rounded mb-1.5" style={{ width: '60%', backgroundColor: '#43424220' }} />
                    <div className="space-y-1.5">
                      {[100, 95, 82].map((w, i) => (
                        <div key={i} className="h-2 rounded" style={{ width: `${w}%`, backgroundColor: '#43424213' }} />
                      ))}
                    </div>
                  </div>
                  {/* Timeline */}
                  <div className="flex gap-3 pt-1">
                    <div className="w-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#5F716150', minHeight: '40px' }} />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 rounded" style={{ width: '55%', backgroundColor: '#43424220' }} />
                      {[100, 88].map((w, i) => (
                        <div key={i} className="h-2 rounded" style={{ width: `${w}%`, backgroundColor: '#43424212' }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frosted glass overlay */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to bottom, rgba(249,244,240,0.1) 0%, rgba(249,244,240,0.55) 38%, rgba(255,255,255,0.97) 82%)',
                  backdropFilter: 'blur(1px)',
                }} />

                {/* Bottom label */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2.5">
                  <div className="flex items-center gap-1.5" style={{ color: '#B8704F' }}>
                    <Lock size={10} />
                    <span className="text-xs font-medium">完整報告預覽</span>
                  </div>
                  <span className="text-warm-text-light" style={{ fontSize: '10px' }}>·</span>
                  <span className="text-xs" style={{ color: '#A89D9A' }}>3,500+ 字 · 4 個章節</span>
                </div>
              </div>

              {/* ── 3. Value checklist ── */}
              <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(212,196,188,0.4)' }}>
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: '#B0A49F' }}>解鎖後你將獲得</p>
                <div className="space-y-3.5">
                  {[
                    { icon: Brain,       color: '#E8956A', title: '依附人格成因溯源',       desc: '深入早期情感記憶，找到不安感真正的起源' },
                    { icon: Eye,         color: '#7B9EE8', title: '潛意識行為模式全面解讀', desc: '讀懂你在關係中反覆觸發的無意識反應劇本' },
                    { icon: AlertCircle, color: '#D48C70', title: '致命地雷 × 3 預防指南',  desc: '辨識並拆除最容易炸毀這段關係的互動陷阱' },
                    { icon: Leaf,        color: '#5F7161', title: '30 天復原計畫',           desc: '每日具體步驟，重建你在愛中的情感安全感' },
                  ].map((item, i) => {
                    const Icon = item.icon
                    return (
                      <motion.div key={i} className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -14 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-8px' }}
                        transition={{ delay: i * 0.09, duration: 0.45, ease: 'easeOut' }}>
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                          style={{ backgroundColor: item.color + '18' }}>
                          <Icon size={14} style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-warm-text text-sm font-semibold leading-tight">{item.title}</p>
                          <p className="text-warm-text-muted text-xs leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                        <motion.div className="flex-shrink-0 mt-1.5"
                          initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                          viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.09, type: 'spring', stiffness: 300 }}>
                          <CheckCircle size={14} style={{ color: item.color + 'AA' }} />
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* ── 4. Email collection ── */}
              <motion.div
                className="px-6 pt-5 pb-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.45, ease: 'easeOut' }}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#7A6E6B' }}>
                  接收診斷處方箋的電子信箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => { setEmailFocused(false); setEmailTouched(true) }}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200"
                  style={{
                    backgroundColor: '#F0EAE4',
                    border: `1.5px solid ${
                      emailFocused
                        ? '#5F7161'
                        : emailTouched && !isEmailValid
                          ? 'rgba(232,114,74,0.6)'
                          : 'rgba(212,196,188,0.5)'
                    }`,
                    color: '#3D3430',
                  }}
                />
                {emailTouched && !isEmailValid && email.length > 0 && (
                  <motion.p
                    className="text-xs mt-1 ml-1"
                    style={{ color: '#E8724A' }}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    請輸入有效的電子信箱格式
                  </motion.p>
                )}
                <p className="text-xs mt-2 leading-relaxed" style={{ color: '#B0A49F' }}>
                  診斷處方箋將發送至您的信箱，請確保輸入正確以便從{' '}
                  <span style={{ color: '#8A9E8C' }}>@kindlesmind.com</span>{' '}
                  接收報告。
                </p>
              </motion.div>

              {/* ── 5. Price + CTA ── */}
              <div className="px-6 py-5">
                {/* Price row */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <span className="text-xs line-through block mb-0.5" style={{ color: '#C4B8B4' }}>原價 NT$980</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-4xl font-bold text-warm-text leading-none">NT$299</span>
                      <span className="text-warm-text-muted text-xs">一次付費</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-white text-xs px-3 py-1.5 rounded-full font-semibold mb-1"
                      style={{ background: 'linear-gradient(135deg, #D48C70, #B8704F)' }}>
                      省 NT$681
                    </span>
                    <p className="text-warm-text-light text-xs">永久查閱</p>
                  </div>
                </div>

                {/* Breathing gradient CTA button */}
                <motion.button
                  className="group relative w-full py-4 rounded-3xl text-white font-semibold text-base overflow-hidden flex items-center justify-center gap-2.5 mb-4 transition-opacity duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #5F7161 0%, #8E6E5A 48%, #D48C70 100%)',
                    opacity: isEmailValid ? 1 : 0.45,
                    cursor: isEmailValid ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => { if (isEmailValid) onUnlock(email) }}
                  disabled={!isEmailValid}
                  animate={{
                    boxShadow: [
                      '0 4px 20px rgba(95,113,97,0.3), 0 0 0 0 rgba(212,140,112,0)',
                      '0 8px 36px rgba(212,140,112,0.45), 0 0 0 6px rgba(212,140,112,0.06)',
                      '0 4px 20px rgba(95,113,97,0.3), 0 0 0 0 rgba(212,140,112,0)',
                    ],
                  }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.98 }}>
                  {/* Shimmer sweep on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)' }} />
                  <Sparkles size={15} className="relative z-10 flex-shrink-0" />
                  <span className="relative z-10">解鎖我的專屬靈魂處方箋</span>
                  <ArrowRight size={15} className="relative z-10 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Monochrome payment badges */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MonochromeBadges />
                </div>

                {/* Safety text */}
                <div className="flex items-start justify-center gap-1.5 mb-3">
                  <ShieldCheck size={10} className="flex-shrink-0 mt-0.5" style={{ color: '#B0A49F' }} />
                  <p className="text-center leading-relaxed" style={{ color: '#B0A49F', fontSize: '10px' }}>
                    SSL 256-bit 加密安全支付 · 由綠界科技提供技術支援<br />
                    交易將於 kindlesmind.com 安全環境下進行
                  </p>
                </div>

                {/* Refund defense copy */}
                <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#F5EFE9', border: '1px solid rgba(212,196,188,0.5)' }}>
                  <p className="text-center leading-relaxed" style={{ color: '#A89D9A', fontSize: '10px' }}>
                    本商品為數位內容服務，購買後立即解鎖，<strong style={{ color: '#9A918E' }}>不適用 7 天鑑賞期</strong>。<br />
                    點擊購買即代表您同意本站之
                    <button onClick={() => onModal?.('terms')} className="underline underline-offset-1 hover:opacity-80 transition-opacity mx-0.5" style={{ color: '#9A918E', fontSize: 'inherit' }}>
                      服務條款
                    </button>。
                  </p>
                </div>
              </div>

            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FullReport profile={profile} temp={temp} dimData={dimData} />

            {/* ── Resend button ── */}
            <motion.div
              className="text-center py-4 px-5"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              {resendState === 'sent' ? (
                <motion.p
                  className="text-xs flex items-center justify-center gap-1.5"
                  style={{ color: '#5F7161' }}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <BadgeCheck size={13} />
                  已重新寄送至 {userEmail || '您的信箱'}，請確認垃圾郵件匣。
                </motion.p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendState === 'sending'}
                  className="flex items-center justify-center gap-1.5 mx-auto text-xs transition-colors hover:text-warm-terracotta disabled:opacity-50"
                  style={{ color: '#B0A49F' }}>
                  <RefreshCw size={11} className={resendState === 'sending' ? 'animate-spin' : ''} />
                  {resendState === 'sending' ? '寄送中…' : '沒收到報告？點此重新寄送'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── ECPAY MODAL ──────────────────────────────────────────────────────────────

function EcpayModal({ onClose, onSuccess, email }) {
  // steps: init → redirecting → ecpay → success
  const [step, setStep] = useState('init')
  const [tradeNo] = useState(generateTradeNo)
  const [tradeDate] = useState(() => formatTradeDate())

  useEffect(() => {
    const t1 = setTimeout(() => setStep('redirecting'), 1400)
    const t2 = setTimeout(() => setStep('ecpay'), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleSimPay = () => {
    setStep('success')
    setTimeout(() => { onSuccess(); onClose() }, 2200)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      {/* Backdrop — only closeable before ecpay step */}
      <motion.div className="absolute inset-0"
        style={{ backgroundColor: 'rgba(67,66,66,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={step === 'ecpay' ? undefined : onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

      <motion.div className="relative w-full max-w-sm mx-4 overflow-hidden"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}>

        <AnimatePresence mode="wait">

          {/* ── Step 1: init – 準備交易參數 ── */}
          {step === 'init' && (
            <motion.div key="init"
              className="bg-white rounded-3xl shadow-warm-xl overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
              <div className="px-6 pt-6 pb-5">
                <button onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center text-warm-text-muted hover:bg-warm-cream-dark transition-colors">
                  <X size={14} />
                </button>
                {/* ECPay brand strip */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-7 px-3 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)', letterSpacing: '0.05em' }}>
                    綠界科技 ECPay
                  </div>
                  <span className="text-warm-text-light text-xs">安全金流跳轉中</span>
                </div>

                <p className="font-serif text-warm-text font-semibold mb-4">正在產生交易憑證…</p>

                {/* Trade params table */}
                <div className="bg-warm-cream rounded-2xl p-4 space-y-2.5 border border-warm-cream-dark/40 text-xs mb-4">
                  {[
                    { key: 'MerchantID',         val: ECPAY_PARAMS.MerchantID },
                    { key: 'MerchantTradeNo',     val: tradeNo },
                    { key: 'MerchantTradeDate',   val: tradeDate },
                    { key: 'TotalAmount',         val: `NT$ ${ECPAY_PARAMS.TotalAmount}` },
                    { key: 'ItemName',            val: ECPAY_PARAMS.ItemName },
                    { key: 'ChoosePayment',       val: '信用卡 / ATM / 超商代碼' },
                  ].map(({ key, val }) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="text-warm-text-muted font-mono flex-shrink-0">{key}</span>
                      <span className="text-warm-text font-medium text-right break-all">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-warm-text-muted text-xs">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={11} />
                  </motion.div>
                  使用 SHA256 雜湊加密，準備跳轉至綠界支付頁面…
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: redirecting ── */}
          {step === 'redirecting' && (
            <motion.div key="redirecting"
              className="bg-white rounded-3xl shadow-warm-xl py-16 px-6 flex flex-col items-center text-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Animated lock → arrow */}
              <div className="relative mb-6">
                {[140, 100, 64].map((size, i) => (
                  <motion.div key={i} className="absolute rounded-full"
                    style={{
                      width: size, height: size, left: -size / 2, top: -size / 2,
                      border: i < 2 ? `1.5px solid rgba(0,166,80,${0.1 + i * 0.08})` : undefined,
                      background: i === 2 ? 'linear-gradient(135deg,#00A650,#007A3D)' : undefined,
                    }}
                    animate={{ scale: [1, 1.08 + i * 0.04, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-warm-lg"
                  style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)' }}>
                  <Shield size={26} className="text-white" />
                </div>
              </div>
              <div className="h-7 px-3 rounded-md inline-flex items-center justify-center text-white text-xs font-bold mb-4"
                style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)' }}>
                綠界科技 ECPay
              </div>
              <p className="font-serif text-warm-text text-xl font-semibold mb-2">
                正在安全跳轉至綠界支付系統…
              </p>
              <p className="text-warm-text-muted text-sm leading-relaxed mb-6">
                請勿關閉視窗，我們正在建立加密連線
              </p>
              {/* Progress bar */}
              <div className="w-full max-w-xs h-1.5 bg-warm-cream-dark rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00A650, #5ece8a)' }}
                  initial={{ width: '10%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-warm-text-light text-xs mt-3">SSL 256-bit 加密保護中</p>
            </motion.div>
          )}

          {/* ── Step 3: ecpay – 模擬付款頁 ── */}
          {step === 'ecpay' && (
            <motion.div key="ecpay"
              className="bg-white rounded-3xl shadow-warm-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              {/* ECPay header bar */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-warm-cream-dark/30"
                style={{ background: 'linear-gradient(90deg,#00A650,#007A3D)' }}>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-white opacity-90" />
                  <span className="text-white text-sm font-bold tracking-wide">綠界科技 ECPay</span>
                </div>
                <span className="text-white/70 text-xs">🔒 安全付款</span>
              </div>

              <div className="px-6 py-5">
                {/* Order summary */}
                <div className="bg-warm-cream rounded-2xl p-4 mb-5 border border-warm-cream-dark/40">
                  <p className="text-xs text-warm-text-muted mb-0.5">訂單摘要</p>
                  <p className="font-serif text-warm-text font-semibold text-sm leading-snug mb-2">
                    {ECPAY_PARAMS.ItemName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-warm-text-muted text-xs">交易序號 {tradeNo}</span>
                    <div className="text-right">
                      <span className="text-warm-text-light text-xs line-through block">NT$980</span>
                      <span className="font-serif text-2xl font-bold text-warm-text">NT${ECPAY_PARAMS.TotalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Payment method tabs */}
                <p className="text-xs text-warm-text-muted mb-3 font-medium">選擇付款方式</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: '信用卡', active: true },
                    { label: 'ATM 轉帳', active: false },
                    { label: '超商代碼', active: false },
                  ].map((tab, i) => (
                    <div key={i}
                      className="py-2.5 rounded-xl text-center text-xs font-medium border transition-all cursor-default"
                      style={tab.active
                        ? { background: 'rgba(0,166,80,0.1)', borderColor: '#00A650', color: '#007A3D' }
                        : { borderColor: '#EDE0D5', color: '#A89D9A', backgroundColor: '#faf8f5' }}>
                      {tab.label}
                    </div>
                  ))}
                </div>

                {/* Simulated card input (display only) */}
                <div className="space-y-3 mb-5">
                  <div className="w-full px-4 py-3 rounded-xl border border-warm-cream-dark bg-warm-cream/60 text-sm text-warm-text-light">
                    **** **** **** ****
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-4 py-3 rounded-xl border border-warm-cream-dark bg-warm-cream/60 text-sm text-warm-text-light">MM/YY</div>
                    <div className="px-4 py-3 rounded-xl border border-warm-cream-dark bg-warm-cream/60 text-sm text-warm-text-light">CVV</div>
                  </div>
                </div>

                {/* Pay button */}
                <motion.button
                  className="w-full py-4 rounded-2xl text-white font-bold text-base mb-3"
                  style={{ background: 'linear-gradient(135deg,#00A650,#007A3D)' }}
                  onClick={handleSimPay}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}>
                  確認付款 NT${ECPAY_PARAMS.TotalAmount}
                </motion.button>

                <p className="text-center text-warm-text-light text-xs">
                  ⚠️ 這是模擬測試環境，不會產生實際交易
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: success ── */}
          {step === 'success' && (
            <motion.div key="success"
              className="bg-white rounded-3xl shadow-warm-xl py-16 px-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-18 h-18 rounded-2xl flex items-center justify-center mb-5 shadow-warm-lg"
                style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#5F7161,#4A5A4C)' }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 280 }}>
                <BadgeCheck size={32} className="text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="font-serif text-warm-text text-2xl font-semibold mb-2">付款成功！</p>
                <p className="text-warm-text-muted text-sm mb-1">交易序號：{tradeNo}</p>
                <p className="text-warm-text-muted text-sm mb-4">你的靈魂處方箋正在解鎖，請稍候…</p>
                {email && (
                  <motion.div
                    className="flex items-start gap-2 rounded-2xl px-4 py-3 text-left max-w-xs mx-auto"
                    style={{ backgroundColor: '#5F716112', border: '1px solid #5F716128' }}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                    <Mail size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#5F7161' }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#5A6A5C' }}>
                      診斷報告已同步寄送至<br />
                      <strong className="font-medium">{email}</strong><br />
                      如未收到，請檢查垃圾郵件匣或聯繫團隊。
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── LEGAL PAGES ─────────────────────────────────────────────────────────────

function LegalPage({ title, onBack, children }) {
  return (
    <motion.div className="min-h-screen px-5 py-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35 }}>
      {/* Back nav */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-warm-text-muted text-sm hover:text-warm-text transition-colors mb-8">
        <ChevronLeft size={16} /> 返回 KindlesMind
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium mb-4"
          style={{ backgroundColor: '#D48C7018', color: '#D48C70', border: '1px solid #D48C7030' }}>
          <Leaf size={11} />
          KindlesMind 法律文件
        </div>
        <h1 className="font-serif text-3xl text-warm-text font-bold mb-2">{title}</h1>
        <p className="text-warm-text-muted text-sm">最後更新：2025 年 1 月 1 日</p>
      </div>

      {/* Content */}
      <div className="space-y-7 pb-16">
        {children}
      </div>
    </motion.div>
  )
}

function LegalSection({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm-sm p-6">
      <h2 className="font-serif text-warm-text font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-warm-terracotta flex-shrink-0" />
        {title}
      </h2>
      <div className="text-warm-text-muted text-sm leading-loose space-y-2">
        {children}
      </div>
    </div>
  )
}

function PrivacyPage({ onBack }) {
  return (
    <LegalPage title="隱私權政策" onBack={onBack}>
      <LegalSection title="我們重視你的隱私">
        <p>KindlesMind（以下稱「本服務」）深刻理解，你在完成這份測驗時所揭露的，是你內心最私密的情感狀態。因此，我們對隱私保護的承諾，不只是法律義務，更是我們對每一位使用者的道德責任。</p>
        <p>本政策說明我們如何收集、使用及保護你的個人資料。</p>
      </LegalSection>

      <LegalSection title="我們收集哪些資料">
        <p><strong className="text-warm-text">測驗回答資料：</strong>你在 KindlesMind 測驗中所選擇的答案，僅於你的瀏覽器本地端進行計算，用以生成你的個人化診斷結果。<strong className="text-warm-text">我們不會將你的答案傳輸至伺服器、不會儲存、也不會與任何第三方分享。</strong></p>
        <p><strong className="text-warm-text">付款資料：</strong>若你選擇購買完整報告，付款程序將由綠界科技（ECPay）全程處理。KindlesMind 不會接觸、儲存或傳輸你的信用卡號碼、有效期限或 CVV 安全碼。所有金融資料均由綠界科技依其隱私政策處理。</p>
        <p><strong className="text-warm-text">技術日誌：</strong>我們可能收集匿名的技術資訊（如瀏覽器類型、造訪時間），用於系統穩定性分析。此類資料不含任何可識別個人身分的資訊。</p>
      </LegalSection>

      <LegalSection title="資料的匿名化處理">
        <p>KindlesMind 的核心設計原則是「最小資料收集」。你的測驗回答<strong className="text-warm-text">從不離開你的裝置</strong>——所有分析邏輯均在你的瀏覽器中本地執行，結果計算完成後不會上傳至任何伺服器。</p>
        <p>這意味著即使是我們的開發團隊，也無法得知你回答了什麼、得到了哪種診斷結果。你的情感私密，由你自己完全掌控。</p>
      </LegalSection>

      <LegalSection title="第三方服務">
        <p>本服務目前使用以下第三方服務：</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong className="text-warm-text">綠界科技 ECPay</strong>：提供安全的線上金流處理服務</li>
          <li><strong className="text-warm-text">Google Fonts</strong>：提供字型資源（Noto Serif TC、Noto Sans TC）</li>
        </ul>
        <p>上述第三方服務各有其獨立的隱私政策，我們建議你自行查閱。</p>
      </LegalSection>

      <LegalSection title="Cookie 政策">
        <p>KindlesMind 目前不使用追蹤性 Cookie。我們僅使用瀏覽器本地儲存（localStorage）暫存你的測驗進度，以防止意外中斷造成資料遺失。此資料不會被傳輸至任何伺服器，你可以隨時透過清除瀏覽器資料將其刪除。</p>
      </LegalSection>

    </LegalPage>
  )
}

function TermsPage({ onBack }) {
  return (
    <LegalPage title="服務條款" onBack={onBack}>
      <LegalSection title="服務性質說明">
        <p>KindlesMind 提供基於心理學研究的線上關係溫度診斷服務。本測驗由 KindlesMind 心理師團隊研發，旨在協助使用者更深入了解自身的依附模式與情感狀態。</p>
        <p><strong className="text-warm-text">重要聲明：</strong>KindlesMind 提供的所有診斷結果、分析報告及建議內容，均僅供個人參考，<strong className="text-warm-text">不構成任何形式的醫療診斷、心理治療或專業臨床服務。</strong>若你有嚴重的心理健康需求，請尋求具執照的心理師或精神科醫師的協助。</p>
      </LegalSection>

      <LegalSection title="數位商品與付款">
        <p>KindlesMind 完整診斷報告屬於<strong className="text-warm-text">數位內容服務</strong>，購買後將即時提供全文閱覽。</p>
        <p><strong className="text-warm-text">關於退款政策：</strong>依據《消費者保護法》第 19 條第 1 項但書規定，提供非以有形媒介提供之數位內容，且經消費者事先同意始提供者，不適用七日猶豫期之規定。</p>
        <p>購買前，你將有機會預覽報告的目錄架構與部分免費內容，以充分評估是否適合你的需求。我們鼓勵你在充分考慮後再行購買。</p>
        <p>若因系統錯誤導致付款成功但無法存取報告內容，請於 7 個工作天內聯繫我們，我們將提供技術支援或全額退款。</p>
      </LegalSection>

      <LegalSection title="智慧財產權">
        <p>KindlesMind 平台上的所有內容，包括但不限於測驗題目、診斷架構、分析文字、靈魂原型描述、療癒處方箋等，均為 KindlesMind 之原創作品，受著作權法保護。</p>
        <p>你購買的完整報告授權你個人閱覽使用，<strong className="text-warm-text">未經書面授權，不得轉載、重製、販售或以任何形式散布。</strong></p>
      </LegalSection>

      <LegalSection title="使用規範">
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>請誠實、真實地回答測驗問題，以獲得最準確的診斷結果</li>
          <li>禁止將本平台用於任何非法、侵害他人權益或騷擾他人的目的</li>
          <li>禁止以自動化程式（bot）大量存取本服務</li>
          <li>KindlesMind 保留在不另行通知的情況下修改服務內容的權利</li>
        </ul>
      </LegalSection>

      <LegalSection title="免責聲明">
        <p>本服務依「現狀」提供，KindlesMind 不對任何因使用本服務而產生的間接損失負責。測驗結果基於統計學模型，不代表對個人情況的絕對判斷。人心複雜，任何心理測驗都無法完全涵蓋你的全部。</p>
      </LegalSection>

    </LegalPage>
  )
}

function AboutPage({ onBack }) {
  return (
    <LegalPage title="關於我們" onBack={onBack}>
      {/* Brand card */}
      <div className="bg-white rounded-3xl border border-warm-cream-dark/40 shadow-warm-lg p-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-terracotta"
          style={{ background: 'linear-gradient(135deg, #D48C70, #B8704F)' }}>
          <Flame size={28} className="text-white" />
        </div>
        <h2 className="font-serif text-2xl text-warm-text font-bold mb-1">KindlesMind</h2>
        <p className="text-warm-text-muted text-sm tracking-widest uppercase mb-4">Relationship Temperature Diagnosis</p>
        <p className="text-warm-text-muted text-sm leading-relaxed max-w-sm mx-auto">
          KindlesMind 相信，每一份不安的背後，都藏著一個渴望被好好理解的靈魂。我們用心理學的語言，為你的情感狀態點一盞燈。
        </p>
      </div>

      <LegalSection title="我們是誰">
        <p>KindlesMind 由一群對心理學與科技充滿熱情的創作者所建立，致力於讓心理健康的資源更普及、更溫暖、更易於取用。</p>
        <p>我們的測驗框架以依附理論（Attachment Theory）、認知行為治療（CBT）及情緒聚焦治療（EFT）為理論基礎。</p>
      </LegalSection>

      <LegalSection title="我們的使命">
        <p>在這個時代，有太多人在關係中感到孤獨和不被理解，卻沒有機會或資源去尋求專業協助。KindlesMind 希望成為那座橋——</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>讓你能夠以一個安全、匿名的方式，誠實面對自己的情感狀態</li>
          <li>提供有科學根據、有溫度的個人化洞察</li>
          <li>引導有需要的人，找到合適的後續支持資源</li>
        </ul>
      </LegalSection>

      <LegalSection title="版本資訊">
        <p className="text-warm-text-light text-xs">
          KindlesMind v2.0<br />
          © 2026 KindlesMind. All Rights Reserved.
        </p>
      </LegalSection>
    </LegalPage>
  )
}

// ─── LEGAL MODAL ─────────────────────────────────────────────────────────────

function LegalModal({ modalKey, onClose }) {
  const MODAL_CONTENT = {
    terms: {
      title: '服務條款',
      sections: [
        {
          title: '服務性質說明',
          body: 'KindlesMind 提供基於心理學研究的線上關係溫度診斷服務，旨在協助使用者了解自身的依附模式。診斷結果僅供個人參考，不構成任何形式的醫療診斷或臨床建議。',
        },
        {
          title: '數位商品與付款',
          body: null,
          items: [
            'KindlesMind 完整診斷報告屬於數位內容服務，購買後將即時提供全文閱覽。',
            '⚠️ 依據《消費者保護法》第 19 條第 1 項但書規定，非以有形媒介提供之數位內容，且經消費者事先同意始提供者，不適用七日猶豫期（7 天鑑賞期）之規定。',
            '若因系統錯誤導致付款成功但無法存取報告，請於 7 個工作天內來信 support@kindlesmind.com，我們將提供技術支援或全額退款。',
          ],
        },
        {
          title: '智慧財產權',
          body: '平台上所有測驗題目、診斷架構、分析文字均為 KindlesMind 原創作品，受著作權法保護。購買後授權個人閱覽，未經書面授權不得轉載或商業使用。',
        },
      ],
    },
    privacy: {
      title: '隱私政策',
      sections: [
        {
          title: '資料收集',
          body: '我們收集的資料僅包含：測驗回答（匿名處理）、您自願提供的 Email（用於寄送報告），以及基本的頁面瀏覽記錄（透過 Google Analytics）。',
        },
        {
          title: '資料使用目的',
          body: '您的 Email 地址僅用於寄送診斷報告，不會用於行銷或轉售給任何第三方。',
        },
        {
          title: '付款資料保護',
          body: '付款程序由綠界科技（ECPay）全程處理。KindlesMind 不會接觸、儲存或傳輸您的信用卡資訊。',
        },
        {
          title: 'Cookie 政策',
          body: '我們不使用追蹤性 Cookie。僅使用 localStorage 暫存測驗進度，此資料不會傳輸至任何伺服器，您可隨時清除。',
        },
      ],
    },
    disclaimer: {
      title: '免責聲明',
      sections: [
        {
          title: '非醫療聲明',
          body: 'KindlesMind 所提供的所有診斷結果、分析報告及建議內容，均僅供個人參考，不構成任何形式的醫療診斷、心理治療或專業臨床服務建議。本測驗不能取代具執照的心理師或精神科醫師的專業評估。',
        },
        {
          title: '若您需要專業協助',
          body: '若您有嚴重的心理健康困擾，請尋求具執照的心理師或精神科醫師協助。台灣心理健康諮詢專線：1925（安心專線，24 小時免費）。',
        },
        {
          title: '結果準確性',
          body: '測驗結果基於統計學模型與自我報告，可能因當下情緒狀態或填答方式而有所差異。KindlesMind 不對因使用本服務而產生的任何間接損失負責。',
        },
      ],
    },
  }

  const content = MODAL_CONTENT[modalKey]
  if (!content) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(67,66,66,0.48)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        className="w-full max-w-lg overflow-hidden"
        style={{ backgroundColor: '#FDF8F5', borderRadius: '28px 28px 0 0', maxHeight: '82vh' }}
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: '#D4C5BC' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4">
          <h3 className="font-serif text-warm-text text-xl font-semibold">{content.title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#EDE0D560', color: '#9A8E8B' }}>
            <X size={16} />
          </button>
        </div>
        <div className="mx-6 h-px" style={{ backgroundColor: '#EDE0D5' }} />

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(82vh - 88px)' }}>
          {content.sections.map((sec, i) => (
            <div key={i}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#D48C70' }}>{sec.title}</p>
              {sec.body && <p className="text-sm leading-relaxed text-warm-text-muted">{sec.body}</p>}
              {sec.items && (
                <ul className="space-y-2">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm leading-relaxed text-warm-text-muted">
                      <span className="flex-shrink-0 w-1 h-1 rounded-full mt-2" style={{ backgroundColor: '#D48C70' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {/* Bottom padding for safe area */}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer({ onNav, onModal }) {
  return (
    <footer className="border-t border-warm-cream-dark/40 mt-8 py-7 px-5">
      <div className="max-w-lg mx-auto">

        {/* Brand */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#D48C70,#B8704F)' }}>
            <Flame size={10} className="text-white" />
          </div>
          <span className="font-serif text-sm font-semibold text-warm-text">KindlesMind</span>
        </div>

        {/* Legal links — modal */}
        <div className="flex items-center justify-center gap-5 mb-4">
          {[
            { label: '服務條款',  key: 'terms'      },
            { label: '隱私政策',  key: 'privacy'    },
            { label: '免責聲明',  key: 'disclaimer' },
          ].map(({ label, key }) => (
            <button key={key}
              onClick={() => onModal(key)}
              className="text-warm-text-muted text-xs hover:text-warm-terracotta transition-colors">
              {label}
            </button>
          ))}
        </div>

        {/* Contact */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Mail size={11} style={{ color: '#C4B8B4' }} />
          <a href="mailto:support@kindlesmind.com"
            className="text-xs hover:text-warm-terracotta transition-colors"
            style={{ color: '#C4B8B4' }}>
            support@kindlesmind.com
          </a>
        </div>

        {/* Copyright */}
        <p className="text-center text-warm-text-light text-xs">
          © 2026 KindlesMind. All Rights Reserved.
        </p>

      </div>
    </footer>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase]             = useState('hero')
  const [results, setResults]         = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [isUnlocked, setIsUnlocked]   = useState(false)
  const [userEmail, setUserEmail]     = useState('')
  const [legalPage, setLegalPage]     = useState(null)  // null | 'privacy' | 'terms' | 'about'
  const [legalModal, setLegalModal]   = useState(null)  // null | 'terms' | 'privacy' | 'disclaimer'

  const handleQuizComplete = (answers) => {
    setPhase('calculating')
    const r = calcResults(answers)
    setTimeout(() => { setResults(r); setPhase('result') }, 3600)
  }

  const handleUnlock = (email) => { setUserEmail(email); setShowPayment(true) }
  const handlePaySuccess = () => { setIsUnlocked(true); setShowPayment(false) }
  const handleRetake = () => {
    setPhase('hero')
    setResults(null)
    setIsUnlocked(false)
    setUserEmail('')
    window.scrollTo(0, 0)
  }
  const handleNavLegal = (page) => { setLegalPage(page); window.scrollTo(0, 0) }
  const handleBackFromLegal = () => setLegalPage(null)

  const legalComponents = {
    privacy: PrivacyPage,
    terms:   TermsPage,
    about:   AboutPage,
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: '#FDF8F5' }}>
      {/* Global ambient gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 15% 85%, rgba(212,140,112,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 15%, rgba(95,113,97,0.05) 0%, transparent 50%)'
      }} />

      <div className="relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Legal pages ── */}
          {legalPage && (() => {
            const PageComp = legalComponents[legalPage]
            return (
              <motion.div key={`legal-${legalPage}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PageComp onBack={handleBackFromLegal} />
                <Footer onNav={handleNavLegal} onModal={setLegalModal} />
              </motion.div>
            )
          })()}

          {/* ── Main app flow ── */}
          {!legalPage && phase === 'hero' && (
            <motion.div key="hero" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
              <HeroScreen onStart={() => setPhase('quiz')} />
              <Footer onNav={handleNavLegal} onModal={setLegalModal} />
            </motion.div>
          )}

          {!legalPage && phase === 'quiz' && (
            <motion.div key="quiz"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
              <QuizScreen onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {!legalPage && phase === 'calculating' && (
            <motion.div key="calculating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <CalculatingScreen />
            </motion.div>
          )}

          {!legalPage && phase === 'result' && results && (
            <motion.div key="result"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <ResultScreen
                results={results}
                onUnlock={handleUnlock}
                isUnlocked={isUnlocked}
                userEmail={userEmail}
                onModal={setLegalModal}
                onRetake={handleRetake}
              />
              <Footer onNav={handleNavLegal} onModal={setLegalModal} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showPayment && (
          <EcpayModal onClose={() => setShowPayment(false)} onSuccess={handlePaySuccess} email={userEmail} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {legalModal && (
          <LegalModal key={legalModal} modalKey={legalModal} onClose={() => setLegalModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
