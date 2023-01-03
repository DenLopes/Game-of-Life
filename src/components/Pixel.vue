<script>
export default {
    props: {
        alive: Boolean,
        x: Number,
        y: Number,
    }
}
</script>

<template>
    <button @click="$emit('flipArray', x, y)" class="w-5 h-5 border-solid border-black border" :class="[alive ? 'bg-black' : 'bg-white']"></button>
</template>