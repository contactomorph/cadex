<template>
  <div>
    <h1>This is a firebase integration example</h1>
    <p>{{ plop }}</p>
    <button @click="give">Give me a name</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as firebase from 'firebase/app'
import 'firebase/database'

const FirebaseModule = Vue.extend({
  data () {
    return {
      plop: 'empty'
    }
  },
  methods: {
    give () {
      firebase.database().ref('/').once('value').then((snapshot) => {
        this.plop = snapshot.val();
      });
    }
  }
})

export default FirebaseModule
</script>
