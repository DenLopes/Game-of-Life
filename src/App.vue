<script setup>
import Grid from './components/Grid.vue'
</script>

<template>
	<div class="flex md:justify-center w-screen mb-1">
		<div class="flex md:flex-row flex-col justify-around w-full m-2">
			<button @click="randomGrid()" class="h-fit w-fit p-2 font-bold mb-2 rounded-md hover:scale-105 bg-red-400">RANDOM</button>
			<button @click="createGrid()" class="h-fit w-fit p-2 font-bold mb-2 rounded-md hover:scale-105 bg-yellow-400">CLEAR</button>
			<button @click="play_Pause()" class="h-fit w-fit p-2 font-bold mb-2 rounded-md hover:scale-105 bg-green-400">{{ state }}</button>
			<div class="flex">
				<div class="flex md:flex-row flex-col">
					<p>COLUMNS:</p>
					<button @click="more_Columns()" class="font-bold h-fit w-fit p-2 mb-2 mx-1 rounded-md hover:scale-105 bg-blue-400">+</button>
					<button @click="less_Columns()" class="font-bold h-fit w-fit p-2 mb-2 rounded-md hover:scale-105 bg-blue-400">-</button>
				</div>
				<div class="flex md:flex-row flex-col">
					<p>ROWNS:</p>
					<button @click="more_Rows()" class="font-bold h-fit w-fit p-2 mb-2 mx-1 rounded-md hover:scale-105 bg-blue-400">+</button>
					<button @click="less_Rows()" class="font-bold h-fit w-fit p-2 mb-2 rounded-md hover:scale-105 bg-blue-400">-</button>
				</div>
				<div class="flex md:flex-row flex-col">
					<p>TILES SIZE:</p>
					<button @click="size_Up()" class="font-bold h-fit w-fit p-2 mb-2 mx-1 rounded-md hover:scale-105 bg-blue-400">+</button>
					<button @click="size_Down()" class="font-bold h-fit w-fit p-2 mb-2 rounded-md hover:scale-105 bg-blue-400">-</button>
				</div>
			</div>
		</div>
	</div>
	<div class="flex justify-center">
		<Grid @interface="getChildInterface" :pSize="pixelSize"></Grid>
	</div>     
</template>

<script>
export default {
    data() {
    	return{
    		state: 'PLAY',
			pixelSize: 18,
    	}
    },
    childInterface: {
    	createGrid: () => {},
    	randomGrid: () => {},
    	applyRules: () => {},
		more_Columns: () => {},
		less_Columns: () => {},
		more_Rows: () => {},
		less_Rows: () => {},
    },
    methods: {
    	getChildInterface(childInterface) {
    		this.$options.childInterface = childInterface
    	},
    	createGrid(){
    		this.$options.childInterface.createGrid()
    	},
      	randomGrid(){
        	this.$options.childInterface.randomGrid()
      	},
      	applyRules(){
        	this.$options.childInterface.applyRules()
      	},
		more_Columns(){
			this.$options.childInterface.more_Columns()
		},
		less_Columns(){
			this.$options.childInterface.less_Columns()
		},
		more_Rows(){
			this.$options.childInterface.more_Rows()
		},
		less_Rows(){
			this.$options.childInterface.less_Rows()
		},
      	play_Pause() {
            if(this.state === 'PLAY'){
                this.state = 'PAUSE'
                return this.interval = setInterval(() => this.applyRules(), 32)
            }else{
                this.state = 'PLAY'
                return clearInterval(this.interval)
            }
      	},
		size_Up() {
        	this.pixelSize++  
      	},
      	size_Down() {
        	this.pixelSize--
      	},
		pixelSizeCell() {
			if(window.screen.availWidth < 400) {
				this.pixelSize = 10
			}
		},
        
    },
	mounted() {
		this.pixelSizeCell()
	}
}
</script>

