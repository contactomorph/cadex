<template>
  <div>
    <h1>Créer un nouvelle histoire</h1>
    <div>
      <input v-model="adminName"  type="text" placeholder="nom">
      <button @click="newStory">Créer</button>
      <div>
        <a :href="storyUrl">Lien vers l'histoire</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { newStory as nstory} from '../backend'


const StoryModule = Vue.extend({
  data() {
    return {
      storyUrl: "",
      adminName: ""
    }
  },
  methods: {
    newStory () {
      nstory(this.adminName).then((story) => {
        this.storyUrl = "/stories/"+story.data.id
      })
    }
  }
})



export default StoryModule
</script>
