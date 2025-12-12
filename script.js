// --- 사운드 요소 가져오기 ---
const dropSound = document.getElementById('drop-sound');
const snowSound = document.getElementById('snow-sound');
const saveSound = document.getElementById('save-sound');

// --- 크리스마스 애니메이션: 눈 내리는 효과 ---
const snowContainer = document.getElementById('snow-container');

function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowContainer.appendChild(snowflake);

    const size = Math.random() * 5 + 5; // 5px ~ 10px
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${Math.random() * 100}%`;
    snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5s ~ 10s
    snowflake.style.animationDelay = `-${Math.random() * 5}s`; // 딜레이를 주어 자연스럽게 시작
    snowflake.style.opacity = Math.random() * 0.5 + 0.3; // 0.3 ~ 0.8
}

// 50개의 눈송이 생성
for (let i = 0; i < 50; i++) {
    createSnowflake();
}

// 눈 내리는 소리 재생 (사용자 상호작용 후)
let isSnowSoundPlayed = false;
document.addEventListener('click', () => {
    if (!isSnowSoundPlayed) {
        snowSound.volume = 0.3; // 볼륨 조절
        snowSound.play().catch(e => console.log("Snow sound autoplay blocked:", e));
        isSnowSoundPlayed = true;
    }
}, { once: true });


// --- 카드 에디터 기능 ---
const cardArea = document.getElementById('card-area');
const itemPalette = document.getElementById('item-palette');
const letterContent = document.getElementById('letter-content');
const saveButton = document.getElementById('save-button');
const defaultItemsContainer = document.getElementById('default-items-container');

let draggedItem = null;
let currentDraggingElement = null; // 드래그 중인 실제 요소 (복사본)

// --- 기본 아이템 배치 ---
const defaultItems = [
    { type: 'tree', x: 50, y: 150 },
    { type: 'gift', x: 400, y: 250 },
    { type: 'star', x: 250, y: 30 },
    { type: 'snowman', x: 100, y: 200 }
];

function placeDefaultItems() {
    defaultItems.forEach(itemData => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('draggable-item');
        itemElement.innerHTML = getItemEmoji(itemData.type);
        itemElement.style.left = `${itemData.x}px`;
        itemElement.style.top = `${itemData.y}px`;
        itemElement.dataset.itemType = itemData.type; // 타입 저장
        itemElement.dataset.isDefault = 'true'; // 기본 아이템 표시
        defaultItemsContainer.appendChild(itemElement);
    });
}

function getItemEmoji(type) {
    switch (type) {
        case 'santa': return '🎅';
        case 'tree': return '🌲';
        case 'gift': return '🎁';
        case 'snowman': return '⛄';
        case 'bell': return '🔔';
        case 'star': return '⭐';
        case 'cookie': return '🍪';
        case 'candy': return '🍬';
        default: return '❓';
    }
}

// --- 드래그 앤 드롭 이벤트 ---

// 팔레트 아이템 드래그 시작
itemPalette.addEventListener('dragstart', (e) => {
    draggedItem = e.target;
    if (!draggedItem.classList.contains('item')) {
        draggedItem = null; // 아이템만 드래그 가능
        return;
    }
    // 드래그 중인 아이템의 타입을 데이터로 저장
    e.dataTransfer.setData('text/plain', draggedItem.dataset.itemType);
    e.dataTransfer.effectAllowed = 'copy';

    // 드래그 중인 원본 아이템은 숨김
    setTimeout(() => draggedItem.style.opacity = '0', 0);
});

itemPalette.addEventListener('dragend', () => {
    if (draggedItem) {
        draggedItem.style.opacity = '1'; // 드래그 끝나면 다시 보이게
        draggedItem = null;
    }
});


// 카드 영역으로 드래그 오버 (드롭 가능하게)
cardArea.addEventListener('dragover', (e) => {
    e.preventDefault(); // 기본 동작 방지 (드롭 가능하게 함)
    e.dataTransfer.dropEffect = 'copy';
});

// 카드 영역에 드롭
cardArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const itemType = e.dataTransfer.getData('text/plain');
    if (!itemType) return;

    dropSound.volume = 0.5;
    dropSound.play(); // 사운드 재생

    const newItem = document.createElement('div');
    newItem.classList.add('draggable-item');
    newItem.innerHTML = getItemEmoji(itemType);
    newItem.dataset.itemType = itemType; // 아이템 타입 저장

    // 드롭된 위치 계산 (카드 영역 기준)
    const cardRect = cardArea.getBoundingClientRect();
    let x = e.clientX - cardRect.left - newItem.offsetWidth / 2;
    let y = e.clientY - cardRect.top - newItem.offsetHeight / 2;

    // 카드 영역을 벗어나지 않도록 보정
    x = Math.max(0, Math.min(x, cardRect.width - newItem.offsetWidth));
    y = Math.max(0, Math.min(y, cardRect.height - newItem.offsetHeight));

    newItem.style.left = `${x}px`;
    newItem.style.top = `${y}px`;

    cardArea.appendChild(newItem);
    makeItemDraggable(newItem); // 드롭된 아이템도 드래그 가능하게
});


// 카드 영역 내에서 아이템 드래그
function makeItemDraggable(item) {
    let isDragging = false;
    let offsetX, offsetY;

    item.addEventListener('mousedown', (e) => {
        if (e.target.dataset.isDefault === 'true') { // 기본 아이템은 드래그 불가
            return;
        }
        isDragging = true;
        currentDraggingElement = e.target;
        offsetX = e.clientX - item.getBoundingClientRect().left;
        offsetY = e.clientY - item.getBoundingClientRect().top;
        item.style.cursor = 'grabbing';
        item.style.zIndex = '100'; // 드래그 중인 아이템을 맨 앞으로
    });

    cardArea.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentDraggingElement) return;

        const cardRect = cardArea.getBoundingClientRect();
        let x = e.clientX - cardRect.left - offsetX;
        let y = e.clientY - cardRect.top - offsetY;

        // 카드 영역을 벗어나지 않도록 보정
        x = Math.max(0, Math.min(x, cardRect.width - currentDraggingElement.offsetWidth));
        y = Math.max(0, Math.min(y, cardRect.height - currentDraggingElement.offsetHeight));

        currentDraggingElement.style.left = `${x}px`;
        currentDraggingElement.style.top = `${y}px`;
    });

    cardArea.addEventListener('mouseup', () => {
        isDragging = false;
        if (currentDraggingElement) {
            currentDraggingElement.style.cursor = 'grab';
            currentDraggingElement.style.zIndex = '10'; // 드래그 끝나면 원래 z-index로
            currentDraggingElement = null;
        }
    });

    // 아이템 더블클릭 시 삭제
    item.addEventListener('dblclick', (e) => {
        if (e.target.dataset.isDefault !== 'true' && confirm('이 아이템을 삭제하시겠어요?')) {
            e.target.remove();
        }
    });
}


// --- 편지 저장 및 공유 기능 ---

saveButton.addEventListener('click', () => {
    saveSound.volume = 0.5;
    saveSound.play();

    const letter = letterContent.value;
    const items = [];
    document.querySelectorAll('#card-area .draggable-item').forEach(item => {
        // 기본 아이템도 저장에 포함
        items.push({
            type: item.dataset.itemType,
            x: item.offsetLeft,
            y: item.offsetTop
        });
    });
    
    // 데이터 인코딩 (URL에 안전하게 포함하기 위해)
    const data = { letter, items };
    const encodedData = btoa(encodeURIComponent(JSON.stringify(data))); // Base64 인코딩

    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;

    displayShareLink(shareUrl);
});

function displayShareLink(url) {
    let shareLinkContainer = document.getElementById('share-link-container');
    if (!shareLinkContainer) {
        shareLinkContainer = document.createElement('div');
        shareLinkContainer.id = 'share-link-container';
        shareLinkContainer.innerHTML = `
            <p>친구에게 이 링크를 공유해주세요!</p>
            <input type="text" id="share-link-input" value="${url}" readonly>
            <button id="copy-link-button">🔗 링크 복사</button>
        `;
        document.getElementById('card-editor').appendChild(shareLinkContainer);

        document.getElementById('copy-link-button').addEventListener('click', () => {
            const shareLinkInput = document.getElementById('share-link-input');
            shareLinkInput.select();
            document.execCommand('copy');
            alert('링크가 복사되었습니다!');
        });
    } else {
        document.getElementById('share-link-input').value = url;
    }
}


// --- 뷰어 모드 (공유 링크로 접근했을 때) ---

const viewerModal = document.getElementById('viewer-modal');
const viewerCardArea = document.getElementById('viewer-card-area');
const viewerLetterContent = document.getElementById('viewer-letter-content');
const closeButton = document.querySelector('#viewer-modal .close-button');

function initViewerMode() {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');

    if (encodedData) {
        // 에디터 숨기기
        document.getElementById('app-container').classList.add('hidden');
        viewerModal.classList.remove('hidden'); // 뷰어 모달 보여주기

        try {
            const decodedData = JSON.parse(decodeURIComponent(atob(encodedData))); // Base64 디코딩
            
            viewerLetterContent.innerText = decodedData.letter;
            
            decodedData.items.forEach(itemData => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('draggable-item');
                itemElement.innerHTML = getItemEmoji(itemData.type);
                itemElement.style.left = `${itemData.x}px`;
                itemElement.style.top = `${itemData.y}px`;
                viewerCardArea.appendChild(itemElement);
            });

        } catch (e) {
            console.error("Failed to decode or parse shared data:", e);
            alert("잘못된 공유 링크이거나 손상된 편지입니다.");
            viewerModal.classList.add('hidden'); // 에러 시 모달 숨김
            document.getElementById('app-container').classList.remove('hidden'); // 에디터 다시 보여줌
        }
    } else {
        // 일반 에디터 모드
        document.getElementById('app-container').classList.remove('hidden');
        viewerModal.classList.add('hidden');
        placeDefaultItems(); // 기본 아이템 배치
    }
}

closeButton.addEventListener('click', () => {
    viewerModal.classList.add('hidden');
    // 모달 닫으면 다시 에디터 모드로 돌아갈 수 있도록
    // URL에서 ?data= 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);
    document.getElementById('app-container').classList.remove('hidden');
    // 뷰어의 내용 비우기 (새로운 편지를 볼 수도 있으므로)
    viewerCardArea.innerHTML = '';
    viewerLetterContent.innerText = '';
    
    // 에디터의 편지 내용 및 아이템도 초기화 (선택 사항)
    letterContent.value = '';
    cardArea.innerHTML = '';
    placeDefaultItems();
    
    // 공유 링크 컨테이너도 숨김
    const shareLinkContainer = document.getElementById('share-link-container');
    if (shareLinkContainer) {
        shareLinkContainer.remove();
    }
});


// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    initViewerMode();
});