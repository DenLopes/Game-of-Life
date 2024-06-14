<template>
  <div class="absolute">
    <div class="flex md:flex-row flex-col items-center pt-4">
      <p class="flex items-center mr-1 font-bold text-white">TILES SIZE:</p>
      <div class="rounded-md h-fit bg-blue-400 mr-2">
        <button @click="pixelSize++" class="font-extrabold h-7 w-10 m-auto">+</button>
        <button @click="pixelSize--" class="font-extrabold h-7 w-10 m-auto border-l-2 border-black">
          -
        </button>
      </div>
    </div>

  </div>
  <Grid :scale="pixelSize" />
</template>
<script setup>
import { ref } from 'vue'
import Grid from './components/Grid.vue'

const pixelSize = ref(10)

</script>
