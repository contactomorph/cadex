<template>
<div>
  <div class="row justify-content-between">
    <div class="col-6">
      <h2>Listes des joueurs</h2>

      <ul v-for="(p, key) in story.data.players" :key="key" class="list-group">
        <li v-if="p" class="list-group-item">
          {{ p.name }}
          <span v-if="player && player.data.key === p.key"> (Moi)
            <span v-for="color of colors" :key="color" >
              <i class="bi bi-bookmark-fill" :style="{color: color}" v-on:click="setColor(color)"></i>
            </span>
          </span>
        </li>
      </ul>
    </div>

    <div class="col-4">
      <h2>Actions</h2>
      <div v-if="player && player.data.key === story.data.admin">
        <button @click="startStory" class="btn btn-primary w-100">Démarrer</button>
      </div>
      <br/>
      <div v-if="player && player.data.key === story.data.admin">
        <button @click="closeStory" class="btn btn-primary w-100">Terminer</button>
      </div>
      <div v-else class="row form-group">
        <div class="col-8">
          <input type="text" v-model="name" class="form-control" placeholder="ton nom">
        </div>
        <div class="col-4">
          <button @click="join" class="btn btn-primary">Rejoindre</button>
        </div>
      </div>
      <p v-if="story && story.data.completed" class="alert alert-primary" >Histoire terminée</p>
      <p v-if="player && !player.exists" class="alert alert-primary" >Je n'ai pas encore de nom</p>
    </div>
  </div>

  <div class="row mt-5">
    <div v-if="story && player" class="col-12">
      <div class="alert alert-primary">
        <span v-if="story.data.completed">C'est terminé</span>
        <span v-else-if="player.data.myTurn">A moi de jouer !</span>
        <span v-else>Ce n'est pas mon tour</span>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col">
      <ex-cad :tokens="tokens"></ex-cad>
    </div>
  </div>
  <div class="row mt-5">
    <div class="col-4">
      <p v-if="player && player.data.myTurn"><button class="btn btn-primary" @click="play">Jouer</button></p>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Story, registerPlayer, closeStory, startStory, Player, getUID, play, updatePlayer} from '../backend'
import { ExCadMode, ExCadToken } from "../components/ExCad.vue"
import Chroma from 'chroma-js'

const StoryModule = Vue.extend({
  data() {
    return {
      story: new Story(this.$route.params.storyId),
      player: null as null | Player,
      name: '',
      myTurn: false,
      text: '',
      baduid: '',
      colors: [
        "Navy",
        "FireBrick",
        "Gold",
        "Black",
        "Green",
        "BlueViolet",
        "DarkGoldenRod",
        "Silver",
      ]
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

      if (story.data.order.length > 0) {
        keys = keys.concat(story.data.order[story.data.round])
        /* if not, the game is not started */
      }

      for(const k of keys) {
        const p = story.data.players[k]
        const color = Chroma(p.color || "#fff")
        let token: ExCadToken

        if (completed) {
          // the game is completed
          token = new ExCadToken(p.name, color, p.head, p.tail, ExCadMode.Disclosed)
        } else if (myKey === k) {
          // this row is mine
          const mode = isMyTurn ? ExCadMode.ReadyForInput : ExCadMode.Disclosed
          token = new ExCadToken(p.name, color, player.data.head, player.data.tail, mode)
        } else if(isMyTurn && k === lastPlayer) {
          // this row is just before me and i'm the current player
          token = new ExCadToken(p.name, color, "", player.data.ptail, ExCadMode.HalfHidden)
        } else {
          // this row is unrelated to me
          token = new ExCadToken(p.name, color)
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
    async setColor(color: string) {
      await updatePlayer(this.story.data.id, {color})
    },
    async closeStory (): Promise<void> {
      await closeStory(this.story.data.id)
    },
    async startStory (): Promise<void> {
      await startStory(this.story.data.id)
    }

  }
})



export default StoryModule
</script>
