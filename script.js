// Prompt Generator for Stable Diffusion (photo) & Sora (video)
// Шаблонная генерация на основе ввода + параметров

// ======================== UTILS ========================
const currentPrompt = { text: '' };

function buildSDPrompt(baseIdea, style, ratio, negative) {
    // Преобразуем соотношение в описание для SD
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
    
    let negativePart = negative.trim() ? `, negative: ${negative}` : '';
    // Добавим стандартные плохие вещи если negative пустой
    if (!negative.trim()) {
        negativePart = ', negative: blurry, low quality, ugly, deformed, watermark, text';
    }
    
    const prompt = `${baseIdea}, ${styleText}, ${ratioDesc}, masterpiece, best quality, 8k, sharp focus${negativePart}`;
    return prompt;
}

function buildSoraPrompt(baseIdea, ratio, motion, negative) {
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
    
    const prompt = `[Sora Video] ${baseIdea}. ${motionDesc}. Aspect ratio: ${ratioDesc}. ${negativePart} High quality 4K video, smooth motion, consistent physics, realistic lighting.`;
    return prompt;
}

// Массивы для случайных промтов дня (фото и видео)
const randomPhotoPrompts = [
    "enchanted forest with glowing mushrooms and a mystical stag, photorealistic, 8K, cinematic lighting, 16:9 ratio, negative: blurry, noise, ugly",
    "cyberpunk samurai standing on a neon rooftop, rain, reflections, anime style, dramatic shadows, 4K",
    "astronaut riding a horse on Mars, dramatic sunset, dust storms, oil painting texture, masterpiece",
    "steampunk airship flying above Victorian London, fantasy art, detailed engines, golden hour",
    "underwater library with ancient books and bioluminescent jellyfish, dreamy, high detail, 9:16"
];

const randomVideoPrompts = [
    "[Sora Video] A lone wolf walking through a snowy forest at night, snowfall, slow cinematic pan, 16:9, avoid flicker, sharp motion.",
    "[Sora Video] Drone shot flying over a futuristic city with flying cars, hyperlapse, neon grid, 9:16 vertical.",
    "[Sora Video] Close-up of a cup of coffee, steam rising, smooth orbiting camera, 1:1, cozy lighting, ultra HD.",
    "[Sora Video] Person doing capoeira in a park, fast action, slow-motion finish, 16:9, natural motion, no glitches.",
    "[Sora Video] Old lighthouse in stormy sea, waves crashing, static camera with dynamic waves, cinematic 16:9."
];

// DOM элементы
const photoIdeaInput = document.getElementById('photo-idea');
const photoRatio = document.getElementById('photo-ratio');
const photoStyle = document.getElementById('photo-style');
const photoNegative = document.getElementById('photo-negative');
const generatePhotoBtn = document.getElementById('generate-photo');
const randomPhotoBtn = document.getElementById('random-photo');

const videoIdeaInput = document.getElementById('video-idea');
const videoRatio = document.getElementById('video-ratio');
const videoMotion = document.getElementById('video-motion');
const videoNegative = document.getElementById('video-negative');
const generateVideoBtn = document.getElementById('generate-video');
const randomVideoBtn = document.getElementById('random-video');

const promptOutput = document.getElementById('prompt-output');
const copyBtn = document.getElementById('copy-btn');
const exportBtn = document.getElementById('export-btn');

// Табы
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
let activeTab = 'photo'; // 'photo' or 'video'

// ========== TAB LOGIC ==========
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (tabId === 'photo') activeTab = 'photo';
        else activeTab = 'video';
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// ========== GENERATORS ==========
function generatePhotoPrompt() {
    let idea = photoIdeaInput.value.trim();
    if (!idea) {
        idea = "абстрактная композиция с мягкими формами и цветами";
    }
    const ratio = photoRatio.value;
    const style = photoStyle.value;
    const negative = photoNegative.value;
    const prompt = buildSDPrompt(idea, style, ratio, negative);
    currentPrompt.text = prompt;
    promptOutput.innerText = prompt;
}

function generateVideoPrompt() {
    let idea = videoIdeaInput.value.trim();
    if (!idea) {
        idea = "живописный природный пейзаж, плавное движение камеры";
    }
    const ratio = videoRatio.value;
    const motion = videoMotion.value;
    const negative = videoNegative.value;
    const prompt = buildSoraPrompt(idea, ratio, motion, negative);
    currentPrompt.text = prompt;
    promptOutput.innerText = prompt;
}

function setRandomPhoto() {
    const randomIndex = Math.floor(Math.random() * randomPhotoPrompts.length);
    const randomPrompt = randomPhotoPrompts[randomIndex];
    currentPrompt.text = randomPrompt;
    promptOutput.innerText = randomPrompt;
    // можно также заполнить поля для наглядности? опционально
    photoIdeaInput.value = "случайная идея (см. промт)";
}

function setRandomVideo() {
    const randomIndex = Math.floor(Math.random() * randomVideoPrompts.length);
    const randomPrompt = randomVideoPrompts[randomIndex];
    currentPrompt.text = randomPrompt;
    promptOutput.innerText = randomPrompt;
    videoIdeaInput.value = "случайная идея дня";
}

generatePhotoBtn.addEventListener('click', () => {
    generatePhotoPrompt();
});
generateVideoBtn.addEventListener('click', () => {
    generateVideoPrompt();
});
randomPhotoBtn.addEventListener('click', setRandomPhoto);
randomVideoBtn.addEventListener('click', setRandomVideo);

// ========== КОПИРОВАНИЕ ==========
copyBtn.addEventListener('click', async () => {
    const textToCopy = currentPrompt.text;
    if (!textToCopy || textToCopy === 'Здесь появится ваш промт...') {
        promptOutput.innerText = '❌ Нет промта для копирования. Сначала сгенерируйте или выберите случайный.';
        setTimeout(() => {
            if (currentPrompt.text && currentPrompt.text !== '') promptOutput.innerText = currentPrompt.text;
            else promptOutput.innerText = 'Здесь появится ваш промт...';
        }, 1500);
        return;
    }
    try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = promptOutput.innerText;
        promptOutput.innerText = '✅ Промт скопирован в буфер!';
        setTimeout(() => {
            promptOutput.innerText = originalText;
        }, 1200);
    } catch (err) {
        promptOutput.innerText = '⚠️ Ошибка копирования';
        console.error(err);
    }
});

// ========== ЭКСПОРТ TXT ==========
exportBtn.addEventListener('click', () => {
    let content = currentPrompt.text;
    if (!content || content === 'Здесь появится ваш промт...') {
        content = 'Нет сгенерированного промта. Используйте генерацию или случайный промт дня.';
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    link.href = url;
    link.download = `prompt_${activeTab}_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// инициализация демо-примера при загрузке (ничего не генерируем, оставляем пустое)
promptOutput.innerText = '✨ Сгенерируйте промт, выбрав идею и параметры.';
currentPrompt.text = '';
