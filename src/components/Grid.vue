<template>
  <div ref="canvas_ref" @click="randomGrid"
    :style="{ cursor: 'pointer', width: GRID_WIDTH * 12 + 'px', height: GRID_HEIGHT * 12 + 'px' }"></div>
</template>

<script setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import snappy from 'snappyjs';
import REGL from 'regl';
import fragmentShader from './shaders/shader.frag';
import vertexShader from './shaders/shader.vert';

// Refs
const canvas = useTemplateRef('canvas_ref');

// Constants
const CELL_SIZE = 4; // Each bit will be a 4x4 pixel block
const GRID_WIDTH = 1024; // Original grid width
const GRID_HEIGHT = 1024; // Original grid height
const INITIAL_GRID_SCALE = 2;
const MAX_GRID_SCALE = 4;
const MIN_GRID_SCALE = 1;

// Game variables
let animationFrameId = null;
let targetPixelSize = INITIAL_GRID_SCALE;
let regl, gameTexture, draw;

const props = defineProps({
  scale: Number,
  gameRunning: Boolean,
});

const socket = new WebSocket(import.meta.env.VITE_WS_URL);
socket.binaryType = 'arraybuffer';
socket.onopen = () => console.log('Connected to server');
socket.onclose = () => console.log('Connection closed');
socket.onerror = (e) => console.error('WebSocket Error:', e);

const byteToBitArray = (byte) => {
  const bits = [];
  for (let i = 7; i >= 0; i--) {
    // Think in binary for this one
    //     When i = 0:
    // 1 << 0 = 00000001 (mask for position 0)
    // byte   = 00000110
    // & (AND)= 00000000 (result = 0, meaning bit 0 is NOT set)

    // When i = 1:
    // 1 << 1 = 00000010 (mask for position 1)
    // byte   = 00000110
    // & (AND)= 00000010 (result > 0, meaning bit 1 is SET)

    // When i = 2:
    // 1 << 2 = 00000100 (mask for position 2)
    // byte   = 00000110
    // & (AND)= 00000100 (result > 0, meaning bit 2 is SET)

    // When i = 3:
    // 1 << 3 = 00001000 (mask for position 3)
    // byte   = 00000110
    // & (AND)= 00000000 (result = 0, meaning bit 3 is NOT set)
    // ... and so on
    bits.push((byte & (1 << i)) ? 255 : 0);
  }
  return bits;
};

const handleBlob = async (arrayBuffer) => {
  const byteArray = new Uint8Array(arrayBuffer);
  const bitArray = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  let index = 0;

  byteArray.forEach((byte) => {
    const bits = byteToBitArray(byte);
    bits.forEach(bit => {
      if (index < bitArray.length) {
        bitArray[index++] = bit;
      }
    });
  });

  if (gameTexture) {
    gameTexture.subimage({
      data: bitArray,
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      format: 'luminance',
      type: 'uint8',
    });
  }

  return bitArray;
};

// Event listeners remain the same
const setupEventListeners = () => {
  socket.onmessage = async (e) => {
    try {
      const decompressedData = snappy.uncompress(e.data);
      await handleBlob(decompressedData);
    } catch (e) {
      console.error('Error decompressing data:', e);
    }
  };
};

// Rest of the functions remain the same
const renderLoop = () => {
  if (props.gameRunning) {
    draw({
      texture: gameTexture,
    });
  }
  animationFrameId = requestAnimationFrame(renderLoop);
};

const cleanup = () => {
  socket.close();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

const randomGrid = () => {
  socket.send('random');
};

onMounted(async () => {
  setupEventListeners();
  regl = REGL(canvas.value);

  const elements = [[0, 1, 2], [0, 2, 3]];
  const positions = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

  gameTexture = regl.texture({
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    format: 'luminance',
    type: 'uint8',
    mag: 'nearest',
    min: 'nearest',
    data: new Uint8Array(GRID_WIDTH * GRID_HEIGHT).fill(0),
  });

  draw = regl({
    frag: fragmentShader,
    vert: vertexShader,
    attributes: {
      position: regl.buffer(positions),
      uv: regl.buffer(uvs),
    },
    elements: regl.elements(elements),
    uniforms: {
      texture: gameTexture,
      cellSize: CELL_SIZE,
      gridSize: [GRID_WIDTH, GRID_HEIGHT],
    },
  });

  console.log('Texture created with dimensions:', GRID_WIDTH, 'x', GRID_HEIGHT);

  renderLoop();
});

onUnmounted(() => {
  cleanup();
});
</script>