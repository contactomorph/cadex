import Vue from 'vue'
import Vuex from 'vuex'
import { Story, Player } from '../backend'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    story: null as (Story | null),
    me: null as (Player | null)
  },
  mutations: {
    joinStory (state, storyId) {
      state.story = new Story(storyId)
    },
    recordMe (state, playerId) {
      if (state.story) {
        state.me = state.story.join(playerId)
      }
    }
  },
  actions: {
  },
  modules: {
  }
})
