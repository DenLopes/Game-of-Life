<script setup>
import Grid from './components/Grid.vue'
</script>

<template>
	<div class="flex md:justify-center w-screen mb-1">
		<div class="flex lg:flex-row md:justify-around flex-col w-full m-2">
			<div class="flex self-center w-fit rounded-md bg-red-400 mb-1 lg:m-0">
				<button @click="randomGrid()" class="h-10 w-fit p-2 font-bold">RANDOM</button>
				<button @click="createGrid()" class="h-10 w-fit p-2 px-4 font-bold bg-yellow-400">CLEAR</button>
				<button @click="play_Pause()" class="h-10 w-fit p-2 px-4 font-bold  rounded-r-md bg-green-400">{{ state }}</button>
			</div>
			<div class="flex justify-center">
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">COLUMNS:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="more_Columns()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="less_Columns()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
					</div>
				</div>
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">ROWNS:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="more_Rows()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="less_Rows()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
					</div>
				</div>
				<div class="flex md:flex-row flex-col">
					<p class="flex items-center mr-1 font-bold">TILES SIZE:</p>
					<div class="rounded-md h-fit bg-blue-400 mr-2">
						<button @click="size_Up()" class="font-extrabold h-8 w-10 m-auto">+</button>
						<button @click="size_Down()" class="font-extrabold h-8 w-10 m-auto border-l-2 border-black">-</button>
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
			speed: 260,
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
                return this.interval = setInterval(() => this.applyRules(), this.speed)
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
		faster() {
			if(this.speed <= 10) {
				this.speed = 10
			}else{
				this.speed -= 50
				console.log(this.speed+'ms')
				if(this.state === 'PAUSE') {
					clearInterval(this.interval)
					return this.interval = setInterval(() => this.applyRules(), this.speed)
				}
			}
		},
		slower() {
			if(this.speed >= 1510) {
				this.speed = 1510
			}else{
				this.speed += 50
				console.log(this.speed+'ms')
				if(this.state === 'PAUSE') {
					clearInterval(this.interval)
					return this.interval = setInterval(() => this.applyRules(), this.speed)
				}
			}
		},
    },
	mounted() {
		this.pixelSizeCell()
	}
}
</script>

