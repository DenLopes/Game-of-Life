<template>
  <div ref="pixiContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { Application, Sprite, Texture, Container, Graphics, Point } from 'pixi.js';
import { AdvancedBloomFilter, CRTFilter, BulgePinchFilter } from 'pixi-filters';
import snappy from 'snappyjs';

const app = new Application();
const container = new Container();
const containerGrid = new Container();

const socket = new WebSocket(import.meta.env.VITE_WS_URL);
socket.binaryType = 'arraybuffer';
socket.onopen = () => {
  console.log('Connected to server');
};

const props = defineProps({
  scale: Number,
  gameRunning: Boolean,
});

const pixiContainer = ref(null);

const pixelSize = 10;
let gridScale = 2;
let width = 256;
let height = 256;
let animationFrameId;
let targetPixelSize = gridScale;
let containerPosition = { x: 0, y: 0 }
let cellsPoolMap = new Map();

const bg = new Sprite(Texture.WHITE);
bg.tint = 0x000000;
bg.alpha = 0;
bg.position.set(0, 0);

const createCell = (x, y) => {
  const square = new Sprite(Texture.WHITE);
  square.width = pixelSize - 2;
  square.height = pixelSize - 2;
  square.tint = 0xffffff;
  square.position.set(x * pixelSize + 2, y * pixelSize + 2);
  return square;
};

const updateCells = (bitArray) => {
  let x = 0;
  let y = 0;

  for (let i = 0; i < width * height; i++) {
    const id = `${x},${y}`;
    const existingCell = cellsPoolMap.get(id);
    const bit = bitArray[i];

    if (bit === 1 && !existingCell) {
      const cell = createCell(x, y);
      container.addChild(cell);
      cellsPoolMap.set(id, cell);
    } else if (bit === 0 && existingCell) {
      existingCell.renderable = false;
    } else if (bit === 1 && existingCell) {
      existingCell.renderable = true;
    }

    // Increment x, and reset x and increment y when hitting the width limit
    if (++x === width) {
      x = 0;
      y++;
    }
  }
};

const renderCells = () => {
  const minBoundX = -(pixelSize * gridScale);
  const minBoundY = -(pixelSize * gridScale);
  const maxBoundX = app.screen.width;
  const maxBoundY = app.screen.height;
  const offsetX = containerPosition.x;
  const offsetY = containerPosition.y;

  for (const [id, cell] of cellsPoolMap) {
    let screenPosX = cell.x * gridScale + offsetX;
    let screenPosY = cell.y * gridScale + offsetY;
    cell.visible = (screenPosX > minBoundX && screenPosX < maxBoundX &&
      screenPosY > minBoundY && screenPosY < maxBoundY);
  }
  requestAnimationFrame(renderCells);
};

