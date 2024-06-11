<template>
  <div class="flex justify-center items-center w-full h-full">
    <canvas ref="canvasRef" :width="(columns + 1) * pixelSize" :height="(rows + 1) * pixelSize"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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
let grid = Array.from({ length: props.columns + 1 }, () =>
  Array.from({ length: props.rows + 1 }, () => (false))
)
let cellsAlive = Array.from({ length: props.columns * props.rows }, () => ({
}))
let mouseDown = false

const changeGrid = (e) => {
  const x = Math.floor(e.offsetX / props.pixelSize)
  const y = Math.floor(e.offsetY / props.pixelSize)
  if (x > 0 && x < props.columns && y > 0 && y < props.rows) {
    grid[x][y] = !grid[x][y]
    if (grid[x][y]) {
      cellsAlive.push({ x, y })
    } else {
      cellsAlive = cellsAlive.filter(cell => !(cell.x === x && cell.y === y));
    }
  }
}

const randomGrid = () => {
  cellsAlive = []
  grid = Array.from({ length: props.columns + 1 }, () =>
    Array.from({ length: props.rows + 1 }, () => (false))
  )
  for (let i = 1; i < props.columns; i++) {
    for (let j = 1; j < props.rows; j++) {
      if (Math.random() < 0.4) {
        cellsAlive.push({ x: i, y: j })
        grid[i][j] = true
      }
    }
  }
}

const clearGrid = () => {
  cellsAlive = []
  grid = Array.from({ length: props.columns + 1 }, () =>
    Array.from({ length: props.rows + 1 }, () => (false))
  )
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
  console.time('applyRules')
  const newGrid = Array.from({ length: props.columns + 1 }, () =>
    Array.from({ length: props.rows + 1 }, () => (false))
  )
  const newCellsAlive = []
  for (let i = 1; i < props.columns; i++) {
    for (let j = 1; j < props.rows; j++) {
      let neighbors = 0
      for (const [x, y] of neighborOffsets) {
        if (grid[i + x] && grid[i + x][j + y]) {
          neighbors++
        }
      }
      if (grid[i][j]) {
        if (neighbors === 2 || neighbors === 3) {
          newGrid[i][j] = true
          newCellsAlive.push({ x: i, y: j })
        }
      } else {
        if (neighbors === 3) {
          newGrid[i][j] = true
          newCellsAlive.push({ x: i, y: j })
        }
      }
    }
  }
  grid = newGrid
  cellsAlive = newCellsAlive
  console.timeEnd('applyRules')
}

const renderGrid = async () => {
  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  for (const { x, y } of cellsAlive) {
    ctx.value.fillRect(x * props.pixelSize, y * props.pixelSize, props.pixelSize, props.pixelSize)
  }

  setTimeout(() => {
    renderGrid()
    if (props.running) {
      applyRules()
    }
  }, props.simulationSpeed)
}



defineExpose({
  randomGrid,
  clearGrid,
})

onMounted(() => {
  ctx.value = canvasRef.value.getContext('2d');
  ctx.value.fillStyle = 'black';
  renderGrid();

  const handleMouseDown = (e) => {
    mouseDown = true;
    changeGrid(e);
  };

  const handleMouseUp = () => {
    mouseDown = false;
  };

  const handleMouseMove = (e) => {
    if (mouseDown) {
      changeGrid(e);
    }
  };

  canvasRef.value.addEventListener('mousedown', handleMouseDown);
  canvasRef.value.addEventListener('mouseup', handleMouseUp);
  canvasRef.value.addEventListener('mousemove', handleMouseMove);
});

// Existing onUnmounted function with updates to remove the correct listeners
onUnmounted(() => {
  canvasRef.value.removeEventListener('mousedown', handleMouseDown);
  canvasRef.value.removeEventListener('mouseup', handleMouseUp);
  canvasRef.value.removeEventListener('mousemove', handleMouseMove);
});
</script>
