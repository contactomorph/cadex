<template>
  <div class="ex_cad_frame">
    <table class="ex_cad_table">
      <colgroup>
       <col span="1">
       <col span="1">
      </colgroup>
      <tr class="ex_cad_table_th"><th>Joueurs</th><th>Texte</th></tr>
      <tr v-for="row in rows" :key="row.index" :style="row.style">
        <td class="ex_cad_col1">{{ row.token.authorName }}: </td>
        <td class="ex_cad_col2">
          <span class="ex_cad_span" :style="{ opacity: row.token.mode === 0 ? 1.0 : 0.0 }">
            <span :style="row.fuzzyStyle">{{ row.beginning }}</span>&nbsp;
            <span :style="row.fuzzyStyle">{{ row.ending }}</span>
          </span>
          <span class="ex_cad_span" :style="{ opacity: row.token.mode === 1 ? 1.0 : 0.0 }">
            <span :style="row.fuzzyStyle">{{ row.beginning }}</span>&nbsp;
            <span>{{ row.token.ending }}</span>
          </span>
          <span class="ex_cad_span" :style="{ opacity: row.token.mode === 2 ? 1.0 : 0.0 }">
            <span>{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </span>
          <span class="ex_cad_span" :style="{ opacity: row.token.mode === 3 ? 1.0 : 0.0 }">
            <input
              type="text"
              class="ex_cad_input"
              :disabled="row.token.mode !== 3"
              :style="row.style"
              v-model="row.token.beginning">&nbsp;|&nbsp;
            <input
              type="text"
              class="ex_cad_input"
              :disabled="row.token.mode !== 3"
              :style="row.style"
              v-model="row.token.ending">
          </span>
        </td>
      </tr>
    </table>
  </div>
</template>

<style>
.ex_cad_frame {
  background-image: url("../assets/tile.jpg");
  background-repeat: repeat;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-weight: normal;
  font-size: 14pt;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  border-style: solid;
  border-color: black;
  border-width: 1px;
  align-content: left;
  text-align: left;
}
.ex_cad_table {
  width: 100%;
  border-spacing: 0;
}
.ex_cad_table_th {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.8);
}
.ex_cad_col1 {
  width: 20%;
  font-style: italic;
}
.ex_cad_col2 {
  text-align: left;
  position: relative;
}
.ex_cad_span {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  transition: opacity 0.4s linear;
}
.ex_cad_input {
  width: 45%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
}
</style>

<script lang="ts">
import Vue from 'vue'
import Chroma from 'chroma-js'
import PseudoGen from '../utils/PseudoGen'

export enum ExCadMode { Hidden, HalfHidden, Disclosed, ReadyForInput }

export class ExCadToken {
  readonly authorName: string
  mainColor: Chroma.Color
  mode: ExCadMode
  beginning: string
  ending: string

  constructor(authorName: string, color: Chroma.Color, beginning?: string, ending?: string, mode?: ExCadMode) {
    this.authorName = authorName
    this.beginning = beginning ?? ""
    this.ending = ending ?? ""
    this.mode = mode ?? ExCadMode.Hidden
    this.mainColor = color
  }
}

type TextColorStyle = {
  readonly backgroundColor: string;
  readonly color: string;
  readonly textShadow: string;
}

type ColorSet = {
  readonly mainColor: Chroma.Color;
  readonly paleColor: Chroma.Color;
  readonly palerColor: Chroma.Color;
  readonly blackAndWhiteColor: Chroma.Color;
  readonly contrastiveColor: Chroma.Color;
}

type ExCadRow = {
  readonly index: number;
  readonly token: ExCadToken;
  readonly beginning: string;
  readonly ending: string;
  readonly style: TextColorStyle;
  readonly fuzzyStyle: TextColorStyle;
}

const generatedTextLength = 20
const charCodeForA: number = 'a'.charCodeAt(0)
const spaceProbability = 0.3

function generateColorSet(mainColor: Chroma.Color): ColorSet {
  const mainColorIsLight = mainColor.lch()[0] > 75.0
  const blackAndWhiteColor = mainColorIsLight ? Chroma('black') : Chroma('white')
  const contrastiveColor = mainColorIsLight ? mainColor.brighten(1.5) : mainColor.darken(2.5)
  const hsl = mainColor.hsl()
  const paleColor = Chroma.hsl(hsl[0], hsl[1], hsl[2] * 0.90)
  const palerColor = Chroma.hsl(hsl[0], hsl[1], hsl[2] * 0.95)
  return { mainColor, paleColor, palerColor, blackAndWhiteColor, contrastiveColor, }
}

function generateText(gen: PseudoGen): string {
  let text = ""
  for(let i = 0; i < generatedTextLength; i++) {
    const charCode = charCodeForA + gen.nextInt(26)
    text += String.fromCharCode(charCode)
    if (gen.nextBool(spaceProbability))
      text += ' '
  }
  return text
}

export default Vue.component('ex-cad', {
  props: {
    tokens: {
      type: Array as () => ExCadToken[],
      required: true,
    }
  },
  data: function() { return {} },
  computed: {
    rows: function(): ExCadRow[] {
      let index = 0
      const rows = [] as ExCadRow[]
      for (const token of this.tokens as ExCadToken[]) {
        const set = generateColorSet(token.mainColor)
        const shadowColor = set.contrastiveColor.hex('rgb')
        const style = {
          backgroundColor: set.mainColor.alpha(0.7).hex('rgba'),
          color: set.blackAndWhiteColor.hex('rgb'),
          textShadow: `-1px 0 ${shadowColor}, 0 1px ${shadowColor}, 1px 0 ${shadowColor}, 0 -1px ${shadowColor}`,
        }
        const palerColor = set.palerColor.hex('rgb')
        const fuzzyStyle = {
          backgroundColor: "none",
          color: set.paleColor.hex('rgb'),
          textShadow: `-0.5px 0 ${palerColor}, 0 0.5px ${palerColor}, 0.5px 0 ${palerColor}, 0 -0.5px ${palerColor}`,
        }
        const gen = new PseudoGen(token.mainColor.num()).hash(index).hashText(token.authorName)
        const beginning = generateText(gen)
        const ending = generateText(gen)
        const row = { index, token, style, fuzzyStyle, beginning, ending }
        rows.push(row)
        ++index
      }
      return rows
    }
  }
})
</script>
