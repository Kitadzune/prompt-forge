// Prompt Forge Pro — избранное (localStorage) + расширенные настройки видео
// Состояние
let currentPromptText = "";
let currentPromptType = "photo"; // photo or video
let currentStarActive = false;

// DOM элементы
const photoIdea = document.getElementById('photo-idea');
const photoRatio = document.getElementById('photo-ratio');
const photoStyle = document.getElementById('photo-style');
const photoNegative = document.getElementById('photo-negative');
const generatePhotoBtn = document.getElementById('generate-photo');
const randomPhotoBtn = document.getElementById('random-photo');

const videoIdea = document.getElementById('video-idea');
const videoRatio = document.getElementById('video-ratio');
const videoMotion = document.getElementById('video-motion');
const videoDuration = document.getElementById('video-duration');
const videoResolution = document.getElementById('video-resolution');
const videoNegative = document.getElementById('video-negative');
const generateVideoBtn = document.getElementById('generate-video');
const randomVideoBtn = document.getElementById('random-video');

const promptOutputDiv = document.getElementById('prompt-output');
const copyBtn = document.getElementById('copy-btn');
const exportBtn = document.getElementById('export-btn');
const saveFavBtn = document.getElementById('save-fav-btn');

const favouritesListDiv = document.getElementById('favourites-list');
const clearAllFavsBtn = document.getElementById('clear-all-favs');

// Табы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
let activeTab = 'photo';

// ---------- ФУНКЦИИ ГЕНЕРАЦИИ ----------
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

function buildSoraPrompt(baseIdea, ratio, motion, duration, resolution, negative) {
    let ratioDesc = '';
    switch(ratio) {
        case '16:9': ratioDesc = '16:9 widescreen cinematic'; break;
        case '9:16': ratioDesc = '9:16 vertical format for mobile'; break;
        case '1:1': ratioDesc = '1:1 square social format'; break;
        default: ratioDesc = '16:9';
    }
    let motionDesc = '';
    switch(motion) {
        case 'slow cinematic pan': motionDesc = 'slow cinematic pan, gentle camera movement, smooth tracking'; break;
        case 'smooth orbiting': motionDesc = 'orbital camera movement around subject, 360 rotation'; break;
        case 'fast action': motionDesc = 'dynamic fast motion, rapid cuts, energetic camera shake'; break;
        case 'static': motionDesc = 'static camera, main subject moves within frame'; break;
        case 'hyperlapse': motionDesc = 'time-lapse hyperlapse, accelerated time effect'; break;
        default: motionDesc = 'smooth camera motion';
    }
    let negativePart = negative.trim() ? `Avoid: ${negative}.` : 'Avoid flicker, morphing, distortion, bad anatomy, low fps.';
    let resPart = resolution === '4K' ? 'Ultra HD 4K' : (resolution === '1080p' ? 'Full HD 1080p' : 'HD 720p');
    return `[Sora Video] ${baseIdea}. ${motionDesc}. Duration: ${duration}. Resolution: ${resPart}. Aspect ratio: ${ratioDesc}. ${negativePart} High quality, smooth motion, consistent physics, realistic lighting.`;
}

// Случайные промты (фото)
const randomPhotoPrompts = [
    "enchanted forest with glowing mushrooms and a mystical stag, photorealistic, 8K, cinematic lighting, 16:9, negative: blurry",
    "cyberpunk samurai standing on a neon rooftop, rain, anime style, 4K, dramatic shadows",
    "astronaut riding a horse on Mars, dramatic sunset, oil painting, masterpiece",
    "steampunk airship above Victorian London, fantasy art, detailed engines, golden hour",
    "underwater library with bioluminescent jellyfish, dreamy, 9:16, high detail"
];
const randomVideoPrompts = [
    "A lone wolf walking through a snowy forest at night, snowfall, slow cinematic pan, 16:9, 10s, 4K",
    "Drone shot flying over a futuristic city with flying cars, hyperlapse, neon grid, 9:16, 20s, 1080p",
    "Close-up of a cup of coffee, steam rising, smooth orbiting camera, 1:1, 5s, 4K, cozy lighting",
    "Person doing capoeira in a park, fast action, slow-motion finish, 16:9, 10s, 1080p",
    "Old lighthouse in stormy sea, waves crashing, static camera with dynamic waves, cinematic 16:9, 20s, 4K"
];

function generatePhotoPrompt() {
    let idea = photoIdea.value.trim() || "abstract composition with soft shapes and colors";
    const ratio = photoRatio.value;
    const style = photoStyle.value;
    const negative = photoNegative.value;
    const prompt = buildSDPrompt(idea, style, ratio, negative);
    currentPromptText = prompt;
    currentPromptType = "photo";
    promptOutputDiv.innerText = prompt;
    updateStarIcon(false);
}

