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
  </div>
  <Grid ref="gridRef" :game-running="isGameRunning" @update:gameRunning="(event) => (isGameRunning = event)" />
</template>
<script setup>
import { ref } from 'vue'
import Grid from './components/Grid.vue'

const gridRef = ref(null)
const isGameRunning = ref(true)

const randomGrid = () => {
  gridRef.value.randomGrid()
}

const clearGrid = () => {
  gridRef.value.clearGrid()
}
</script>
