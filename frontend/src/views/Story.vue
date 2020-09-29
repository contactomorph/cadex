<template>
  <div>
    <h1>L'histoire</h1>
    {{ state() }}
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
import { StoryState, Player, Chunk } from '../backend'
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
      myStory: ""
    }
  },
  created () {
    this.join()
  },
  methods: {
    state () {
      if (!this.$store.state.story) {
        return "En attente d'une nouvelle histoire"
      }
      switch(this.$store.state.story.data.state) {
        case StoryState.Starting:
          return "Début"
        case StoryState.Registering:
          return "On attend les derniers joueur"
        case StoryState.Writting:
          return "L'histoire s'écrit"
        case StoryState.End:
          return "C'est la fin"
      }
      return "Error"
    },
    post() {
      this.$store.state.me.play(this.head, this.tail)
    },
    join () {
      this.$store.commit('joinStory', this.$route.params.storyId)
      this.$store.state.story.load().then(() => {
        this.$store.state.story.setTheEndCallback((chunks: Array<Chunk>) => {
          for (const chunk of chunks) {
            this.myStory += (chunk.head + ' ' + chunk.tail + ' ')
          }
        })
      })

    },
    addPlayerCallback () {
      this.message = "This is not my turn"
      const myTurn = (me: Player, tail: string) => {
        this.message = "This is my turn !!!"
        this.previous = tail
      }
      this.$store.state.me.setMyTurnCallback(myTurn)
    }
  }
})



export default StoryModule
</script>
