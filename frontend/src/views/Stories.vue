<template>
  <div>
    <h1>Créer un nouvelle histoire</h1>
    <div>
      <input v-model="players" min="2" type="number">
      <button @click="newStory">Créer</button>
      <div>
        <a :href="storyUrl">Lien vers l'histoire</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Story } from '../backend'

const StoryModule = Vue.extend({
  data() {
    return {
      players: 2,
      storyUrl: "",
    }
  },
  methods: {
    newStory () {
      const story = new Story()
      story.startRegistration(this.players).then(() => {
        this.storyUrl = story.url
      })
    }
  }
})



export default StoryModule
</script>
