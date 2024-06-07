<template>
  <div class="flex md:justify-center w-screen mb-1">
    <div class="flex lg:flex-row md:justify-around flex-col w-full m-2">
      <div class="flex self-center w-fit rounded-md bg-red-400 mb-1 lg:m-0">
        <button @click="randomGrid()" class="h-10 w-fit p-2 font-bold">RANDOM</button>
        <button @click="clearGrid()" class="h-10 w-fit p-2 px-4 font-bold bg-yellow-400">
          CLEAR
        </button>
        <button
          @click="running = !running"
          class="h-10 w-fit p-2 px-4 font-bold rounded-r-md bg-green-400"
        >
          {{ running ? 'STOP' : 'START' }}
        </button>
      </div>
      <div class="flex justify-center">
        <div class="flex md:flex-row flex-col items-center">
          <p class="flex items-center mr-1 font-bold">COLUMNS:</p>
          <div class="rounded-md h-fit bg-blue-400 mr-2">
            <button @click="columns++" class="font-extrabold h-7 w-10 m-auto">+</button>
            <input
              type="text"
              class="font-extrabold h-8 w-12 text-center m-auto border-l-2 border-black"
              v-model="columns"
            />
            <button
              @click="columns--"
              class="font-extrabold h-7 w-10 m-auto border-l-2 border-black"
            >
              -
            </button>
          </div>
        </div>
        <div class="flex md:flex-row flex-col items-center">
          <p class="flex items-center mr-1 font-bold">ROWNS:</p>
          <div class="rounded-md h-fit bg-blue-400 mr-2">
            <button @click="rows++" class="font-extrabold h-7 w-10 m-auto">+</button>
            <input
              type="text"
              class="font-extrabold h-8 w-12 text-center m-auto border-l-2 border-black"
              v-model="rows"
            />
            <button @click="rows--" class="font-extrabold h-7 w-10 m-auto border-l-2 border-black">
              -
            </button>
          </div>
        </div>
        <div class="flex md:flex-row flex-col items-center">
          <p class="flex items-center mr-1 font-bold">TILES SIZE:</p>
          <div class="rounded-md h-fit bg-blue-400 mr-2">
            <button @click="pixelSize++" class="font-extrabold h-7 w-10 m-auto">+</button>
            <input
              type="text"
              class="font-extrabold h-8 w-12 text-center m-auto border-l-2 border-black"
              v-model="pixelSize"
            />
            <button
              @click="pixelSize--"
              class="font-extrabold h-7 w-10 m-auto border-l-2 border-black"
            >
              -
            </button>
          </div>
        </div>
        <div class="flex md:flex-row flex-col items-center">
          <p class="flex items-center mr-1 font-bold">SPEED:</p>
          <div class="rounded-md h-fit bg-blue-400 mr-2">
            <button @click="simulationSpeed++" class="font-extrabold h-7 w-10 m-auto">+</button>
            <input
              type="text"
              class="font-extrabold h-8 w-12 text-center m-auto border-l-2 border-black"
              v-model="simulationSpeed"
            />
            <button
              @click="simulationSpeed--"
              class="font-extrabold h-7 w-10 m-auto border-l-2 border-black"
            >
              -
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="flex justify-center overflow-auto">
    <Grid
      ref="gridRef"
      :pixelSize="pixelSize"
      :simulationSpeed="simulationSpeed"
      :running="running"
      :columns="debounceColumns"
      :rows="debounceRows"
    ></Grid>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import Grid from './components/Grid.vue'

const running = ref(false)
const pixelSize = ref(10)
const gridRef = ref(null)
const simulationSpeed = ref(100)
const columns = ref(180)
const debounceColumns = ref(180)
const rows = ref(90)
const debounceRows = ref(90)

watch(columns, async () => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 250)
  })
  if (columns.value < 10) {
    columns.value = 10
  }
  debounceColumns.value = columns.value
})

watch(rows, async () => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 250)
  })
  if (rows.value < 10) {
    rows.value = 10
  }
  debounceRows.value = rows.value
})

watch(debounceColumns, (newValue, oldValue) => {
  const valueToBeChanged = Math.abs(newValue - oldValue)
  if (valueToBeChanged > 0) {
    if (newValue > oldValue) {
      moreColumns(valueToBeChanged)
    } else {
      lessColumns(valueToBeChanged)
    }
  }
})

watch(debounceRows, (newValue, oldValue) => {
  const valueToBeChanged = Math.abs(newValue - oldValue)
  if (valueToBeChanged > 0) {
    if (newValue > oldValue) {
      moreRows(valueToBeChanged)
    } else {
      lessRows(valueToBeChanged)
    }
  }
})

const randomGrid = () => {
  gridRef.value.randomGrid()
}

const clearGrid = () => {
  gridRef.value.clearGrid()
}

const moreColumns = (amount) => {
  for (let i = 0; i < amount; i++) {
    gridRef.value.moreColumns()
  }
}

const lessColumns = (amount) => {
  for (let i = 0; i < amount; i++) {
    gridRef.value.lessColumns()
  }
}

const moreRows = (amount) => {
  for (let i = 0; i < amount; i++) {
    gridRef.value.moreRows()
  }
}

const lessRows = (amount) => {
  for (let i = 0; i < amount; i++) {
    gridRef.value.lessRows()
  }
}
</script>
