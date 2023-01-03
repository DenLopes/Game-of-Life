<script setup>
import Grid from './components/Grid.vue'
</script>

<template>
  <div class="flex justify-center">
        <div class="flex flex-col justify-center h-screen">
            <div class="flex justify-between ">
                <button @click="randomGrid()" class="h-12 w-24 mb-2 rounded-md hover:scale-105 bg-red-400">RANDOM</button>
                <button @click="createGrid()" class="h-12 w-24 mb-2 rounded-md hover:scale-105 bg-yellow-400">CLEAR</button>
                <button @click="play_Pause()" class="h-12 w-24 mb-2 rounded-md hover:scale-105 bg-green-400">{{ state }}</button>
            </div>
            <Grid @interface="getChildInterface"></Grid>
        </div>
  </div>      
</template>

<script>
  export default {
    data() {
      return{
        state: 'PLAY',
      }
    },
    childInterface: {
      createGrid: () => {},
      randomGrid: () => {},
      applyRules: () => {},
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
      play_Pause() {
            if(this.state === 'PLAY'){
                this.state = 'PAUSE'
                return this.interval = setInterval(() => this.applyRules(), 32)
            }else{
                this.state = 'PLAY'
                return clearInterval(this.interval)
            }
        },
    }
  }
</script>

