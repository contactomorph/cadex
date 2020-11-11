<template>
  <div>
    <h1>Components demonstration</h1>
    <ex-cad :tokens="tokens"></ex-cad>
    <ul>
      <li v-for="(token, num) in tokens" :key="num">
        {{token.beginning}}&nbsp;
        {{token.ending}}&nbsp;
        <button type="button" @click="changeMode(num)">{{getButtonText(num)}}</button>
      </li>
    </ul>
    <button type="button" @click="addToken">Add new line</button>
    
    <registration :tokens="rtokens" :clickplus="clickplus"></registration>
    <ul>
      <li v-for="(rtoken, num) in rtokens" :key="num">
        {{rtoken.authorName}}&nbsp;
        <button type="button" @click="changeRMode(num)">{{getRButtonText(num)}}</button>
      </li>
    </ul>
    <button type="button" @click="addRToken">Add new line</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ExCad, { ExCadMode, ExCadToken } from "../components/ExCad.vue";
import Registration, { RegistrationMode, RegistrationToken } from '../components/Registration.vue';
import Chroma from 'chroma-js'

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

function toRButtonText(mode: RegistrationMode): string {
  switch (mode) {
    case RegistrationMode.Locked:
      return "Access";
    case RegistrationMode.ReadyForModifying:
      return "Pretend new";
    case RegistrationMode.ReadyForAdding:
      return "Validate";
    case RegistrationMode.Recorded:
      return "Lock";
  }
}

const Demo = Vue.extend({
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
      rtokens: [
        new RegistrationToken("Eddy", Chroma.rgb(255, 64, 0)),
        new RegistrationToken("Viviane", Chroma.rgb(128, 128, 0)),
        new RegistrationToken("Aurélien", Chroma.rgb(0, 196, 0)),
        new RegistrationToken("Kiki", Chroma.rgb(0, 64, 128)),
        new RegistrationToken("Lapin", Chroma.rgb(196, 128, 196), RegistrationMode.ReadyForAdding),
      ],
    }
  },
  methods: {
    addToken: function() {
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
    },
    addRToken: function() {
      this.rtokens.push(new RegistrationToken(
        "Yienyien", Chroma.rgb(196, 196, 128)
      ))
    },
    getRButtonText: function(num: number): string {
      const rtokens = this.rtokens as RegistrationToken[]
      return toRButtonText(rtokens[num].mode)
    },
    changeRMode: function(num: number): void {
      const rtokens = this.rtokens as RegistrationToken[]
      const rtoken = rtokens[num]
      switch(rtoken.mode) {
        case RegistrationMode.Locked:
          rtoken.mode = RegistrationMode.ReadyForModifying
          break
        case RegistrationMode.ReadyForModifying:
          rtoken.mode = RegistrationMode.ReadyForAdding
          break
        case RegistrationMode.ReadyForAdding:
          rtoken.mode = RegistrationMode.Recorded
          break
        case RegistrationMode.Recorded:
          rtoken.mode = RegistrationMode.Locked
          break
      }
    },
    clickplus(rtoken: RegistrationToken): void {
      if (rtoken.mode === RegistrationMode.Locked)
        rtoken.mode = RegistrationMode.ReadyForModifying
      else
        rtoken.mode = RegistrationMode.Locked
    },
  },
  components: {
    ExCad,
    Registration,
  },
})

export default Demo
</script>
