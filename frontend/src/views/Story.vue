<template>
  <div>
    <h1>Coucou</h1>
    <div>
      <button @click="scenario">Run</button>
      <span>Id: </span>
      <span> {{ storyUrl }} </span>
    </div>
    <div>{{ previous }}</div>
    <div>{{ message  }}</div>
    <div>
      <span>{{ previous }}</span>
      <input v-model="head" type="text" placeholder="la suite">
      <input v-model="tail" type="text" placeholder="la fin">
      <button @click="post">Play</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Story, Player, Chunk } from '../backend'


/* Simulate the game */

function AI(me: Player, tail: string) {
  me.play("("+tail+")" + me.name + " head", me.name + " tail")
}

function simulPlayer(story: Story, name: string, add: number) {
  setTimeout(function() {
    const player = story.addPlayer(name)
    player.setMyTurnCallback(AI)
  }, add)
}

let me: Player|null = null

const StoryModule = Vue.extend({
  data() {
    return {
      previous: "",
      message: "No story",
      head: "",
      tail: "",
      storyUrl: "",
    }
  },
  methods: {
    post() {
      if(me) {
        me.play(this.head, this.tail)
      }
    },
    scenario () {
      // Create a new story with 4 players
      this.message = "Let's start a new story"
      const story = new Story()
      story.startRegistration(4)
      this.storyUrl = story.url

      // Get the url to share with others
      console.log(story.url)

      // Add a new player
      me = story.addPlayer("aurelien")

      // Create a listener for my turn
      const myTurn = (me: Player, tail: string) => {
        this.message = "This is my turn !!!"
        this.previous = tail
      }

      const turn = (player: Player) => {
        // When a new turn start
        console.log("Turn of the player "+player.name)
      }

      const theEnd = (chunks: Array<Chunk>) => {
        /* reveal the complete story */
        this.message = "The story is over"
        for(const chunk of chunks) {
          console.log(chunk.player.name + ":" + chunk.head + " " + chunk.tail)
        }
      }

      me.setMyTurnCallback(myTurn)
      story.setTurnCallback(turn)
      story.setTheEndCallback(theEnd)

      simulPlayer(story, "john", 2000)
      simulPlayer(story, "bill", 3000)
      simulPlayer(story, "mike", 4000)


    }
  }
})



export default StoryModule
</script>
