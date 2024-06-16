<template>
  <div class="absolute flex gap-4 p-2">
    <div class="flex justify-center">
      <button @click="randomGrid"
        class="bg-black text-white font-bold p-2 rounded-md border border-solid border-white">Random
        Grid</button>
    </div>
    <div class="flex justify-center">
      <button @click="clearGrid"
        class="bg-black text-white font-bold p-2 rounded-md border border-solid border-white">Clear
        Grid</button>
    </div>
    <div class="flex justify-center">
      <button @click="gameState" class="bg-black text-white font-bold p-2 rounded-md border border-solid border-white">{{
        isGameRunning ? 'Stop Game' : 'Start Game'
        }}</button>
    </div>
  </div>
  <Grid ref="gridRef" :scale="pixelSize" :game-running="isGameRunning"
    @update:gameRunning="(event) => (isGameRunning = event)" />
</template>
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Grid from './components/Grid.vue'

const pixelSize = ref(1)
const gridRef = ref(null)
const isGameRunning = ref(true)

const randomGrid = () => {
  gridRef.value.randomGrid()
}

const clearGrid = () => {
  gridRef.value.clearGrid()
}

const gameState = () => {
  if (isGameRunning.value) {
    gridRef.value.stopGame()
  } else {
    gridRef.value.startGame()
  }
}

const lerp = (a, b, t) => {
  return a + (b - a) * t;
};
onMounted(() => {
  let animationFrameId;
  let targetPixelSize = pixelSize.value;

  const animatePixelSize = () => {
    pixelSize.value = lerp(pixelSize.value, targetPixelSize, 0.2);
    if (Math.abs(pixelSize.value - targetPixelSize) > 0.01) {
      animationFrameId = requestAnimationFrame(animatePixelSize);
    } else {
      animationFrameId = null;
    }
  };

  addEventListener('wheel', (e) => {
    if (e.deltaY < 0) {
      targetPixelSize = pixelSize.value + 0.1;
      if (targetPixelSize > 2) {
        targetPixelSize = 2;
      }
    } else {
      targetPixelSize = pixelSize.value - 0.1;
      if (targetPixelSize < 1) {
        targetPixelSize = 1;
      }
    }

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(animatePixelSize);
    }
  });
});

onUnmounted(() => {
  removeEventListener('wheel');
  cancelAnimationFrame(animationFrameId);
});
</script>
