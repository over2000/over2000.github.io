const field = document.querySelector('.heart-field');
const input = document.querySelector('#heart-input');
const count = document.querySelector('#character-count');
const hearts = [];
const isMobile = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
const particleTotal = isMobile ? 18 : 24;
const maxParticleTotal = isMobile ? 42 : 72;
const motion = { x: 0, y: 0 };
let respawnTimer;

function splitCharacters(value) {
    if (window.Intl && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return [...segmenter.segment(value)].map(({ segment }) => segment);
    }
    return [...value];
}

function scatterHearts() {
    const centerX = (window.innerWidth - 28) / 2;
    const centerY = (window.innerHeight - 28) / 2;

    hearts.forEach((heart) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2.5;
        heart.x = centerX + (Math.random() - .5) * 8;
        heart.y = centerY + (Math.random() - .5) * 8;
        heart.vx = Math.cos(angle) * speed;
        heart.vy = Math.sin(angle) * speed;
    });
}

function edgePosition() {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) return { x: Math.random() * window.innerWidth, y: -28 };
    if (edge === 1) return { x: window.innerWidth, y: Math.random() * window.innerHeight };
    if (edge === 2) return { x: Math.random() * window.innerWidth, y: window.innerHeight };
    return { x: -28, y: Math.random() * window.innerHeight };
}

function addParticle(character, spawnFromEdges = true) {
    const element = document.createElement('span');
    element.className = 'heart';
    element.textContent = character;
    field.appendChild(element);
    const position = spawnFromEdges
        ? edgePosition()
        : { x: (window.innerWidth - 28) / 2, y: (window.innerHeight - 28) / 2 };
    const heart = {
        element,
        x: position.x,
        y: position.y,
        vx: 0,
        vy: 0,
        rotation: Math.random() * 360,
    };
    hearts.push(heart);

    if (spawnFromEdges) {
        const angle = Math.atan2(window.innerHeight / 2 - heart.y, window.innerWidth / 2 - heart.x);
        const speed = 1.1 + Math.random() * 1.5;
        heart.vx = Math.cos(angle) * speed;
        heart.vy = Math.sin(angle) * speed;
        element.style.opacity = '0';
        requestAnimationFrame(() => { element.style.opacity = '1'; });
    }
}

function renderCharacters(characters, spawnFromEdges = false) {
    field.replaceChildren();
    hearts.length = 0;

    const particleCharacters = Array.from(
        { length: Math.max(particleTotal, characters.length) },
        (_, index) => characters[index % characters.length],
    );

    particleCharacters.forEach((character) => addParticle(character, spawnFromEdges));
}

function updateLabel(shouldScatter = false) {
    const value = input.value || '❤️';
    const characters = splitCharacters(value);
    input.value = value;
    count.textContent = `${characters.length}/13`;
    if (!shouldScatter) {
        renderCharacters(characters);
        return;
    }

    clearTimeout(respawnTimer);
    field.classList.add('is-fading');
    respawnTimer = setTimeout(() => {
        renderCharacters(characters, true);
        field.classList.remove('is-fading');
    }, 450);
}

input.addEventListener('input', () => updateLabel(true));
updateLabel();

setInterval(() => {
    if (hearts.length >= maxParticleTotal) return;
    const characters = splitCharacters(input.value || '❤️');
    addParticle(characters[hearts.length % characters.length]);
}, 850);

function moveDesktop() {
    hearts.forEach((heart) => {
        heart.x += heart.vx;
        heart.y += heart.vy;

        if (heart.x <= 0 || heart.x >= window.innerWidth - 28) {
            heart.x = Math.max(0, Math.min(heart.x, window.innerWidth - 28));
            heart.vx *= -.82;
        }
        if (heart.y <= 0 || heart.y >= window.innerHeight - 28) {
            heart.y = Math.max(0, Math.min(heart.y, window.innerHeight - 28));
            heart.vy *= -.82;
        }

        heart.element.style.transform = `translate3d(${heart.x}px, ${heart.y}px, 0) rotate(${heart.rotation}deg)`;
        heart.rotation += .15;
    });
    requestAnimationFrame(moveDesktop);
}

function moveMobile() {
    hearts.forEach((heart) => {
        heart.vx += motion.x * .018;
        heart.vy += motion.y * .018;
        heart.vx *= .985;
        heart.vy *= .985;
        heart.x += heart.vx;
        heart.y += heart.vy;

        if (heart.x < -28) heart.x = window.innerWidth;
        if (heart.x > window.innerWidth) heart.x = -28;
        if (heart.y < -28) heart.y = window.innerHeight;
        if (heart.y > window.innerHeight) heart.y = -28;

        heart.element.style.transform = `translate3d(${heart.x}px, ${heart.y}px, 0) rotate(${heart.rotation}deg)`;
        heart.rotation += .25;
    });
    requestAnimationFrame(moveMobile);
}

if (isMobile) {
    window.addEventListener('deviceorientation', (event) => {
        motion.x = Math.max(-30, Math.min(30, event.gamma || 0));
        motion.y = Math.max(-30, Math.min(30, event.beta || 0)) - 45;
    });
    moveMobile();
} else {
    moveDesktop();
}