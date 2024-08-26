<template>
  <div class="bg-black" ref="pixiContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Application, Sprite, Texture, Container, Graphics, Point } from 'pixi.js';
import { AdvancedBloomFilter, CRTFilter, BulgePinchFilter } from 'pixi-filters';
import snappy from 'snappyjs';

// App classes
const app = new Application();
const container = new Container();
const containerGrid = new Container();

// Refs
const pixiContainer = ref(null);

// Constants
const PIXEL_SIZE = 10;
const GRID_WIDTH = 256;
const GRID_HEIGHT = 256;
const INITIAL_GRID_SCALE = 2;
const MAX_GRID_SCALE = 4;
const MIN_GRID_SCALE = 1;

// Game variables
let animationFrameId = null;
let zoomLevel = INITIAL_GRID_SCALE;
let targetPixelSize = INITIAL_GRID_SCALE;
let containerPosition = { x: 0, y: 0 }
let cellsPool = []
let bitArrayBuffer = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
let isDragging = false;
let altKeyPressed = false;
let lastPointerPosition = { x: 0, y: 0 };
let isMultiTouch = false;
let initialPinchDistance = 0;
let initialZoomLevel = 0;
let pointers = new Map();

const props = defineProps({
  scale: Number,
  gameRunning: Boolean,
});

const socket = new WebSocket(import.meta.env.VITE_WS_URL);
socket.binaryType = 'arraybuffer';
socket.onopen = () => console.log('Connected to server');
socket.onclose = () => console.log('Connection closed');
socket.onerror = (e) => console.error('WebSocket Error:', e);


const bg = new Sprite(Texture.WHITE);
bg.tint = 0x000000;
bg.alpha = 0;
bg.position.set(0, 0);
bg.width = GRID_WIDTH * PIXEL_SIZE
bg.height = GRID_HEIGHT * PIXEL_SIZE

const createCell = (x, y) => {
  const square = new Sprite(Texture.WHITE);
  square.width = PIXEL_SIZE - 2;
  square.height = PIXEL_SIZE - 2;
  square.tint = 0xffffff;
  square.visible = false;
  square.position.set(x * PIXEL_SIZE + 2, y * PIXEL_SIZE + 2);
  return square;
};

const cellIsInsideBoundingBox = (cell) => {
  const { width: screenWidth, height: screenHeight } = app.screen;
  const cellPosX = cell.x * zoomLevel + containerPosition.x;
  const cellPosY = cell.y * zoomLevel + containerPosition.y;
  return (cellPosX < screenWidth && cellPosY < screenHeight)
}

const renderCells = () => {
  for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
    const cell = cellsPool[i];
    const bit = bitArrayBuffer[i];
    cell.renderable = bit !== 0;
    if (cell.renderable) {
      cell.visible = cellIsInsideBoundingBox(cell);
    }
  }
};

const animateResize = () => {
  const prevZoomLevel = zoomLevel;
  zoomLevel = lerp(zoomLevel, targetPixelSize, 0.2);

  if (Math.abs(zoomLevel - targetPixelSize) > 0.01) {
    container.scale.set(zoomLevel, zoomLevel);
    
    // Adjust container position to zoom towards the center of the pinch
    const zoomCenter = isMultiTouch ? lastPointerPosition : { 
      x: app.screen.width / 2, 
      y: app.screen.height / 2 
    };
    
    const zoomFactor = zoomLevel / prevZoomLevel;
    containerPosition.x = zoomCenter.x - (zoomCenter.x - containerPosition.x) * zoomFactor;
    containerPosition.y = zoomCenter.y - (zoomCenter.y - containerPosition.y) * zoomFactor;

    updateContainerPosition(0, 0); // This will clamp the position within bounds
    animationFrameId = requestAnimationFrame(animateResize);
  } else {
    animationFrameId = null;
  }
};

const byteToBitArray = (byte) => {
  const bits = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((byte & (1 << i)) ? 1 : 0);
  }
  return bits;
};

