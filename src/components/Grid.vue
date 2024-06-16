<template>
  <div ref="pixiContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Application, Sprite, Texture, Container, Graphics, GraphicsContext, childrenHelperMixin } from 'pixi.js';

const socket = new WebSocket(import.meta.env.VITE_WS_URL);

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

const pixelSize = 10;
let width = 0;
let height = 0;
let cellsPool = [];
const containerGrid = new Container();

const createCell = (x, y) => {
  const square = new Sprite(Texture.WHITE);
  square.width = pixelSize - 1;
  square.height = pixelSize - 1;
  square.tint = 0xffffff;
  square.position.set(x * pixelSize + 1, y * pixelSize + 1);
  cellsPool.push(square);
  return square;
};

const bg = new Sprite(Texture.WHITE);
bg.tint = 0x000000;
bg.alpha = 0;
bg.position.set(0, 0);

const renderCells = (newCells) => {
  cellsPool.forEach((cell) => {
    container.removeChild(cell);
    cell.destroy();
  });

  const centerX = app.screen.width / 2;
  const centerY = app.screen.height / 2;
  const scaledWidth = (width * pixelSize) * props.scale;
  const scaledHeight = (height * pixelSize) * props.scale;

  newCells.forEach(({ x, y }) => {
    let cell = createCell(x, y);
    cell.renderable = !(x < 0 || y < 0 || x > width * pixelSize || y > height * pixelSize);
    container.addChild(cell);
  });

  containerGrid.children.forEach((line) => {
    line.renderable = !(line.x < 0 || line.y < 0 || line.x > width * pixelSize || line.y > height * pixelSize);
  });

  container.scale.set(props.scale, props.scale);
  container.position.set(centerX - scaledWidth / 2, centerY - scaledHeight / 2);
};

const randomGrid = () => {
  socket.send('random');
};

const clearGrid = () => {
  socket.send('clear');
};

const stopGame = () => {
  socket.send('stop');
};

const startGame = () => {
  socket.send('start');
};

defineExpose({ randomGrid, clearGrid, stopGame, startGame });

onMounted(async () => {
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
  });
  pixiContainer.value.appendChild(app.canvas);

  app.stage.addChild(container);
  container.scale.set(props.scale, props.scale);
  container.eventMode = 'static';

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (height != data.gameState.height || width != data.gameState.width) {
      width = data.gameState.width;
      height = data.gameState.height;
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
      container.position.set(app.screen.width / 2 - ((width * pixelSize) * props.scale) / 2, app.screen.height / 2 - ((height * pixelSize) * props.scale) / 2);
    }
    if (data.gameState.playing) {
      emit('update:gameRunning', true);
    } else {
      emit('update:gameRunning', false);
    }
    renderCells(data.cells);
  };

  socket.onclose = () => {
    console.log('Connection closed');
  };

  socket.onerror = (e) => {
    console.error('Error:', e);
  };

  let isDragging = false;
  container.on('pointerdown', (e) => {
    isDragging = true;
    const x = Math.floor((e.global.x - container.position.x) / (pixelSize * props.scale));
    const y = Math.floor((e.global.y - container.position.y) / (pixelSize * props.scale));
    socket.send(JSON.stringify({ "x": x, "y": y }));
  });

  container.on('pointerup', (e) => {
    isDragging = false;
  });

  container.on('pointermove', (e) => {
    if (isDragging) {
      const x = Math.floor((e.global.x - container.position.x) / (pixelSize * props.scale));
      const y = Math.floor((e.global.y - container.position.y) / (pixelSize * props.scale));
      socket.send(JSON.stringify({ "x": x, "y": y }));
    }
  });
});

onUnmounted(() => {
  app.destroy();
});
</script>