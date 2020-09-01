<template>
  <div>
    <h1>This is a firebase integration example</h1>
    <p>{{ aword }}</p>
    <input v-model="word" type="text"/>
    <button @click="send">Send a word</button>
    <button @click="give">Give me a word</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as firebase from 'firebase/app'
import 'firebase/database'

const FirebaseModule = Vue.extend({
  data () {
    return {
      aword: null,
      word: null
    }
  },
  methods: {
    give () {
      firebase.database().ref('/words').once('value').then((snapshot) => {
        const words = Object.keys(snapshot.val())
        const i = Math.floor(Math.random() * words.length)
        this.aword = words[i]
      });
    },
    send () {
      firebase.database().ref('/words/'+this.word).set(true).then(() => {
        this.word = ''
      })
    }
  }
})

export default FirebaseModule
</script>