const animateResize = () => {
  let prevGridScale = gridScale;
  gridScale = lerp(gridScale, targetPixelSize, 0.2);
  if (Math.abs(gridScale - targetPixelSize) > 0.01) {
    container.scale.set(gridScale, gridScale);
    //move the container to keep the center of the grid in the same place
    containerPosition.x = containerPosition.x - ((width * pixelSize) * (gridScale - prevGridScale)) / 2;
    containerPosition.y = containerPosition.y - ((height * pixelSize) * (gridScale - prevGridScale)) / 2;
    //if container is out of bounds, move it back
    if (containerPosition.x > 0) {
      containerPosition.x = 0;
    } else if (containerPosition.x < app.screen.width - (width * pixelSize * gridScale)) {
      containerPosition.x = app.screen.width - (width * pixelSize * gridScale);
    }
    if (containerPosition.y > 0) {
      containerPosition.y = 0;
    } else if (containerPosition.y < app.screen.height - (height * pixelSize * gridScale)) {
      containerPosition.y = app.screen.height - (height * pixelSize * gridScale);
    }
    container.position.set(containerPosition.x, containerPosition.y);
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

defineExpose({ randomGrid, clearGrid });

onMounted(async () => {
  // Initialize PIXI
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
    antialias: true,
    webgpu: true,
  });
  app.stage.filters = [
    new BulgePinchFilter({ radius: 1100, strength: .060, center: { x: 0.5, y: 0.5 } }),
    new CRTFilter({ curvature: 4, lineWidth: 1, vignetting: 0.3, noise: 0.3, time: 1, noiseSize: .3, vignettingAlpha: 0.5, seed: 0. }),
    new AdvancedBloomFilter({ threshold: 0.1, bloomScale: 1.7, brightness: 1.6, blur: 20, quality: 20 }),
  ];
  pixiContainer.value.appendChild(app.canvas);

  app.stage.addChild(container);
  container.scale.set(gridScale, gridScale);
  container.eventMode = 'static';

  for (let i = 0; i <= width; i++) {
    const line = new Graphics().rect(i * pixelSize, 0, 2, height * pixelSize).fill({ color: 0x414342 });
    containerGrid.addChild(line);
  }
  for (let i = 0; i <= height; i++) {
    const line = new Graphics().rect(0, i * pixelSize, width * pixelSize, 2).fill({ color: 0x414342 });
    containerGrid.addChild(line);
  }
  bg.width = width * pixelSize
  bg.height = height * pixelSize
  container.addChildAt(containerGrid, 0);
  container.addChildAt(bg, 1);
  containerPosition = new Point(app.screen.width / 2 - ((width * pixelSize) * gridScale) / 2, app.screen.height / 2 - ((height * pixelSize) * gridScale) / 2);
  container.position.set(containerPosition.x, containerPosition.y);

  requestAnimationFrame(renderCells)

  // Listen for messages
  socket.onmessage = async (e) => {
    try {
      const decompressedData = snappy.uncompress(e.data);
      const grid = await handleBlob(decompressedData);
      updateCells(grid);
    } catch (e) {
      console.error('Error decompressing data:', e);
    }
  };

  socket.onclose = () => {
    console.log('Connection closed');
  };

  socket.onerror = (e) => {
    console.error('Error:', e);
  };

  // Handle user input
  let isDragging = false;
  container.on('pointerdown', (e) => {
    isDragging = true;
    if (e.altKey) return;
    const x = Math.floor((e.global.x - container.position.x) / (pixelSize * gridScale));
    const y = Math.floor((e.global.y - container.position.y) / (pixelSize * gridScale));
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        socket.send(JSON.stringify({ "x": x + i, "y": y + j }));
      }
    }
  });

  container.on('pointerup', (e) => {
    isDragging = false;
  });

  container.on('pointermove', (e) => {
    if (isDragging && !e.altKey) {
      const x = Math.floor((e.global.x - container.position.x) / (pixelSize * gridScale));
      const y = Math.floor((e.global.y - container.position.y) / (pixelSize * gridScale));
      socket.send(JSON.stringify({ "x": x, "y": y }));
    }
  });

  addEventListener('wheel', (e) => {
    if (e.deltaY < 0) {
      targetPixelSize = gridScale + 0.1;
      if (targetPixelSize > 4) {
        targetPixelSize = 4;
      }
    } else {
      targetPixelSize = gridScale - 0.1;
      if (targetPixelSize < 1) {
        targetPixelSize = 1;
      }
    }
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(animateResize);
    }
  });

  addEventListener('resize', () => {
    containerPosition = new Point(app.screen.width / 2 - ((width * pixelSize) * gridScale) / 2, app.screen.height / 2 - ((height * pixelSize) * gridScale) / 2);
    container.position.set(containerPosition.x, containerPosition.y);
  });

  addEventListener('keydown', (e) => {
    if (e.key === 'r') {
      randomGrid();
    } else if (e.key === 'c') {
      clearGrid();
    }
  });

  addEventListener('mousemove', (e) => {
    if (e.altKey && isDragging) {
      //stop moving at the edges
      if (containerPosition.x + e.movementX > 0) {
        containerPosition.x = 0
      } else if (containerPosition.x + e.movementX < app.screen.width - (width * pixelSize * gridScale)) {
        containerPosition.x = app.screen.width - (width * pixelSize * gridScale)
      } else {
        containerPosition.x += e.movementX
      }
      if (containerPosition.y + e.movementY > 0) {
        containerPosition.y = 0
      } else if (containerPosition.y + e.movementY < app.screen.height - (height * pixelSize * gridScale)) {
        containerPosition.y = app.screen.height - (height * pixelSize * gridScale)
      } else {
        containerPosition.y += e.movementY
      }
      container.position.set(containerPosition.x, containerPosition.y)
    }
  });
});

onUnmounted(() => {
  app.destroy();
  removeEventListener('wheel');
  cancelAnimationFrame(animationFrameId);
  removeEventListener('resize');
  removeEventListener('keydown');
  removeEventListener('mousemove');
  removeEventListener('onclick');
});
</script>