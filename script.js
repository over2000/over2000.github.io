const field = document.querySelector('.heart-field');
const totalHearts = 50;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const hearts = [];
const gravity = { x: 0, y: 0 };
const bounds = { width: window.innerWidth, height: window.innerHeight };
let orientationReady = false;
let previousTime = performance.now();
let neutralOrientation;

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
    if (!neutralOrientation) {
        neutralOrientation = { beta, gamma };
        return;
    }

    const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0);
    let horizontal = gamma - neutralOrientation.gamma;
    let vertical = beta - neutralOrientation.beta;

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

    gravity.x = clamp(horizontal / 35, -1, 1) * 0.52;
    gravity.y = clamp(vertical / 35, -1, 1) * 0.52;
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
        radius: size / 2,
        x: Math.random() * Math.max(1, bounds.width - size),
        y: Math.random() * Math.max(1, bounds.height - size),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        rotation: (index / totalHearts) * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.7,
    });
}

function resolveHeartCollisions() {
    for (let firstIndex = 0; firstIndex < hearts.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < hearts.length; secondIndex += 1) {
            const first = hearts[firstIndex];
            const second = hearts[secondIndex];
            const deltaX = second.x - first.x;
            const deltaY = second.y - first.y;
            const distance = Math.hypot(deltaX, deltaY);
            const minimumDistance = first.radius + second.radius;

            if (distance >= minimumDistance) continue;

            const safeDistance = distance || 0.001;
            const normalX = deltaX / safeDistance;
            const normalY = deltaY / safeDistance;
            const overlap = (minimumDistance - safeDistance) / 2;
            first.x -= normalX * overlap;
            first.y -= normalY * overlap;
            second.x += normalX * overlap;
            second.y += normalY * overlap;

            const relativeVelocity = (second.vx - first.vx) * normalX + (second.vy - first.vy) * normalY;
            if (relativeVelocity > 0) continue;

            const impulse = -relativeVelocity * 0.82;
            first.vx -= impulse * normalX;
            first.vy -= impulse * normalY;
            second.vx += impulse * normalX;
            second.vy += impulse * normalY;
        }
    }
}

function moveHearts(currentTime) {
    const delta = Math.min(2, (currentTime - previousTime) / 16.67);
    previousTime = currentTime;

    hearts.forEach((heart) => {
        heart.vx += gravity.x * delta;
        heart.vy += gravity.y * delta;
        heart.vx *= Math.pow(0.965, delta);
        heart.vy *= Math.pow(0.965, delta);

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
    });

    resolveHeartCollisions();
    hearts.forEach((heart) => {
        heart.rotation += (Math.hypot(heart.vx, heart.vy) * 2 + heart.rotationSpeed) * delta;
        heart.element.style.transform = `translate3d(${heart.x}px, ${heart.y}px, 0) rotate(${heart.rotation}deg)`;
    });

    requestAnimationFrame(moveHearts);
}

for (let index = 0; index < totalHearts; index += 1) createHeart(index);

window.addEventListener('resize', updateBounds, { passive: true });
window.addEventListener('orientationchange', () => {
    neutralOrientation = null;
    gravity.x = 0;
    gravity.y = 0;
    updateBounds();
}, { passive: true });

if (isTouchDevice) {
    document.addEventListener('pointerdown', requestMotionPermission, { once: true });
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
        listenToOrientation();
    }
}

requestAnimationFrame(moveHearts);
