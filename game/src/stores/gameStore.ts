import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('gameStore', () => {
  const points = ref(0)

  function addPoint() {
    points.value++
  }

  function resetPoints() {
    points.value = 0
  }

  return { points, addPoint, resetPoints }
})
