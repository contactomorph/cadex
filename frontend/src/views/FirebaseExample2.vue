<template>
  <div>
    <h1>This is a second firebase integration example</h1>
    <ex-cad :tokens="tokens"></ex-cad>
    <ul>
      <li v-for="(token, num) in tokens" :key="num">
        {{token.beginning}}&nbsp;
        {{token.ending}}&nbsp;
        <button type="button" @click="changeMode(num)">{{getButtonText(num)}}</button>
      </li>
    </ul>
    <button type="button" @click="plop">Plop</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ExCad, { ExCadMode, ExCadToken } from "../components/ExCad.vue";

function toButtonText(mode: ExCadMode): string {
  switch (mode) {
    case ExCadMode.Hidden:
      return "Show half";
    case ExCadMode.HalfHidden:
      return "Show";
    case ExCadMode.Disclosed:
      return "Access";
    case ExCadMode.ReadyForInput:
      return "Hide";
  }
}

const FirebaseModule2 = Vue.extend({
  data () {
    return {
      tokens: [
        new ExCadToken("Eddy", "C'est joli", "tout ça"),
        new ExCadToken("Viviane", "mais ça ne", "vaut pas"),
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
    plop: function() {
      this.tokens.push(new ExCadToken(
        "Yienyien", "ma tête", "ma queue"
      ))
    },
    getButtonText: function(num: number): string {
      const tokens = this.tokens as ExCadToken[]
      return toButtonText(tokens[num].mode)
    },
    changeMode: function(num: number): void {
      const tokens = this.tokens as ExCadToken[]
      const token = tokens[num]
      switch(token.mode) {
        case ExCadMode.Disclosed:
          token.mode = ExCadMode.ReadyForInput
          break
        case ExCadMode.ReadyForInput:
          token.mode = ExCadMode.Hidden
          break
        case ExCadMode.Hidden:
          token.mode = ExCadMode.HalfHidden
          break
        case ExCadMode.HalfHidden:
          token.mode = ExCadMode.Disclosed
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
