<template>
  <div>
    <h1>This is a second firebase integration example</h1>
    <button type="button" @click="invert">{{buttonText}}</button>
    <ex-cad :tokens="tokens" :isSecret="isSecret"></ex-cad>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ExCad, { ExCadToken } from "./ExCad.vue";

const FirebaseModule2 = Vue.extend({
  data () {
    return {
      isSecret: true,
      buttonText: "Show", 
      tokens: [
        new ExCadToken("Eddy", "C'est joli", "tout ça"),
        new ExCadToken("Vivianne", "mais ça ne", "vaut pas"),
        new ExCadToken("Aurélien", "la plupart", "des applications"),
        new ExCadToken("Kiki", "qu'on trouve", "dans le commerce"),
      ],
    }
  },
  methods: {
    invert: function() {
      this.isSecret = !this.isSecret
      this.buttonText = this.isSecret ? "Show" : "Hide"
    }
  },
  components: {
    ExCad,
  },
})

export default FirebaseModule2
</script>