function generateVideoPrompt() {
    let idea = videoIdea.value.trim() || "cinematic nature landscape, smooth motion";
    const ratio = videoRatio.value;
    const motion = videoMotion.value;
    const duration = videoDuration.value;
    const resolution = videoResolution.value;
    const negative = videoNegative.value;
    const prompt = buildSoraPrompt(idea, ratio, motion, duration, resolution, negative);
    currentPromptText = prompt;
    currentPromptType = "video";
    promptOutputDiv.innerText = prompt;
    updateStarIcon(false);
}

function setRandomPhoto() {
    const randomIndex = Math.floor(Math.random() * randomPhotoPrompts.length);
    const randomPrompt = randomPhotoPrompts[randomIndex];
    currentPromptText = randomPrompt;
    currentPromptType = "photo";
    promptOutputDiv.innerText = randomPrompt;
    updateStarIcon(false);
    photoIdea.value = "✨ случайная идея (вдохновение)";
}

function setRandomVideo() {
    const randomIndex = Math.floor(Math.random() * randomVideoPrompts.length);
    const randomPrompt = randomVideoPrompts[randomIndex];
    currentPromptText = randomPrompt;
    currentPromptType = "video";
    promptOutputDiv.innerText = randomPrompt;
    updateStarIcon(false);
    videoIdea.value = "✨ случайный сценарий дня";
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
    // проверка дубликата (простая)
    const exists = favourites.some(fav => fav.text === currentPromptText);
    if (exists) {
        promptOutputDiv.innerText = "⚠️ Этот промт уже в избранном!";
        setTimeout(() => promptOutputDiv.innerText = currentPromptText, 1200);
        return;
    }
    const newFav = {
        id: Date.now(),
        type: currentPromptType,
        text: currentPromptText,
        date: new Date().toLocaleString()
    };
    favourites.unshift(newFav);
    saveFavouritesToStorage();
    updateStarIcon(true);
    promptOutputDiv.innerText = "✅ Сохранено в избранное!";
    setTimeout(() => promptOutputDiv.innerText = currentPromptText, 1200);
}

function deleteFav(id) {
    favourites = favourites.filter(f => f.id !== id);
    saveFavouritesToStorage();
}

function useFav(fav) {
    currentPromptText = fav.text;
    currentPromptType = fav.type;
    promptOutputDiv.innerText = fav.text;
    updateStarIcon(true); // уже в избранном
    // переключить таб на соответствующий (необязательно, но удобно)
    if (fav.type === 'photo' && activeTab !== 'photo') {
        switchTab('photo');
    } else if (fav.type === 'video' && activeTab !== 'video') {
        switchTab('video');
    }
}

function clearAllFavourites() {
    if (confirm('Удалить все избранные промты?')) {
        favourites = [];
        saveFavouritesToStorage();
    }
}

function renderFavourites() {
    if (!favouritesListDiv) return;
    if (favourites.length === 0) {
        favouritesListDiv.innerHTML = '<div class="empty-fav">⭐ Нет избранных промтов. Нажмите ☆ на любом сгенерированном промте.</div>';
        return;
    }
    let html = '';
    favourites.forEach(fav => {
        html += `
            <div class="fav-item" data-id="${fav.id}">
                <div class="fav-header">
                    <span class="fav-type">${fav.type === 'photo' ? '📸 Stable Diffusion' : '🎬 Sora Video'}</span>
                    <span class="fav-date">${fav.date}</span>
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
    // добавить обработчики
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

function updateStarIcon(isFavAlready) {
    if (isFavAlready) {
        saveFavBtn.innerHTML = '★';
        saveFavBtn.classList.add('active-star');
    } else {
        saveFavBtn.innerHTML = '☆';
        saveFavBtn.classList.remove('active-star');
    }
}

// функция проверки, есть ли уже текущий промт в избранном (при загрузке нового)
function syncStarWithCurrent() {
    if (!currentPromptText) return;
    const exists = favourites.some(f => f.text === currentPromptText);
    updateStarIcon(exists);
}

// ---------- ТАБЫ ----------
function switchTab(tabId) {
    activeTab = tabId;
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
    link.download = `prompt_${currentPromptType}_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

saveFavBtn.addEventListener('click', () => {
    addCurrentToFavourites();
});

clearAllFavsBtn.addEventListener('click', clearAllFavourites);

// привязка кнопок генерации
generatePhotoBtn.addEventListener('click', () => { generatePhotoPrompt(); syncStarWithCurrent(); });
randomPhotoBtn.addEventListener('click', () => { setRandomPhoto(); syncStarWithCurrent(); });
generateVideoBtn.addEventListener('click', () => { generateVideoPrompt(); syncStarWithCurrent(); });
randomVideoBtn.addEventListener('click', () => { setRandomVideo(); syncStarWithCurrent(); });

// Инициализация
loadFavourites();
// Установка начального примера
currentPromptText = "✨ Сгенерируйте промт, выбрав идею и параметры.";
currentPromptType = "photo";
promptOutputDiv.innerText = currentPromptText;
updateStarIcon(false);
