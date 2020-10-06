<template>
<div>
  <h1>L'histoire</h1>
  <span v-if="story && story.data.registering">Histoire ouverte, vous pouvez vous inscrire</span>
  <span v-else><span v-if="story && !story.data.completed">Histoire fermée, vous pouvez jouer</span></span>
  <div v-if="story.data.completed">
    <h3>C'est terminé</h3>
    <div>
      <span v-for="(player, num) in story.data.players" :key="num"><span v-if="player">{{player.head}}&nbsp;{{player.tail}}&nbsp;</span></span>
    </div>
  </div>

  <h1>Les joueurs</h1>
  <div>
    <div v-for="(player, num) in story.data.players" :key="num">
      <span v-if="player">{{ player.name }}</span>
    </div>

    <input type="text" v-model="name" placeholder="ton nom"><button @click="join">Rejoindre / Changer de nom</button>
  </div>

  <h1>Le joueur</h1>
  Mon nom: <span v-if="player">{{ player.data.name }}</span>, <span v-if="player && player.data.myTurn">c'est mon tour, je dois continuer
    "{{ player.data.ptail }}"
  </span><span v-else>ce n'est pas mon tour</span>
  <div>
    <textarea type="text" v-model="head" placeholder="la suite"></textarea>
    <textarea type="text" v-model="tail" placeholder="la fin"></textarea>
    <button @click="play">Play</button>
  </div>


</div>
</template>

<script lang="ts">
  import Vue from 'vue'
import { Story, registerPlayer, Player, getUID } from '../backend'

const StoryModule = Vue.extend({
  data() {
    return {
      story: null as null | Story,
      player: null as null | Player,
      name: '',
      head: '',
      tail: '',
      myTurn: false,
      truc: null,
      text: ''
    }
  },
  created () {
    const story = new Story(this.$route.params.storyId)
    story.enableAutoUpdate()
    this.story = story
    getUID().then((uid) => {
      const player = new Player(story.data.id, uid)
      this.player = player
      player.enableAutoUpdate()
    })
  },
  methods: {
    async play() {
      if (!this.player) {
        return
      }
      await this.player.update({
        played: true,
        head: this.head,
        tail: this.tail
      })
    },
    async join () {
      if (!this.story || !this.player) {
        return
      }
      const player = this.player

      await player.load()

      if (player.exists) {
        /* Already register just update name */
        await player.update({name: this.name})
      } else {
        /* Not yet registered */
        player.data.name = this.name
        await registerPlayer(player)
      }
    }
  }
})



export default StoryModule
</script>
