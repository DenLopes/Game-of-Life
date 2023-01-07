<script setup>
import Pixel from "../components/Pixel.vue"
</script>

<template> 
    <div :style="{ 'grid-template-columns': 'repeat( '+(col+1)+', minmax(0, 1fr))'}" class="grid shadow-2xl w-fit">
        <div v-for="(col, x_index) in grid" :key="x_index" class="grid w-fit">
            <div v-for="(state, y_index) in col" :key="y_index" class="grid w-fit">
                <Pixel @flipArray="changeGrid" :alive="state" :x="x_index" :y="y_index" :pSize="pSize"/>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        pSize: Number,
    },
    data() {
        return {
            col: 49,
            row: 31,
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
            let aux = [];
            let neighbours;
            for (let i = 0; i <= this.col; ++i) {
                aux[i] = [];
                for (let j = 0; j <= this.row; ++j) {
                    neighbours = 0;
                    for(let k = -1; k < 2; ++k){
                        for(let y = -1; y < 2; ++y){
                            if(k === 0 && y === 0){
                                continue;
                            }
                            let x_pixel = i + k;
                            let y_pixel = j + y;
                            if(x_pixel >= 0 && y_pixel >= 0 && x_pixel < this.col && y_pixel < this.row){
                                if(this.grid[i+k][j+y] === true){
                                    neighbours++;
                                }
                            }
                            
                        }
                    }
                    if(this.grid[i][j] === false && neighbours === 3){
                        aux[i][j] = true;
                    }else if(this.grid[i][j] === true && (neighbours === 2 || neighbours === 3)){
                        aux[i][j] = true;
                    }else{
                        aux[i][j] = false;
                    }
                }
            }
            this.grid = aux;
        },
        updateGrid() {
            let aux = [];
            for (let i = 0; i <= this.col; ++i) {
                aux[i] = [];
                for (let j = 0; j <= this.row; ++j) {
                    aux[i][j] = this.grid[i][j]
                }
            }
            this.grid = aux;
        },
        more_Columns() {
            this.col++
            this.grid[this.col] = []
            for (let i = 0; i <= this.row; ++i) {
                this.grid[this.col][i] = false
            }
            this.updateGrid();
        },
        less_Columns() {
            if(this.col <= 3){
                this.col = 3
            }else{
                this.col--
                this.updateGrid();
            }
        },
        more_Rows() {
            this.row++
            this.updateGrid();
        },
        less_Rows() {
            if(this.row <= 3){
                this.row = 3
            }else{
                this.row--
                this.updateGrid();
            }
        },
        emitInterface() {
            this.$emit("interface", {
                createGrid: () => this.createGrid(),
                randomGrid: () => this.randomGrid(),
                applyRules: () => this.applyRulesGrid(),
                more_Columns: () => this.more_Columns(),
                less_Columns: () => this.less_Columns(),
                more_Rows: () => this.more_Rows(),
                less_Rows: () => this.less_Rows(),
            })
        },
        gridSizeCell() {
			if(window.screen.availWidth < 500) {
				this.col = 24
                this.row = 46
                this.updateGrid()
			}else{
                this.col = 49
                this.row = 31
                this.updateGrid()
            }
		},
    },   
    mounted() {
        this.emitInterface();
        this.createGrid();
        this.gridSizeCell();

    }
}
</script>