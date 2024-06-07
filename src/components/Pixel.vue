<script setup>
const emit = defineEmits(['flipArray'])

const props = defineProps({
	alive: Boolean,
	x: Number,
	y: Number,
	pSize: Number,
})

const flipIfMousePressed = (event) => {
	if (event.buttons === 1) {
		emit('flipArray', props.x, props.y)
	}
}
</script>

<template>
	<div @mouseenter="(event) => flipIfMousePressed(event)" @click="emit('flipArray', x, y)" class="border-solid border-black border"
		:class="[alive ? 'bg-black' : '']" :style="{ 'width': pSize + 'px', 'height': pSize + 'px' }"></div>
</template>