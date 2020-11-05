<template>
<div>
  <h1>L'histoire</h1>
  <div v-if="player && player.data.key === story.data.admin">
    <button @click="closeStory">Terminer l'histoire</button>
  </div>
  <div v-else>
    <input type="text" v-model="name" placeholder="ton nom">
    <button @click="join">Rejoindre</button>
  </div>
  <p v-if="story && story.data.completed">Histoire terminée</p>

  <h1>Les joueurs</h1>

  <ul v-for="(p, key) in story.data.players" :key="key">
    <li v-if="p">
      {{ p.name }}
      <span v-if="player && player.data.key === p.key"> (Moi)</span>
    </li>
  </ul>

  <p v-if="player && !player.exists">Je n'ai pas encore de nom</p>

  <h1>Le jeu</h1>
  
  <template v-if="story && player">
    <ex-cad :tokens="tokens"></ex-cad>
    <p v-if="story.data.completed">C'est terminé</p>
    <p v-else-if="player.data.myTurn">A moi de jouer ! <button @click="play">Play</button></p>
    <p v-else>Ce n'est pas mon tour</p>
  </template>

</div>
</template>

<script lang="ts">
  import Vue from 'vue'
import { Story, registerPlayer, closeStory, Player, getUID, play } from '../backend'
import { ExCadMode, ExCadToken } from "../components/ExCad.vue"

const StoryModule = Vue.extend({
  data() {
    return {
      story: new Story(this.$route.params.storyId),
      player: null as null | Player,
      name: '',
      myTurn: false,
      text: '',
      baduid: '',
    }
  },
  created () {
    this.story.enableAutoUpdate()
    getUID().then((uid) => {
      const player = new Player(this.story.data.id, uid)
      this.player = player
      player.enableAutoUpdate()
    })
  },
  computed: {
    tokens: function(): ExCadToken[] {
      if (!this.story || !this.player)
        return []
      const story: Story = this.story
      const player: Player = this.player
      const tokens = [] as ExCadToken[]
      const completed = story.data.completed
      const isMyTurn: boolean = player.data.myTurn
      const myKey: string = player.data.key
      let keys = story.data.rounds ?? []
      const lastPlayer: string = keys[keys.length-1]
      if (story.data.currentPlayer) {
        keys = keys.concat([story.data.currentPlayer])
      }
      for(const k of keys) {
        const p = story.data.players[k]

        let token: ExCadToken

        if (completed) {
          // the game is completed
          token = new ExCadToken(p.name, p.head, p.tail, ExCadMode.Disclosed)
        } else if (myKey === k) {
          // this row is mine
          const mode = isMyTurn ? ExCadMode.ReadyForInput : ExCadMode.Disclosed
          token = new ExCadToken(p.name, player.data.head, player.data.tail, mode)
        } else if(isMyTurn && k === lastPlayer) {
          // this row is just before me and i'm the current player
          token = new ExCadToken(p.name, "", player.data.ptail, ExCadMode.HalfHidden)
        } else {
          // this row is unrelated to me
          token = new ExCadToken(p.name)
        }
        tokens.push(token)
      }
      return tokens
    }
  },
  methods: {
    async play(): Promise<void> {
      if (!this.player) {
        return;
      }
      
      const myToken = this.tokens[this.tokens.length - 1]
      await play(this.story.data.id, myToken.beginning, myToken.ending)

    },
    async join (): Promise<void> {
      if (!this.story || !this.player) {
        return
      }
      const player: Player = this.player

      await player.load()

      if (player.exists) {
        /* Already register just update name */
        await player.update({name: this.name})
      } else {
        /* Not yet registered */
        player.data.name = this.name
        await registerPlayer(player)
      }
    },
    async closeStory (): Promise<void> {
      closeStory(this.story.data.id)
    }

  }
})



export default StoryModule
</script>
