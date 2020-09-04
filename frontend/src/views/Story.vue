<template>
  <div>
    <h1>Coucou</h1>
    <button @click="scenario">Run</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Player, Chunk, startStory, simulPlayer } from '../backend'


const StoryModule = Vue.extend({

  methods: {

    scenario () {
      // Create a new story with 4 players
      const story = startStory(4)

      // Add a new player
      const me = story.addPlayer("aurelien")

      // Get the url to share with others
      console.log(story.url)

      // Create a listener for my turn
      function myAI(me: Player, tail: string) {
        console.log("I receive <"+tail+">")
        me.play("my head", "my tail")
      }

      function newTurn(player: Player) {
        // When a new turn start
        console.log("Turn of the player "+player.name)
      }

      function theEnd(chunks: Array<Chunk>) {
        /* reveal the complete story */
        for(const chunk of chunks) {
          console.log(chunk.player.name + ":" + chunk.head + " " + chunk.tail)
        }
      }

      me.setMyTurnCallback(myAI)
      story.setNewTurnCallback(newTurn)
      story.setTheEndCallback(theEnd)

      simulPlayer("john", 2000)
      simulPlayer("bill", 3000)
      simulPlayer("mike", 4000)


    }
  }
})



export default StoryModule
</script>
