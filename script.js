// Prompt Forge — генератор промтов SD + избранное (только просмотр и сохранение)
let currentPromptText = "";

// DOM элементы генератора
const photoIdea = document.getElementById('photo-idea');
const photoRatio = document.getElementById('photo-ratio');
const photoStyle = document.getElementById('photo-style');
const photoNegative = document.getElementById('photo-negative');
const generateBtn = document.getElementById('generate-photo');
const randomBtn = document.getElementById('random-photo');

// Результат и действия
const promptOutputDiv = document.getElementById('prompt-output');
const copyBtn = document.getElementById('copy-btn');
const exportBtn = document.getElementById('export-btn');
const saveFavBtn = document.getElementById('save-fav-btn');
const externalLinksDiv = document.getElementById('external-links');

// Избранное
const favouritesListDiv = document.getElementById('favourites-list');
const clearAllFavsBtn = document.getElementById('clear-all-favs');

// Табы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// ---------- ГЕНЕРАЦИЯ ПРОМТА ----------
function buildSDPrompt(baseIdea, style, ratio, negative) {
    let ratioDesc = '';
    switch(ratio) {
        case '1:1': ratioDesc = 'square composition, 1:1 aspect ratio'; break;
        case '16:9': ratioDesc = 'cinematic widescreen, 16:9'; break;
        case '9:16': ratioDesc = 'vertical portrait, 9:16, social media format'; break;
        case '4:3': ratioDesc = 'classic 4:3 frame'; break;
        default: ratioDesc = 'standard frame';
    }
    const styleMap = {
        'photorealistic': 'photorealistic, detailed texture, natural lighting, high resolution, 8K',
        'anime': 'anime style, cell shaded, vibrant colors, crisp lines, manga aesthetic',
        'cyberpunk': 'cyberpunk aesthetic, neon lights, rain, reflections, futuristic city, high-tech',
        'fantasy': 'fantasy art, magical atmosphere, ethereal lighting, detailed fantasy world',
        'oil painting': 'oil painting, thick brushstrokes, classical art style, painterly texture',
        'cinematic': 'cinematic lighting, dramatic shadows, film grain, shallow depth of field'
    };
    const styleText = styleMap[style] || styleMap.photorealistic;
    let negativePart = negative.trim() ? `, negative: ${negative}` : ', negative: blurry, low quality, ugly, deformed, watermark, text';
    return `${baseIdea}, ${styleText}, ${ratioDesc}, masterpiece, best quality, 8k, sharp focus${negativePart}`;
}

const randomPrompts = [
    "enchanted forest with glowing mushrooms and a mystical stag, photorealistic, 8K, cinematic lighting, 16:9, negative: blurry",
    "cyberpunk samurai standing on a neon rooftop, rain, anime style, 4K, dramatic shadows",
    "astronaut riding a horse on Mars, dramatic sunset, oil painting, masterpiece",
    "steampunk airship above Victorian London, fantasy art, detailed engines, golden hour",
    "underwater library with bioluminescent jellyfish, dreamy, 9:16, high detail"
];

function generatePrompt() {
    let idea = photoIdea.value.trim() || "abstract composition with soft shapes and colors";
    const ratio = photoRatio.value;
    const style = photoStyle.value;
    const negative = photoNegative.value;
    const prompt = buildSDPrompt(idea, style, ratio, negative);
    currentPromptText = prompt;
    promptOutputDiv.innerText = prompt;
    updateExternalLinks();
    syncStarIcon();
}

function setRandomPrompt() {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    const randomPrompt = randomPrompts[randomIndex];
    currentPromptText = randomPrompt;
    promptOutputDiv.innerText = randomPrompt;
    updateExternalLinks();
    photoIdea.value = "✨ случайная идея (вдохновение)";
    syncStarIcon();
}

// ---------- ВНЕШНИЕ ССЫЛКИ (Duck.ai и Google Gemini) ----------
function updateExternalLinks() {
    if (!externalLinksDiv) return;
    if (!currentPromptText || currentPromptText === 'Здесь появится ваш промт...') {
        externalLinksDiv.innerHTML = '';
        return;
    }
    externalLinksDiv.innerHTML = `
        <a href="https://duck.ai/" target="_blank" class="external-link-btn" title="Открыть Duck.ai и вставить промт">🦆 Duck.ai</a>
        <a href="https://gemini.google.com/" target="_blank" class="external-link-btn" title="Открыть Google Gemini и вставить промт">✨ Google Gemini</a>
        <span class="external-link-btn" style="background: none; border-color: #6c5ce7;">💡 Скопируйте промт и вставьте в сервис</span>
    `;
}

// ---------- ИЗБРАННОЕ (localStorage) ----------
let favourites = [];

function loadFavourites() {
    const stored = localStorage.getItem('prompt_forge_favs');
    if (stored) {
        try {
            favourites = JSON.parse(stored);
        } catch(e) { favourites = []; }
    } else {
        favourites = [];
    }
    renderFavourites();
}

function saveFavouritesToStorage() {
    localStorage.setItem('prompt_forge_favs', JSON.stringify(favourites));
    renderFavourites();
}

