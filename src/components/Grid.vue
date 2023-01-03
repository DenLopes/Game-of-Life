<script setup>
import Pixel from "../components/Pixel.vue"
</script>

<template>
    <div class="flex justify-center">
        <div class="flex flex-col justify-center h-screen">
            <div class="flex justify-between ">
                <button @click="randomGrid()" class="h-12 w-24 bg-red-400">RANDOM</button>
                <button @click="createGrid()" class="h-12 w-24 bg-yellow-400">CLEAR</button>
                <button @click="play_Pause()" class="h-12 w-24 bg-green-400">{{ state }}</button>
            </div>
            <div class="flex w-fit h-fit"> 
                <div id="col" class="grid">
                    <div v-for="(col, x_index) in grid" :key="x_index" class="grid">
                        <div v-for="(row, y_index) in col" :key="y_index" class="grid">
                            <Pixel @flipArray="changeGrid" :alive="row" :x="x_index" :y="y_index"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            col: 39,
            row: 39,
            grid: [],
            state: 'PLAY',
        }
    },
    methods: {
        play_Pause() {
            if(this.state === 'PLAY'){
                this.state = 'PAUSE'
                return this.interval = setInterval(() => this.applyRulesGrid(), 32)
            }else{
                this.state = 'PLAY'
                return clearInterval(this.interval)
            }
        },
        createGrid() {
            for (let i = 0; i <= this.col; i++) {
                this.grid[i] = []
                for (let j = 0; j <= this.row; j++) {
                    this.grid[i][j] = false
                }
            }
        },
        changeGrid(x, y) {
            this.grid[x][y] = !this.grid[x][y]
        },
        randomGrid() {
            for (let i = 0; i <= this.col; i++) {
                this.grid[i] = []
                for (let j = 0; j <= this.row; j++) {
                    if (Math.random() < 0.4){
                        this.grid[i][j] = false
                    }else{this.grid[i][j] = true}
                }
            }
        },
        applyRulesGrid(){
            const aux = []
            let neighbours = 0;
            for (let i = 0; i <= this.col; i++) {
                aux[i] = []
                for (let j = 0; j <= this.row; j++) {
                    neighbours = 0;
                    for(let k = -1; k < 2; k++){
                        for(let y = -1; y < 2; y++){
                            if(k === 0 && y === 0){
                                continue;
                            }
                            const x_pixel = i + k
                            const y_pixel = j + y
                            if(x_pixel >= 0 && y_pixel >= 0 && x_pixel < this.col && y_pixel < this.row){
                                if(this.grid[i+k][j+y] === true){
                                    neighbours++
                                }
                            }
                            
                        }
                    }
                    if(this.grid[i][j] === true && (neighbours === 2 || neighbours === 3)){
                        aux[i][j] = true
                    }else if(this.grid[i][j] === false && neighbours === 3){
                        aux[i][j] = true
                    }else{
                        aux[i][j] = false
                    }
                }
            }
            this.grid = aux
        }
    },   
    mounted() {
        this.createGrid();
    }
}
</script>

<style scoped> 
    #col {grid-template-columns: repeat( 40, minmax(0, 1fr))}
</style>