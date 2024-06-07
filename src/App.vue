<template>
	<div class="flex md:justify-center w-screen mb-1">
		<div class="flex lg:flex-row md:justify-around flex-col w-full m-2">
			<div class="flex self-center w-fit rounded-md bg-red-400 mb-1 lg:m-0">
				<button @click="randomGrid()" class="h-10 w-fit p-2 font-bold">RANDOM</button>
				<button @click="createGrid()" class="h-10 w-fit p-2 px-4 font-bold bg-yellow-400">CLEAR</button>
				<button @click="playPause(state)" class="h-10 w-fit p-2 px-4 font-bold  rounded-r-md bg-green-400">{{ state
					}}</button>
			</div>
			<div class="flex justify-center">
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">COLUMNS:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="moreColumns()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="lessColumns()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
					</div>
				</div>
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">ROWNS:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="moreRows()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="lessRows()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
					</div>
				</div>
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">TILES SIZE:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="sizeUp()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="sizeDown()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
					</div>
				</div>
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">SPEED:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="faster()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="slower()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="flex justify-center overflow-auto">
		<Grid v-model="state" ref="gridRef" :pSize="pixelSize"></Grid>
	</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import Grid from './components/Grid.vue'

const state = ref('PLAY')
const pixelSize = ref(4)
const gridRef = ref(null)

const createGrid = () => {
	gridRef.value.createGrid()
}

const randomGrid = () => {
	gridRef.value.randomGrid()
}

const moreColumns = () => {
	gridRef.value.moreColumns()
}

const lessColumns = () => {
	gridRef.value.lessColumns()
}

const moreRows = () => {
	gridRef.value.moreRows()
}

const lessRows = () => {
	gridRef.value.lessRows()
}

const slower = () => {
	gridRef.value.slower()
}

const faster = () => {
	gridRef.value.faster()
}

const playPause = () => {
	gridRef.value.playPause()
	if (state.value === 'PLAY') {
		state.value = 'PAUSE'
	} else {
		state.value = 'PLAY'
	}
}

const sizeUp = () => {
	pixelSize.value++
}

const sizeDown = () => {
	pixelSize.value--
}

const pixelSizeCell = () => {
	if (window.screen.availWidth < 400) {
		pixelSize.value = 10
	}
}

onMounted(() => {
	pixelSizeCell()
})
</script>
