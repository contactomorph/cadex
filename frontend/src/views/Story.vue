<template>
  <div>
    <h1>L'histoire</h1>
    {{ state }}
    <h1>Le joueur</h1>
    <Joiner v-on:playerSelected="addPlayerCallback"/>
    <div>{{ message  }}</div>

    <div>
      Je suis <span v-if="$store.state.me">{{ $store.state.me.data.name }}</span>
      <span v-if="previous"> et je dois continuer "{{ previous }}"</span>
    </div>

    <div>
      <input v-model="head" type="text" placeholder="la suite">
      <input v-model="tail" type="text" placeholder="la fin">
      <button @click="post">Play</button>
    </div>

    <div>
      {{ myStory }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Story, StoryState, Player, Chunk } from '../backend'
import Joiner from '@/components/Joiner.vue'

const StoryModule = Vue.extend({
  components: {
    Joiner
  },
  data() {
    return {
      previous: "",
      message: "No story",
      head: "",
      tail: "",
      storyUrl: "",
      myStory: "",
      state: ""
    }
  },
  created () {
    this.join()
  },
  methods: {
    refreshState (story: Story) {
      switch(story.data.state) {
        case StoryState.Starting:
          this.state = "Début"
          break
        case StoryState.Registering:
          this.state = "On attend les derniers joueur"
          break
        case StoryState.Writting:
          this.state =  "L'histoire s'écrit"
          break
        case StoryState.End:
          this.state = "C'est la fin"
          break
        default:
          this.state = "Error"
      }
    },
    post() {
      this.$store.state.me.play(this.head, this.tail)
    },
    theEnd (chunks: Array<Chunk>) {
      for (const chunk of chunks) {
        this.myStory += (chunk.head + ' ' + chunk.tail + ' ')
      }
    },
    join () {
      this.$store.commit('joinStory', this.$route.params.storyId)
      const story = this.$store.state.story
      story.load().then(() => {
        story.addUpdateCallback(this.refreshState)
        story.addTheEndCallback(this.theEnd)
      })

    },
    addPlayerCallback () {
      this.message = "This is not my turn"
      const myTurn = (me: Player, tail: string) => {
        this.message = "This is my turn !!!"
        this.previous = tail
      }
      this.$store.state.me.addMyTurnCallback(myTurn)
    }
  }
})



export default StoryModule
</script>