function addCurrentToFavourites() {
    if (!currentPromptText || currentPromptText === 'Здесь появится ваш промт...') {
        promptOutputDiv.innerText = "❌ Нет промта для сохранения. Сначала сгенерируйте.";
        setTimeout(() => { if(currentPromptText) promptOutputDiv.innerText = currentPromptText; }, 1500);
        return;
    }
    const exists = favourites.some(fav => fav.text === currentPromptText);
    if (exists) {
        promptOutputDiv.innerText = "⚠️ Этот промт уже в избранном!";
        setTimeout(() => promptOutputDiv.innerText = currentPromptText, 1200);
        return;
    }
    const newFav = {
        id: Date.now(),
        text: currentPromptText,
        date: new Date().toLocaleString()
    };
    favourites.unshift(newFav);
    saveFavouritesToStorage();
    syncStarIcon();
    promptOutputDiv.innerText = "✅ Сохранено в избранное!";
    setTimeout(() => promptOutputDiv.innerText = currentPromptText, 1200);
}

function deleteFav(id) {
    favourites = favourites.filter(f => f.id !== id);
    saveFavouritesToStorage();
    syncStarIcon();
}

function useFav(fav) {
    // Использовать избранный промт — подставить в текущий вывод
    currentPromptText = fav.text;
    promptOutputDiv.innerText = fav.text;
    updateExternalLinks();
    syncStarIcon();
    // Переключиться на вкладку генератора, чтобы показать результат
    switchTab('generator');
}

function clearAllFavourites() {
    if (confirm('Удалить все избранные промты?')) {
        favourites = [];
        saveFavouritesToStorage();
        syncStarIcon();
    }
}

function renderFavourites() {
    if (!favouritesListDiv) return;
    if (favourites.length === 0) {
        favouritesListDiv.innerHTML = '<div class="empty-fav">⭐ Нет избранных промтов. Нажмите ☆ на сгенерированном промте.</div>';
        return;
    }
    let html = '';
    favourites.forEach(fav => {
        html += `
            <div class="fav-item" data-id="${fav.id}">
                <div class="fav-header">
                    <span class="fav-type">📸 Stable Diffusion</span>
                    <span class="fav-date">${escapeHtml(fav.date)}</span>
                </div>
                <div class="fav-text">${escapeHtml(fav.text.substring(0, 280))}${fav.text.length > 280 ? '…' : ''}</div>
                <div class="fav-actions">
                    <button class="fav-use-btn" data-id="${fav.id}" data-action="use">Использовать</button>
                    <button class="fav-delete-btn" data-id="${fav.id}" data-action="delete">🗑 Удалить</button>
                </div>
            </div>
        `;
    });
    favouritesListDiv.innerHTML = html;
    document.querySelectorAll('.fav-use-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            const fav = favourites.find(f => f.id === id);
            if (fav) useFav(fav);
        });
    });
    document.querySelectorAll('.fav-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            deleteFav(id);
        });
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function syncStarIcon() {
    if (!currentPromptText || currentPromptText === 'Здесь появится ваш промт...') {
        saveFavBtn.innerHTML = '☆';
        saveFavBtn.classList.remove('active-star');
        return;
    }
    const exists = favourites.some(f => f.text === currentPromptText);
    if (exists) {
        saveFavBtn.innerHTML = '★';
        saveFavBtn.classList.add('active-star');
    } else {
        saveFavBtn.innerHTML = '☆';
        saveFavBtn.classList.remove('active-star');
    }
}

// ---------- ТАБЫ ----------
function switchTab(tabId) {
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    tabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) content.classList.add('active');
        else content.classList.remove('active');
    });
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
    });
});

// ---------- КОПИРОВАНИЕ / ЭКСПОРТ ----------
copyBtn.addEventListener('click', async () => {
    if (!currentPromptText || currentPromptText === 'Здесь появится ваш промт...') {
        promptOutputDiv.innerText = '❌ Нет промта для копирования.';
        setTimeout(() => promptOutputDiv.innerText = currentPromptText || 'Здесь появится ваш промт...', 1500);
        return;
    }
    try {
        await navigator.clipboard.writeText(currentPromptText);
        const original = promptOutputDiv.innerText;
        promptOutputDiv.innerText = '✅ Скопировано!';
        setTimeout(() => promptOutputDiv.innerText = original, 1200);
    } catch(err) {
        promptOutputDiv.innerText = '⚠️ Ошибка копирования';
    }
});

exportBtn.addEventListener('click', () => {
    let content = currentPromptText || 'Нет промта.';
    const blob = new Blob([content], {type: 'text/plain'});
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    link.href = url;
    link.download = `prompt_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

saveFavBtn.addEventListener('click', addCurrentToFavourites);
clearAllFavsBtn.addEventListener('click', clearAllFavourites);

generateBtn.addEventListener('click', generatePrompt);
randomBtn.addEventListener('click', setRandomPrompt);

// Инициализация
loadFavourites();
currentPromptText = "✨ Сгенерируйте промт, выбрав идею и параметры.";
promptOutputDiv.innerText = currentPromptText;
updateExternalLinks();
syncStarIcon();
