<template>
  <div class="flex justify-center items-center w-full h-full">
    <canvas
      ref="canvasRef"
      @click="changeGrid"
      :width="(columns + 1) * pixelSize"
      :height="(rows + 1) * pixelSize"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  pixelSize: Number,
  running: Boolean,
  simulationSpeed: Number,
  columns: Number,
  rows: Number
})

//reactive values
const ctx = ref()
const canvasRef = ref()

// variables
let cellsToBeFlipped = []
let grid = Array.from({ length: props.columns + 1 }, () =>
  Array.from({ length: props.rows + 1 }, () => ({ current: false, next: false }))
)
let cellsTobeDrawn = Array.from({ length: props.columns * props.rows }, () => ({
  x: 0,
  y: 0,
  alive: false
}))

const changeGrid = (e) => {
  const x = Math.floor(e.offsetX / props.pixelSize)
  const y = Math.floor(e.offsetY / props.pixelSize)
  cellsToBeFlipped.push([x, y])
}

const randomGrid = () => {
  cellsToBeFlipped = []
  for (let i = 0; i <= props.columns; i++) {
    for (let j = 0; j <= props.rows; j++) {
      if (Math.random() < 0.65) {
        grid[i][j].current = false
        cellsTobeDrawn.push({ x: i, y: j, alive: false })
      } else {
        grid[i][j].current = true
        cellsTobeDrawn.push({ x: i, y: j, alive: true })
      }
    }
  }
}

const clearGrid = () => {
  for (let i = 0; i <= props.columns; i++) {
    for (let j = 0; j <= props.rows; j++) {
      if (grid[i][j].current) {
        cellsTobeDrawn.push({ x: i, y: j, alive: false })
      }
      grid[i][j].current = false
    }
  }
  cellsToBeFlipped = []
}

const neighborOffsets = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
]

const applyRules = async () => {
  for (let i = 0; i <= props.columns; i++) {
    for (let j = 0; j <= props.rows; j++) {
      let neighbors = 0
      console.log('Grid length after adding columns:', grid.length)
      for (let [dx, dy] of neighborOffsets) {
        let nx = i + dx
        let ny = j + dy
        if (nx >= 0 && nx <= props.columns && ny >= 0 && ny <= props.rows && grid[nx][ny].current) {
          neighbors++
        }
      }
      const alive = grid[i][j].current
      grid[i][j].next = alive ? neighbors === 2 || neighbors === 3 : neighbors === 3
      if (grid[i][j].current !== grid[i][j].next) {
        cellsTobeDrawn.push({ x: i, y: j, alive: grid[i][j].next })
      }
    }
  }
  for (let i = 0; i < cellsTobeDrawn.length; i++) {
    grid[cellsTobeDrawn[i].x][cellsTobeDrawn[i].y].current = cellsTobeDrawn[i].alive
  }
}

const renderGrid = async () => {
  for (let i = 0; i < cellsToBeFlipped.length; i++) {
    grid[cellsToBeFlipped[i][0]][cellsToBeFlipped[i][1]].current =
      !grid[cellsToBeFlipped[i][0]][cellsToBeFlipped[i][1]].current
    cellsTobeDrawn.push({
      x: cellsToBeFlipped[i][0],
      y: cellsToBeFlipped[i][1],
      alive: grid[cellsToBeFlipped[i][0]][cellsToBeFlipped[i][1]].current
    })
  }
  cellsToBeFlipped = []
  for (let i = 0; i < cellsTobeDrawn.length; i++) {
    if (cellsTobeDrawn[i].alive) {
      ctx.value.fillRect(
        cellsTobeDrawn[i].x * props.pixelSize,
        cellsTobeDrawn[i].y * props.pixelSize,
        props.pixelSize,
        props.pixelSize
      )
    } else {
      ctx.value.clearRect(
        cellsTobeDrawn[i].x * props.pixelSize,
        cellsTobeDrawn[i].y * props.pixelSize,
        props.pixelSize,
        props.pixelSize
      )
    }
  }
  cellsTobeDrawn = []
  if (props.running) {
    applyRules()
  }
  requestAnimationFrame(renderGrid)
}

const moreColumns = () => {
  grid.push(Array.from({ length: props.rows + 1 }, () => ({ current: false, next: false })))
}

const lessColumns = () => {
  grid.pop()
}

const moreRows = () => {
  grid.forEach((col) => {
    col.push({ current: false, next: false })
  })
}

const lessRows = () => {
  grid.forEach((col) => {
    col.pop()
  })
}

defineExpose({
  randomGrid,
  clearGrid,
  moreColumns,
  lessColumns,
  moreRows,
  lessRows
})

onMounted(() => {
  ctx.value = canvasRef.value.getContext('2d')
  renderGrid()
})
</script>
