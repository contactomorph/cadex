<template>
  <div>
    <h1>This is a second firebase integration example</h1>
    <button type="button" @click="changeMode">{{buttonText}}</button>
    <ex-cad :tokens="tokens" :mode="mode"></ex-cad>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ExCad, { ExCadMode, ExCadToken } from "./ExCad.vue";

const FirebaseModule2 = Vue.extend({
  data () {
    return {
      mode: ExCadMode.Waiting,
      buttonText: "Show", 
      tokens: [
        new ExCadToken("Eddy", "C'est joli", "tout ça"),
        new ExCadToken("Viviannne", "mais ça ne", "vaut pas"),
        new ExCadToken("Aurélien", "la plupart", "des applications"),
        new ExCadToken("Kiki", "qu'on trouve", "dans le commerce"),
        new ExCadToken("Lapin", "même si", "beaucoup de gens"),
        new ExCadToken("Rose", "pense que", "les amanites"),
        new ExCadToken("George", "phalloïdes", "poussent dans"),
        new ExCadToken("Fabrice", "de vaste prairies", "où les chevaux"),
      ],
    }
  },
  methods: {
    changeMode: function() {
      switch(this.mode)
      {
        case ExCadMode.Waiting:
          this.mode = ExCadMode.ReadyForInput
          this.buttonText = "Wait until my turn"
          break
        case ExCadMode.ReadyForInput:
          this.mode = ExCadMode.Disclosed
          this.buttonText = "Show results"
          break
        case ExCadMode.Disclosed:
          this.mode = ExCadMode.Waiting
          this.buttonText = "Hide"
          break
      }
    }
  },
  components: {
    ExCad,
  },
})

export default FirebaseModule2
</script>
