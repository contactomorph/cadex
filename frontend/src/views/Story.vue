<template>
<div>
  <h1>L'histoire</h1>
  <p v-if="!story">Pas d'histoire</p>
  <template v-else-if="story.data.registering">
    <p>Histoire ouverte, vous pouvez vous inscrire</p>
    <input type="text" v-model="name" placeholder="ton nom">
    <button @click="join">Rejoindre / Changer de nom</button>
  </template>
  <p v-else-if="!story.data.completed">Histoire fermée, vous pouvez jouer</p>
  <p v-else>Histoire terminée</p>

  <h1>Les joueurs</h1>

  <ul v-for="(p, num) in story.data.players" :key="num">
    <li v-if="p">
      Joueur #{{num}}: {{ p.name }}
      <span v-if="player && player.data.num === p.num"> (Moi)</span>
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

  <div>
    <h1>Debug</h1>
    <input type="text" v-model="baduid" placeholder="baduid">
    <button @click="testBadUID">Create a player with bad uid</button>
    <button @click="testUpdateStory">Try to modify story</button>
  </div>

</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Story, registerPlayer, Player, getUID } from '../backend'
import { ExCadMode, ExCadToken } from "../components/ExCad.vue"

const StoryModule = Vue.extend({
  data() {
    return {
      story: null as null | Story,
      player: null as null | Player,
      name: '',
      myTurn: false,
      text: '',
      baduid: '',
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
  computed: {
    tokens: function(): ExCadToken[] {
      if (!this.story || !this.player)
        return []
      const story: Story = this.story
      if (story.data.registering)
        return []
      const player: Player = this.player
      const tokens = [] as ExCadToken[];
      const currentPlayerIndex = story.data.currentPlayer
      const completed = story.data.completed
      const isMyTurn: boolean = player.data.myTurn
      const myNum: number = player.data.num
      for(let i = 1; i <= currentPlayerIndex; ++i) {
        const p = story.data.players[i]
        if (p) {
          const isMine = myNum === p.num
          const isAlmostLast = p.num == currentPlayerIndex - 1
          const isLast = p.num == currentPlayerIndex
          const mode: ExCadMode =
            completed || (!isMyTurn && isMine) ? ExCadMode.Disclosed :
            !isMyTurn ? ExCadMode.Hidden :
            isAlmostLast ? ExCadMode.HalfHidden :
            isLast && isMine ? ExCadMode.ReadyForInput :
            ExCadMode.Hidden
          const name: string = p.name ?? "?"
          const head: string = mode === ExCadMode.Disclosed && !completed ?
            player.data.head :
            p.head ?? ""
          const tail: string = mode === ExCadMode.Disclosed && !completed ?
            player.data.tail :
            mode === ExCadMode.HalfHidden ?
            player.data.ptail :
            p.tail ?? ""
          const token = new ExCadToken(name, head, tail, mode)
          tokens.push(token)
        }
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

      await this.player.update({
        played: true,
        head: myToken.beginning,
        tail: myToken.ending
      })
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

    testBadUID () {
      if (!this.story) {
        return
      }
      const player = new Player(this.story.data.id, this.baduid)
      player.update({
        name: "corrupt name",
        head: "corrupt head",
        tail: "corrupt tail"
      })
    },

    testUpdateStory () {
      if (!this.story) {
        return
      }
      this.story.update({
        playerNumber: -1
      })
    }
  }
})



export default StoryModule
</script>
