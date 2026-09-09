const field = document.querySelector('.heart-field');
const totalHearts = 50;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const hearts = [];
const gravity = { x: 0, y: isTouchDevice ? 0.16 : 0.12 };
const bounds = { width: window.innerWidth, height: window.innerHeight };
let orientationReady = false;
let previousTime = performance.now();

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function updateBounds() {
    bounds.width = window.innerWidth;
    bounds.height = window.innerHeight;
}

function updateGravity(event) {
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0);
    let horizontal = gamma;
    let vertical = beta - 45;

    if (angle === 90) {
        horizontal = vertical;
        vertical = -gamma;
    } else if (angle === 180) {
        horizontal = -gamma;
        vertical = -vertical;
    } else if (angle === 270 || angle === -90) {
        horizontal = -vertical;
        vertical = gamma;
    }

    gravity.x = clamp(horizontal / 45, -1, 1) * 0.42;
    gravity.y = clamp(vertical / 45, -1, 1) * 0.32 + 0.12;
}

function listenToOrientation() {
    if (orientationReady) return;
    orientationReady = true;
    window.addEventListener('deviceorientation', updateGravity, true);
    window.addEventListener('deviceorientationabsolute', updateGravity, true);
}

function requestMotionPermission() {
    if (typeof DeviceOrientationEvent === 'undefined') return;
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
        listenToOrientation();
        return;
    }

    DeviceOrientationEvent.requestPermission()
        .then((permission) => {
            if (permission === 'granted') listenToOrientation();
        })
        .catch(() => {});
}

function createHeart(index) {
    const element = document.createElement('span');
    const size = 24;
    element.className = 'heart';
    element.textContent = '❤️';
    field.appendChild(element);

    hearts.push({
        element,
        size,
        x: Math.random() * Math.max(1, bounds.width - size),
        y: Math.random() * Math.max(1, bounds.height - size),
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        rotation: (index / totalHearts) * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.7,
    });
}

function moveHearts(currentTime) {
    const delta = Math.min(2, (currentTime - previousTime) / 16.67);
    previousTime = currentTime;

    hearts.forEach((heart) => {
        const edgePadding = 36;
        heart.vx += gravity.x * delta;
        heart.vy += gravity.y * delta;
        heart.vx *= Math.pow(0.992, delta);
        heart.vy *= Math.pow(0.992, delta);

        if (heart.x < edgePadding) heart.vx += 0.018 * delta;
        if (heart.x > bounds.width - heart.size - edgePadding) heart.vx -= 0.018 * delta;
        if (heart.y < edgePadding) heart.vy += 0.018 * delta;
        if (heart.y > bounds.height - heart.size - edgePadding) heart.vy -= 0.018 * delta;

        heart.x += heart.vx * delta;
        heart.y += heart.vy * delta;

        if (heart.x <= 0 || heart.x >= bounds.width - heart.size) {
            heart.x = clamp(heart.x, 0, bounds.width - heart.size);
            heart.vx *= -0.78;
        }
        if (heart.y <= 0 || heart.y >= bounds.height - heart.size) {
            heart.y = clamp(heart.y, 0, bounds.height - heart.size);
            heart.vy *= -0.78;
        }

        heart.rotation += heart.rotationSpeed * delta;
        heart.element.style.transform = `translate3d(${heart.x}px, ${heart.y}px, 0) rotate(${heart.rotation}deg)`;
    });

    requestAnimationFrame(moveHearts);
}

for (let index = 0; index < totalHearts; index += 1) createHeart(index);

window.addEventListener('resize', updateBounds, { passive: true });
window.addEventListener('orientationchange', updateBounds, { passive: true });

if (isTouchDevice) {
    document.addEventListener('pointerdown', requestMotionPermission, { once: true });
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
        listenToOrientation();
    }
}

requestAnimationFrame(moveHearts);
