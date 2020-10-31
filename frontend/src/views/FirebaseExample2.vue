<template>
  <div>
    <h1>This is a second firebase integration example</h1>
    <button type="button" @click="changeMode">{{buttonText}}</button>
    <ex-cad :tokens="tokens"></ex-cad>
    <ul>
      <li v-for="(token, num) in tokens" :key="num">{{token.beginning}}&nbsp;{{token.ending}}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ExCad, { ExCadMode, ExCadToken } from "../components/ExCad.vue";

const FirebaseModule2 = Vue.extend({
  data () {
    return {
      buttonText: "Access",
      mode: ExCadMode.Disclosed,
      tokens: [
        new ExCadToken("Eddy", "C'est joli", "tout ça", ExCadMode.Disclosed),
        new ExCadToken("Viviane", "mais ça ne", "vaut pas", ExCadMode.Disclosed),
        new ExCadToken("Aurélien", "la plupart", "des applications", ExCadMode.Disclosed),
        new ExCadToken("Kiki", "qu'on trouve", "dans le commerce", ExCadMode.Disclosed),
        new ExCadToken("Lapin", "même si", "beaucoup de gens", ExCadMode.Disclosed),
        new ExCadToken("Rose", "pense que", "les amanites", ExCadMode.Disclosed),
        new ExCadToken("George", "phalloïdes", "poussent dans", ExCadMode.Disclosed),
        new ExCadToken("Fabrice", "de vaste prairies", "où les chevaux", ExCadMode.Disclosed),
      ],
    }
  },
  methods: {
    changeMode: function() {
      switch(this.mode) {
        case ExCadMode.Disclosed:
          this.mode = ExCadMode.ReadyForInput
          this.buttonText = "Hide"
          break
        case ExCadMode.ReadyForInput:
          this.mode = ExCadMode.Hidden
          this.buttonText = "Show half"
          break
        case ExCadMode.Hidden:
          this.mode = ExCadMode.HalfHidden
          this.buttonText = "Show all"
          break
        case ExCadMode.HalfHidden:
          this.mode = ExCadMode.Disclosed
          this.buttonText = "Access"
          break
      }
      const newTokens = [] as ExCadToken[]
      for (const token of this.tokens as ExCadToken[])
        newTokens.push(token.changeMode(this.mode))
      this.tokens = newTokens
    }
  },
  components: {
    ExCad,
  },
})

export default FirebaseModule2
</script>
