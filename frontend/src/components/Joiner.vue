<template>
<div>
  Joueur:
  <input type="text" v-model="username" placeholder="ton nom">
  {{ players.length }}
  <select v-model="username">
    <option v-for="player in players" v-bind:value="player.data.name" :key="player.id">
      {{ player.data.name }}
    </option>
  </select>
  <button @click="join">Rejoindre</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Story, Player } from '../backend'

const JoinerModule = Vue.extend({
  props: [
    'value'
  ],
  data () {
    return {
      username: "",
      players: [] as Array<Player>
    }
  },
  created () {
    this.$store.state.story.addUpdateCallback((story: Story) => {
      this.players.splice(0, this.players.length)
      for (const player of story.players) {
        this.players.push(player)
      }
    })
  },
  methods: {
    record (player: Player) {
      this.$store.commit('recordMe', player.id)
      this.$emit('playerSelected')
    },
    join () {
      const story = this.$store.state.story
      for (const player of story.players) {
        if(player.data.name === this.username) {
          this.record(player)
          return
        }
      }
      story.addPlayer(this.username).then(this.record)
    },
  }
})

export default JoinerModule
</script>
