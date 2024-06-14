<template>
  <div ref="pixiContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Application, Sprite, Texture, Container } from 'pixi.js';

const props = defineProps({
  scale: Number,
});
const pixiContainer = ref(null);

const app = new Application();
const container = new Container();

const pixelSize = 1
let width = 0;
let height = 0;

const getCellFromPool = (x, y) => {
  const square = new Sprite(Texture.WHITE);
  square.width = pixelSize;
  square.height = pixelSize;
  square.tint = 0xffffff;
  square.position.set(x * pixelSize, y * pixelSize);
  return square;
};

const renderCells = (newCells) => {
  container.removeChildren();
  for (let i = 0; i < newCells.length; i++) {
    container.addChild(getCellFromPool(newCells[i].x, newCells[i].y));
  }
  container.scale.set(props.scale, props.scale);
  container.position.set(app.screen.width / 2 - ((width * pixelSize) * props.scale) / 2, app.screen.height / 2 - ((height * pixelSize) * props.scale) / 2);
};

onMounted(async () => {
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
  });
  pixiContainer.value.appendChild(app.canvas);

  app.stage.addChild(container);
  container.scale.set(props.scale, props.scale);

  const socket = new WebSocket('ws://localhost:8080/ws');

  socket.onopen = () => {
    console.log('Connected to server');
  };

  let firstMessage = false;
  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (!firstMessage) {
      console.log(`Grid size: ${data.width} x ${data.height}`);
      width = data.width;
      height = data.height;
      container.position.set(app.screen.width / 2 - ((width * pixelSize) * props.scale) / 2, app.screen.height / 2 - ((height * pixelSize) * props.scale) / 2);
      firstMessage = true;
    } else {
      renderCells(data)
    }
  };
});

onUnmounted(() => {
  app.destroy();
});
</script>