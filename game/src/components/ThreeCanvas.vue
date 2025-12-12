<template>
  <div ref="canvasContainer" class="game-container">
    <canvas ref="gameCanvas"></canvas>
    <div class="points-counter">Points: {{ points }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// @ts-ignore: module has no type declarations
import initThree from '@/three/main-three.js' // your Three.js init function
import { useGameStore } from '@/stores/gameStore'

const canvasContainer = ref(null)
const gameCanvas = ref(null)

const gameStore = useGameStore()
const points = gameStore.points

onMounted(() => {
  if (gameCanvas.value) {
    initThree(gameCanvas.value, gameStore)
  }
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.points-counter {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 24px;
  font-weight: bold;
}
</style>
