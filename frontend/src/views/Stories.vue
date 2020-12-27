<template>
<div>
  <div class="row">
    <div class="col">
      <h2>Créer une nouvelle histoire</h2>
    </div>
  </div>
  <div class="row">
    <div class="col-10 form-group">
      <input v-model="adminName"  class="form-control" type="text" placeholder="votre nom">
    </div>
    <div class="col-2">
      <button @click="newStory" class="btn btn-primary">Créer</button>
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
        this.$router.push({
          name: "Story",
          params: {
            storyId: story.data.id
          }
        })
      })
    }
  }
})



export default StoryModule
</script>