const updateContainerPostZoom = (prevZoomLevel) => {
  const scaleDiff = zoomLevel - prevZoomLevel;
  containerPosition.x -= ((GRID_WIDTH * PIXEL_SIZE) * scaleDiff) / 2;
  containerPosition.y -= ((GRID_HEIGHT * PIXEL_SIZE) * scaleDiff) / 2;

  containerPosition.x = Math.max(
    Math.min(containerPosition.x, 0),
    app.screen.width - (GRID_WIDTH * PIXEL_SIZE * zoomLevel)
  );
  containerPosition.y = Math.max(
    Math.min(containerPosition.y, 0),
    app.screen.height - (GRID_HEIGHT * PIXEL_SIZE * zoomLevel)
  );

  container.position.set(containerPosition.x, containerPosition.y);
};

const updateContainerPosition = (deltaX, deltaY) => {
  containerPosition.x += deltaX;
  containerPosition.y += deltaY;

  containerPosition.x = Math.max(
    Math.min(containerPosition.x, 0),
    app.screen.width - (GRID_WIDTH * PIXEL_SIZE * zoomLevel)
  );
  containerPosition.y = Math.max(
    Math.min(containerPosition.y, 0),
    app.screen.height - (GRID_HEIGHT * PIXEL_SIZE * zoomLevel)
  );

  container.position.set(containerPosition.x, containerPosition.y);
};

const handleBlob = async (arrayBuffer) => {
  const byteArray = new Uint8Array(arrayBuffer);
  const bitArray = [];
  byteArray.forEach((byte) => {
    bitArray.push(...byteToBitArray(byte));
  });
  return bitArray;
}

const randomGrid = () => {
  socket.send('random');
};

const clearGrid = () => {
  socket.send('clear');
};

const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

// Lifecycle hooks
onMounted(async () => {
  await initializePixi();
  setupEventListeners();
});

onUnmounted(() => {
  cleanup();
});

// Initialization
const initializePixi = async () => {
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
    antialias: true,
    webgpu: true,
  });

  app.stage.filters = [
    new BulgePinchFilter({ radius: 1100, strength: 0.060, center: { x: 0.5, y: 0.5 } }),
    new CRTFilter({ curvature: 4, lineWidth: 1, vignetting: 0.3, noise: 0.3, time: 1, noiseSize: 0.3, vignettingAlpha: 0.5, seed: 0 }),
    new AdvancedBloomFilter({ threshold: 0.1, bloomScale: 1.7, brightness: 1.6, blur: 20, quality: 20 }),
  ];

  pixiContainer.value.appendChild(app.canvas);
  app.stage.addChild(container);
  container.scale.set(zoomLevel, zoomLevel);
  container.eventMode = 'static';

  setupGrid();
  createCellsPool();
  positionContainer();

  app.ticker.add(renderCells);
};

const setupGrid = () => {
  for (let i = 0; i <= GRID_WIDTH; i++) {
    const line = new Graphics().rect(i * PIXEL_SIZE, 0, 2, GRID_HEIGHT * PIXEL_SIZE).fill({ color: 0x414342 });
    containerGrid.addChild(line);
  }
  for (let i = 0; i <= GRID_HEIGHT; i++) {
    const line = new Graphics().rect(0, i * PIXEL_SIZE, GRID_WIDTH * PIXEL_SIZE, 2).fill({ color: 0x414342 });
    containerGrid.addChild(line);
  }
  container.addChildAt(containerGrid, 0);
  container.addChildAt(bg, 1);
};

const createCellsPool = () => {
  let x = 0
  let y = 0
  for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
    const cell = createCell(x, y);
    container.addChild(cell);
    cellsPool.push(cell)
    // Increment x, and reset x and increment y when hitting the width limit
    if (++x === GRID_WIDTH) {
      x = 0;
      y++;
    }
  }
};

const positionContainer = () => {
  containerPosition = {
    x: app.screen.width / 2 - ((GRID_WIDTH * PIXEL_SIZE) * zoomLevel) / 2,
    y: app.screen.height / 2 - ((GRID_HEIGHT * PIXEL_SIZE) * zoomLevel) / 2
  };
  container.position.set(containerPosition.x, containerPosition.y);
};

