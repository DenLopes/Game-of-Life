<template>
	<div class="flex justify-center items-center w-full h-full">
		<canvas ref="canvasRef" class="border-solid border-black border" @click="changeGrid" :width="(gridCol * pSize)"
			:height="(gridRow * pSize)"></canvas>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const props = defineProps({
	pSize: Number,
})

const running = defineModel()

const gridCol = ref(420)
const gridRow = ref(400)
const ctx = ref()
const canvasRef = ref()

let pixelTobeFlipped = []
let grid = Array.from({ length: gridCol.value + 1 }, () =>
	Array.from({ length: gridRow.value + 1 }, () => ({ current: false, next: false }))
);
let cellsTobeDrawn = Array.from({ length: gridCol.value * gridRow.value }, () => ({ x: 0, y: 0, alive: false }))


const changeGrid = (x, y) => {
	pixelTobeFlipped.push([x, y])
}

const randomGrid = () => {
	for (let i = 0; i <= gridCol.value; i++) {
		for (let j = 0; j <= gridRow.value; j++) {
			if (Math.random() < 0.65) {
				grid[i][j].current = false
			} else { grid[i][j].current = true }
		}
	}
}

const neighborOffsets = [
	[-1, -1], [-1, 0], [-1, 1],
	[0, -1], [0, 1],
	[1, -1], [1, 0], [1, 1]
];

const applyRules = async () => {
	for (let i = 0; i <= gridCol.value; i++) {
		for (let j = 0; j <= gridRow.value; j++) {
			let neighbors = 0;
			for (let [dx, dy] of neighborOffsets) {
				let nx = i + dx;
				let ny = j + dy;
				if (nx >= 0 && nx <= gridCol.value && ny >= 0 && ny <= gridRow.value && grid[nx][ny].current) {
					neighbors++;
				}
			}
			const alive = grid[i][j].current;
			grid[i][j].next = alive ? (neighbors === 2 || neighbors === 3) : neighbors === 3;
			if (grid[i][j].current !== grid[i][j].next) {
				cellsTobeDrawn.push({ x: i, y: j, alive: grid[i][j].next })
			}
		}
	}
	for(let i = 0; i <= cellsTobeDrawn.length - 1; i++) {
		grid[cellsTobeDrawn[i].x][cellsTobeDrawn[i].y].current = cellsTobeDrawn[i].alive
	}
};


const renderGrid = async () => {
	for (let i = 0; i < pixelTobeFlipped.length; i++) {
		grid[pixelTobeFlipped[i][0]][pixelTobeFlipped[i][1]].current = !grid[pixelTobeFlipped[i][0]][pixelTobeFlipped[i][1]].current
		cellsTobeDrawn.push({ x: pixelTobeFlipped[i][0], y: pixelTobeFlipped[i][1], alive: grid[pixelTobeFlipped[i][0]][pixelTobeFlipped[i][1]].current })
	}
	pixelTobeFlipped = []
	for (let i = 0; i <= cellsTobeDrawn.length - 1; i++) {
		if(cellsTobeDrawn[i].alive) {
			ctx.value.fillRect(cellsTobeDrawn[i].x * props.pSize, cellsTobeDrawn[i].y * props.pSize, props.pSize, props.pSize)
		} else {
			ctx.value.clearRect(cellsTobeDrawn[i].x * props.pSize, cellsTobeDrawn[i].y * props.pSize, props.pSize, props.pSize)
		}
	}
	cellsTobeDrawn = []
	applyRules()
	requestAnimationFrame(renderGrid)
}

const moreColumns = () => {
	gridCol.value++
	grid[gridCol.value] = Array.from({ length: gridRow.value + 1 }, () => ({ current: false, next: false }))
}

const lessColumns = () => {
	if (gridCol.value <= 3) {
		gridCol.value = 3
	} else {
		gridCol.value--
		grid.pop()
	}
}

const moreRows = () => {
	gridRow.value++
	grid.forEach((col) => {
		col.push({ current: false, next: false })
	})
}

const lessRows = () => {
	if (gridRow.value <= 3) {
		gridRow.value = 3
	} else {
		gridRow.value--
		grid.forEach((col) => {
			col.pop()
		})
	}
}

const playPause = () => {
	if (running.value === 'PLAY') {

	} else {
		clearInterval(interval)
	}
}

const faster = () => {
	if (speed.value <= 10) {
		speed.value = 10
	} else {
		speed.value -= 50
		if (running.value === 'PAUSE') {
			clearInterval(interval)
		}
	}
}

const slower = () => {
	if (speed.value >= 1510) {
		speed.value = 1510
	} else {
		speed.value += 50
		if (running.value === 'PAUSE') {
			clearInterval(interval)
		}
	}
}

defineExpose({
	randomGrid,
	applyRules,
	moreColumns,
	lessColumns,
	moreRows,
	lessRows,
	faster,
	slower,
	playPause,
})

onMounted(() => {
	ctx.value = canvasRef.value.getContext('2d')
	randomGrid()
	renderGrid()
})
</script>
