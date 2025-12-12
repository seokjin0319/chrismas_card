/* =========================================================
   Holiday Card - Full script
   - 모달 X/입력 안 되던 문제 해결 포함
   - 스티커 추가/드래그/휠 크기/우클릭 삭제/휴지통 버튼
   - 공유 링크: URL hash + localStorage (단일 브라우저 저장)
   ========================================================= */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------- 사운드(없어도 에러 안 나게) ---------- */
let SOUND_ON = true;

function safePlay(audioId) {
  if (!SOUND_ON) return;
  const el = document.getElementById(audioId);
  if (!el) return;
  try {
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch (_) {}
}

/* ---------- DOM ---------- */
const cardArea = $("#card-area");
const letterContent = $("#letter-content");
const toInput = $("#to-input");
const fromInput = $("#from-input");

const saveBtn = $("#save-button");
const openViewerBtn = $("#open-viewer");

const searchInput = $("#item-search");
const itemButtons = $$("#item-grid .item");

const btnReset = $("#btn-reset");
const btnShake = $("#btn-shake");
const btnJingle = $("#btn-jingle");
const btnSound = $("#btn-sound");

/* ---------- Viewer Modal ---------- */
const viewerModal = $("#viewer-modal");
const closeBtn = $(".close-button");
const viewerCardArea = $("#viewer-card-area");
const viewerLetter = $("#viewer-letter-content");

/* ✅ 모달 열기/닫기 */
function openModal() {
  viewerModal.classList.remove("hidden");
  viewerModal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  viewerModal.classList.add("hidden");
  viewerModal.setAttribute("aria-hidden", "true");
}

/* ✅ X 클릭 */
closeBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeModal();
});

/* ✅ 바깥 클릭하면 닫기 */
viewerModal?.addEventListener("click", (e) => {
  if (e.target === viewerModal) closeModal();
});

/* ✅ ESC 닫기 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ---------- 스티커 생성 ---------- */
function createSticker(emoji) {
  const el = document.createElement("div");
  el.className = "sticker";
  el.textContent = emoji;

  el.style.left = "50%";
  el.style.top = "52%";
  el.dataset.scale = "1";

  // 삭제 버튼(휴지통)
  const trash = document.createElement("button");
  trash.className = "trash";
  trash.type = "button";
  trash.textContent = "🗑️";
  trash.addEventListener("click", (e) => {
    e.stopPropagation();
    el.remove();
  });
  el.appendChild(trash);

  // 드래그(마우스/터치 공용)
  let dragging = false;
  let startX = 0, startY = 0;
  let baseLeft = 0, baseTop = 0;

  const beginDrag = (clientX, clientY) => {
    dragging = true;
    const parentRect = cardArea.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    startX = clientX;
    startY = clientY;

    // 현재 위치(px) 계산 (left/top이 %/px 섞일 수 있어 rect 기반으로 변환)
    baseLeft = rect.left - parentRect.left + rect.width / 2;
    baseTop  = rect.top - parentRect.top + rect.height / 2;

    el.style.cursor = "grabbing";
  };

  const doDrag = (clientX, clientY) => {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    el.style.left = `${baseLeft + dx}px`;
    el.style.top  = `${baseTop + dy}px`;
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = "grab";
  };

  // 마우스
  el.addEventListener("mousedown", (e) => {
    // 휴지통 클릭이면 드래그 시작 안 함
    if (e.target?.classList?.contains("trash")) return;
    e.preventDefault();
    beginDrag(e.clientX, e.clientY);
  });

  window.addEventListener("mousemove", (e) => doDrag(e.clientX, e.clientY));
  window.addEventListener("mouseup", endDrag);

  // 터치
  el.addEventListener("touchstart", (e) => {
    if (e.target?.classList?.contains("trash")) return;
    const t = e.touches[0];
    beginDrag(t.clientX, t.clientY);
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    doDrag(t.clientX, t.clientY);
  }, { passive: true });

  el.addEventListener("touchend", endDrag, { passive: true });

  // 휠로 크기 조절
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    const cur = parseFloat(el.dataset.scale || "1");
    const next = Math.min(3.0, Math.max(0.4, cur + (e.deltaY < 0 ? 0.10 : -0.10)));
    el.dataset.scale = String(next);
    el.style.transform = `translate(-50%,-50%) scale(${next})`;
  }, { passive: false });

  // 우클릭 삭제
  el.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    el.remove();
  });

  return el;
}

/* ---------- 스티커 추가 ---------- */
function addSticker(emoji) {
  if (!cardArea) return;
  const st = createSticker(emoji);
  cardArea.appendChild(st);
  safePlay("drop-sound");
}