// Event listeners
const setupEventListeners = () => {
  socket.onmessage = async (e) => {
    try {
      const decompressedData = snappy.uncompress(e.data);
      bitArrayBuffer = await handleBlob(decompressedData);
    } catch (e) {
      console.error('Error decompressing data:', e);
    }
  };

  container.on('pointerdown', handlePointerDown);
  container.on('pointermove', handlePointerMove);
  container.on('pointerup', handlePointerUp);
  container.on('pointerupoutside', handlePointerUp);
  container.on('pointercancel', handlePointerUp);

  window.addEventListener('wheel', handleWheel);
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
};


const handlePointerDown = (e) => {
  pointers.set(e.pointerId, { x: e.global.x, y: e.global.y });

  if (pointers.size === 2) {
    isMultiTouch = true;
    const points = Array.from(pointers.values());
    lastPointerPosition = calculateCenter(points);
    initialPinchDistance = calculateDistance(points[0], points[1]);
    initialZoomLevel = zoomLevel;
  } else if (pointers.size === 1 && !altKeyPressed) {
    const { x, y } = calculateGridPosition(e.global);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        socket.send(JSON.stringify({ "x": x + i, "y": y + j }));
      }
    }
  }

  isDragging = true;
  lastPointerPosition = { x: e.global.x, y: e.global.y };
};

const handlePointerMove = (e) => {
  if (!isDragging) return;

  const currentPosition = { x: e.global.x, y: e.global.y };
  pointers.set(e.pointerId, currentPosition);

  if (isMultiTouch && pointers.size === 2) {
    const points = Array.from(pointers.values());
    const center = calculateCenter(points);
    const currentPinchDistance = calculateDistance(points[0], points[1]);

    // Handle zooming
    const zoomDelta = currentPinchDistance / initialPinchDistance;
    targetPixelSize = Math.max(MIN_GRID_SCALE, Math.min(MAX_GRID_SCALE, initialZoomLevel * zoomDelta));

    // Handle panning
    const deltaX = center.x - lastPointerPosition.x;
    const deltaY = center.y - lastPointerPosition.y;

    updateContainerPosition(deltaX, deltaY);
    lastPointerPosition = center;

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(animateResize);
    }
  } else if (pointers.size === 1 && altKeyPressed) {
    const deltaX = currentPosition.x - lastPointerPosition.x;
    const deltaY = currentPosition.y - lastPointerPosition.y;

    updateContainerPosition(deltaX, deltaY);
    lastPointerPosition = currentPosition;
  } else if (pointers.size === 1 && !altKeyPressed) {
    const { x, y } = calculateGridPosition(currentPosition);
    socket.send(JSON.stringify({ "x": x, "y": y }));
  }
};

const handlePointerUp = (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) {
    isMultiTouch = false;
    initialPinchDistance = 0;
    initialZoomLevel = zoomLevel;
  }
  if (pointers.size === 0) {
    isDragging = false;
  }
};

const calculateDistance = (point1, point2) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const calculateCenter = (points) => {
  const sum = points.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y
  }), { x: 0, y: 0 });

  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
};

const calculateGridPosition = (point) => {
  return {
    x: Math.floor((point.x - containerPosition.x) / (PIXEL_SIZE * zoomLevel)),
    y: Math.floor((point.y - containerPosition.y) / (PIXEL_SIZE * zoomLevel))
  };
};

const handleWheel = (e) => {
  targetPixelSize = Math.max(MIN_GRID_SCALE, Math.min(MAX_GRID_SCALE, zoomLevel + (e.deltaY < 0 ? 0.1 : -0.1)));
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(animateResize);
  }
};

const handleResize = () => {
  positionContainer();
};

const handleKeyDown = (e) => {
  console.log(e.key)
  if (e.key === 'r') randomGrid();
  else if (e.key === 'c') clearGrid();
  else if (e.key == 'Alt') altKeyPressed = true
};

const handleKeyUp = (e) => {
  if (e.key == 'Alt') {
    altKeyPressed = false
  }
}

// Cleanup
const cleanup = () => {
  app.destroy();
  window.removeEventListener('wheel', handleWheel);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('mousemove', handleMouseMove);
  cancelAnimationFrame(animationFrameId);
};

defineExpose({ randomGrid, clearGrid });
</script>