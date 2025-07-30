<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-[#36454F] dark:bg-slate-800">
      <div class="mt-3">
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-[#10B981]">
            Lecteur audio - Appel
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Lecteur audio -->
        <div class="mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center space-x-4 mb-4">
              <button
                @click="togglePlay"
                class="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <component :is="isPlaying ? PauseIcon : PlayIcon" class="h-6 w-6" />
              </button>
              
              <div class="flex-1">
                <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>{{ formatTime(currentTime) }}</span>
                  <span>{{ formatTime(duration) }}</span>
                </div>
                <div class="relative">
                  <input
                    ref="progressBar"
                    type="range"
                    min="0"
                    :max="duration"
                    :value="currentTime"
                    @input="seek"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  @click="setPlaybackRate(0.5)"
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    playbackRate === 0.5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  ]"
                >
                  0.5x
                </button>
                <button
                  @click="setPlaybackRate(1)"
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    playbackRate === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  ]"
                >
                  1x
                </button>
                <button
                  @click="setPlaybackRate(1.5)"
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    playbackRate === 1.5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  ]"
                >
                  1.5x
                </button>
                <button
                  @click="setPlaybackRate(2)"
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    playbackRate === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  ]"
                >
                  2x
                </button>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <button
                  @click="skip(-10)"
                  class="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                >
                  <BackwardIcon class="h-4 w-4" />
                  <span class="text-sm">-10s</span>
                </button>
                
                <button
                  @click="skip(10)"
                  class="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
                >
                  <span class="text-sm">+10s</span>
                  <ForwardIcon class="h-4 w-4" />
                </button>
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  @click="toggleMute"
                  class="text-gray-600 hover:text-gray-800"
                >
                  <component :is="isMuted ? SpeakerXMarkIcon : SpeakerWaveIcon" class="h-5 w-5" />
                </button>
                
                <input
                  ref="volumeSlider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  :value="volume"
                  @input="setVolume"
                  class="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Transcription -->
        <div v-if="transcription" class="mb-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Transcription</h4>
          <div class="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div class="space-y-2">
              <div
                v-for="(segment, index) in transcriptionSegments"
                :key="index"
                class="flex items-start space-x-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
                @click="seekToSegment(segment.start)"
              >
                <span class="text-xs text-gray-500 min-w-[60px]">
                  {{ formatTime(segment.start) }}
                </span>
                <span class="text-sm text-gray-900">{{ segment.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            @click="downloadAudio"
            class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
          >
            <ArrowDownTrayIcon class="mr-2 h-4 w-4 inline" />
            Télécharger
          </button>
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
    
    <!-- Élément audio caché -->
    <audio
      ref="audioElement"
      :src="audioUrl"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  audioUrl?: string
  transcription?: string
}

const props = withDefaults(defineProps<Props>(), {
  audioUrl: '',
  transcription: ''
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Références
const audioElement = ref<HTMLAudioElement>()
const progressBar = ref<HTMLInputElement>()
const volumeSlider = ref<HTMLInputElement>()

// État local
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const playbackRate = ref(1)

// Computed
const transcriptionSegments = computed(() => {
  if (!props.transcription) return []
  
  // Simulation de segments de transcription avec timestamps
  // En réalité, cela viendrait d'une API de transcription
  return [
    { start: 0, text: "Bonjour, c'est le service de suivi post-hospitalisation." },
    { start: 5, text: "Comment vous sentez-vous aujourd'hui ?" },
    { start: 10, text: "Avez-vous bien pris vos médicaments ce matin ?" },
    { start: 15, text: "Y a-t-il des effets secondaires que vous avez remarqués ?" }
  ]
})

// Méthodes
const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const seek = (event: Event) => {
  const target = event.target as HTMLInputElement
  const time = parseFloat(target.value)
  if (audioElement.value) {
    audioElement.value.currentTime = time
  }
}

const skip = (seconds: number) => {
  if (audioElement.value) {
    audioElement.value.currentTime += seconds
  }
}

const setPlaybackRate = (rate: number) => {
  playbackRate.value = rate
  if (audioElement.value) {
    audioElement.value.playbackRate = rate
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (audioElement.value) {
    audioElement.value.muted = isMuted.value
  }
}

const setVolume = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newVolume = parseFloat(target.value)
  volume.value = newVolume
  if (audioElement.value) {
    audioElement.value.volume = newVolume
  }
}

const seekToSegment = (startTime: number) => {
  if (audioElement.value) {
    audioElement.value.currentTime = startTime
  }
}

const downloadAudio = () => {
  if (props.audioUrl) {
    const link = document.createElement('a')
    link.href = props.audioUrl
    link.download = 'appel-audio.mp3'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Événements audio
const onLoadedMetadata = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
}

const onError = (error: Event) => {
  console.error('Erreur audio:', error)
  isPlaying.value = false
}

// Lifecycle
onMounted(() => {
  // Initialiser le volume
  if (audioElement.value) {
    audioElement.value.volume = volume.value
  }
})

onUnmounted(() => {
  // Nettoyer l'audio
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
  }
})
</script>

<style scoped>
.slider {
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style> 