/* 트레이 클릭 */
itemButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const emoji = btn.childNodes[0]?.textContent?.trim() || btn.textContent.trim();
    if (!emoji) return;
    addSticker(emoji);
  });
});

/* 검색 */
searchInput?.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  itemButtons.forEach((btn) => {
    const label = (btn.dataset.label || "").toLowerCase();
    const emoji = btn.textContent.toLowerCase();
    const ok = !q || label.includes(q) || emoji.includes(q);
    btn.style.display = ok ? "" : "none";
  });
});

/* ---------- Shake 효과 ---------- */
btnShake?.addEventListener("click", () => {
  cardArea.classList.remove("shake");
  void cardArea.offsetWidth; // reflow
  cardArea.classList.add("shake");
  setTimeout(() => cardArea.classList.remove("shake"), 500);
});

/* shake 애니메이션 CSS를 JS에서 추가(파일 간 충돌 방지) */
(function injectShakeCSS(){
  const css = `
  @keyframes cardShake {
    0% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
    100% { transform: translateX(0); }
  }
  #card-area.shake { animation: cardShake 0.5s ease; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

/* ---------- Reset ---------- */
btnReset?.addEventListener("click", () => {
  // 카드 스티커 싹 지우기
  const keep = $("#default-items-container");
  cardArea.innerHTML = "";
  if (keep) cardArea.appendChild(keep);
  // 조명 다시 넣기 (index에 있었으면 남아있지만 혹시 제거될 수 있어 복원)
  const lights = document.createElement("div");
  lights.className = "string-lights";
  lights.setAttribute("aria-hidden", "true");
  cardArea.appendChild(lights);

  // 텍스트 리셋
  letterContent.value = "";
  toInput.value = "";
  fromInput.value = "";
});

/* ---------- Sound 토글 ---------- */
btnSound?.addEventListener("click", () => {
  SOUND_ON = !SOUND_ON;
  btnSound.textContent = SOUND_ON ? "Sound: On" : "Sound: Off";
  btnSound.setAttribute("aria-pressed", SOUND_ON ? "true" : "false");
});

/* ---------- Jingle ---------- */
btnJingle?.addEventListener("click", () => {
  safePlay("jingle-sound");
});

/* ---------- 저장/공유 (localStorage + hash) ---------- */
function genId() {
  return "card_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function serializeCard() {
  return {
    cardHTML: cardArea.innerHTML,
    letter: letterContent.value || "",
    to: toInput.value || "",
    from: fromInput.value || "",
    createdAt: Date.now()
  };
}

function loadToViewer(data) {
  viewerCardArea.innerHTML = data.cardHTML || "";
  // viewer에서는 편지 텍스트를 예쁘게 조합
  const header = [];
  if (data.to) header.push(`To: ${data.to}`);
  if (data.from) header.push(`From: ${data.from}`);
  viewerLetter.textContent = (header.length ? header.join("   ") + "\n\n" : "") + (data.letter || "");
  openModal();
}

saveBtn?.addEventListener("click", async () => {
  const data = serializeCard();
  const id = genId();
  localStorage.setItem(id, JSON.stringify(data));

  // 링크 생성
  const url = new URL(location.href);
  url.hash = id;

  safePlay("save-sound");

  // 클립보드 복사
  try {
    await navigator.clipboard.writeText(url.toString());
    alert("공유 링크가 만들어졌어요! (클립보드에 복사됨)\n\n" + url.toString());
  } catch (_) {
    alert("공유 링크가 만들어졌어요!\n\n" + url.toString());
  }
});

/* 저장된 카드 보기 버튼 */
openViewerBtn?.addEventListener("click", () => {
  const id = (location.hash || "").replace("#", "").trim();
  if (!id) {
    alert("저장된 카드 해시(#...)가 없어요.\n공유 링크로 접속하거나, 공유 링크를 만든 뒤 다시 눌러봐!");
    return;
  }
  const raw = localStorage.getItem(id);
  if (!raw) {
    alert("이 브라우저에 저장된 카드가 없어요.\n(현재 버전은 localStorage 저장이라 다른 기기/친구가 저장한 건 안 보일 수 있어요)");
    return;
  }
  loadToViewer(JSON.parse(raw));
});

/* 해시로 들어오면 자동으로 열기 */
window.addEventListener("load", () => {
  const id = (location.hash || "").replace("#", "").trim();
  if (!id) return;
  try {
    const raw = localStorage.getItem(id);
    if (!raw) return;
    loadToViewer(JSON.parse(raw));
  } catch (_) {}
});
