<script setup>
import Pixel from "../components/Pixel.vue"
</script>

<template> 
    <div id="col" class="grid">
        <div v-for="(col, x_index) in grid" :key="x_index" class="grid">
            <div v-for="(row, y_index) in col" :key="y_index" class="grid">
                <Pixel @flipArray="changeGrid" :alive="row" :x="x_index" :y="y_index"/>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            col: 49,
            row: 44,
            grid: [],
        }
    },
    methods: {
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
                    if (Math.random() < 0.65){
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
        },
        emitInterface() {
            this.$emit("interface", {
                createGrid: () => this.createGrid(),
                randomGrid: () => this.randomGrid(),
                applyRules: () => this.applyRulesGrid(),
            })
        },
    },   
    mounted() {
        this.createGrid();
        this.emitInterface();
    }
}
</script>

<style scoped> 
    #col {grid-template-columns: repeat( 50, minmax(0, 1fr))}
</style>