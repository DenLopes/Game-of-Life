<template>
  <div ref="pixiContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Application, Sprite, Texture, Container, Graphics, Point } from 'pixi.js';
import snappy from 'snappyjs';

const socket = new WebSocket(import.meta.env.VITE_WS_URL);

socket.binaryType = 'arraybuffer';

const props = defineProps({
  scale: Number,
  gameRunning: Boolean,
});

const emit = defineEmits(['update:gameRunning']);

const pixiContainer = ref(null);

socket.onopen = () => {
  console.log('Connected to server');
};

const app = new Application();
const container = new Container();

let gridScale = 2;
const pixelSize = 10;
let width = 256;
let height = 256;
let cellsPoolMap = new Map();
let animationFrameId;
let targetPixelSize = gridScale;
const containerGrid = new Container();
let containerPosition = { x: 0, y: 0 }

const createCell = (x, y) => {
  const square = new Sprite(Texture.WHITE);
  square.width = pixelSize - 1;
  square.height = pixelSize - 1;
  square.tint = 0xffffff;
  square.position.set(x * pixelSize + 1, y * pixelSize + 1);
  return square;
};

const bg = new Sprite(Texture.WHITE);
bg.tint = 0x000000;
bg.alpha = 0;
bg.position.set(0, 0);

const renderCells = () => {
  for (const [id, cell] of cellsPoolMap) {
    let renderable =
      cell.x * gridScale + containerPosition.x > -(pixelSize * gridScale) &&
      cell.x * gridScale + containerPosition.x < app.screen.width &&
      cell.y * gridScale + containerPosition.y > -(pixelSize * gridScale) &&
      cell.y * gridScale + containerPosition.y < app.screen.height;
    if (renderable) {
      cell.visible = true;
    } else {
      cell.visible = false;
    }
  }
  requestAnimationFrame(renderCells);
};

const updateCells = (bitArray) => {
  const newCells = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < width * height; i++) {
    if (bitArray[i] === 1) {
      newCells.push({ x, y });
    }
    x++;
    if (x >= width) {
      x = 0;
      y++;
    }
  }

  const cellsToUpdate = new Map();

  // Mark all existing cells for removal
  cellsPoolMap.forEach((cell, id) => {
    cellsToUpdate.set(id, { cell, action: 'remove' });
  });

  // Process new cells, either marking them for addition or cancelling removal
  newCells.forEach(({ x, y }) => {
    const id = `${x}_${y}`;
    if (cellsToUpdate.has(id)) {
      // If already marked for removal, cancel the removal
      cellsToUpdate.get(id).action = 'keep';
    } else {
      // Mark new cell for addition
      const newCell = createCell(x, y);
      cellsToUpdate.set(id, { cell: newCell, action: 'add' });
    }
  });

  // Execute the updates
  cellsToUpdate.forEach(({ cell, action }, id) => {
    if (action === 'add') {
      container.addChild(cell);
      cellsPoolMap.set(id, cell);
    } else if (action === 'remove') {
      container.removeChild(cell);
      cell.destroy();
      cellsPoolMap.delete(id);
    }
  });
};

const randomGrid = () => {
  socket.send('random');
};

const clearGrid = () => {
  socket.send('clear');
};

const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

const animateResize = () => {
  let prevGridScale = gridScale;
  gridScale = lerp(gridScale, targetPixelSize, 0.2);
  if (Math.abs(gridScale - targetPixelSize) > 0.01) {
    container.scale.set(gridScale, gridScale);
    containerPosition.x += ((width * pixelSize) * prevGridScale - (width * pixelSize) * gridScale) / 2;
    containerPosition.y += ((height * pixelSize) * prevGridScale - (height * pixelSize) * gridScale) / 2;
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

defineExpose({ randomGrid, clearGrid });

onMounted(async () => {
  // Initialize PIXI
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
  });
  pixiContainer.value.appendChild(app.canvas);

  app.stage.addChild(container);
  container.scale.set(gridScale, gridScale);
  container.eventMode = 'static';

  for (let i = 0; i <= width; i++) {
    const line = new Graphics().rect(i * pixelSize, 0, 1, height * pixelSize).fill({ color: 0xffffff, alpha: 0.25 });
    containerGrid.addChild(line);
  }
  for (let i = 0; i <= height; i++) {
    const line = new Graphics().rect(0, i * pixelSize, width * pixelSize, 1).fill({ color: 0xffffff, alpha: 0.25 });
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
      containerPosition.x += e.movementX
      containerPosition.y += e.movementY
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