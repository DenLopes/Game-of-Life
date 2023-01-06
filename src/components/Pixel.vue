<script>
export default {
    props: {
        alive: Boolean,
        x: Number,
        y: Number,
        pSize: Number,
    },
}
</script>

<template>
    <button 
    @click="$emit('flipArray', x, y)" 
    class="border-solid border-black border" 
    :class="[alive ? 'bg-black' : '' ]"
    :style="{ 'width': pSize+'px', 'height': pSize+'px' }"
    ></button>
</template>