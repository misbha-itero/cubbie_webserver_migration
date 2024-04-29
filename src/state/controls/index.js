import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  video_id: 0,
  video_playing: 0,
  audio_id: 0,
  audio_playing: 0,
  audio_volume: 0,
  light_id: 0,
  light_brightness: 0,
  on_state: 0,
  isFilesAreDownloading: false,
}

const controlsSlice = createSlice({
  name: 'controls',
  initialState: initialState,
  reducers: {
    setVideoId: (state, { payload }) => {
      state.video_id = payload
    },
    setVideoPlaying: (state, { payload }) => {
      state.video_playing = payload
    },
    setAudioId: (state, { payload }) => {
      state.audio_id = payload
    },
    setAudioPlayling: (state, { payload }) => {
      state.audio_playing = payload
    },
    setAudioVolume: (state, { payload }) => {
      state.audio_volume = payload
    },
    setLightId: (state, { payload }) => {
      state.light_id = payload
    },
    setLightBrightness: (state, { payload }) => {
      state.light_brightness = payload
    },
    setIsFilesAreDownloading: (state, { payload }) => {
      state.isFilesAreDownloading = payload
    },
    setLightState: (state, { payload }) => {
      state.on_state = payload
    },
    resetState: state => {
      Object.assign(state, initialState)
    }
  }
})

export const {
  setVideoId,
  setVideoPlaying,
  setAudioId,
  setAudioPlayling,
  setAudioVolume,
  setLightId,
  setLightBrightness,
  setIsFilesAreDownloading,
  setLightState,
  resetState
} = controlsSlice.actions

export default controlsSlice.reducer
