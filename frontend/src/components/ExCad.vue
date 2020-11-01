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
          <span class="ex_cad_span" :style="getHiddenOpacity(row.token.mode)">
            <span :style="row.fuzzyStyle">{{ row.beginning }}</span>&nbsp;
            <span :style="row.fuzzyStyle">{{ row.ending }}</span>
          </span>
          <span class="ex_cad_span" :style="getHalfHiddenOpacity(row.token.mode)">
            <span :style="row.fuzzyStyle">{{ row.beginning }}</span>&nbsp;
            <span>{{ row.token.ending }}</span>
          </span>
          <span class="ex_cad_span" :style="getDisclosedOpacity(row.token.mode)">
            <span>{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </span>
          <span class="ex_cad_span" :style="getReadyForInputOpacity(row.token.mode)">
            <input
              type="text"
              class="ex_cad_input"
              :style="row.style"
              v-model="row.token.beginning">&nbsp;|&nbsp;
            <input
              type="text"
              class="ex_cad_input"
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
  width: 700px;
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

export enum ExCadMode { Hidden, HalfHidden, Disclosed, ReadyForInput }

export class ExCadToken {
  readonly authorName: string
  readonly mode: ExCadMode
  beginning: string
  ending: string

  constructor(authorName: string, beginning: string, ending: string, mode: ExCadMode) {
    this.beginning = beginning
    this.ending = ending
    this.authorName = authorName
    this.mode = mode
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

type OpacityStyle = { readonly opacity: number }

function getOpacity(actualMode: ExCadMode, expectedMode: ExCadMode): OpacityStyle {
  return { opacity: actualMode === expectedMode ? 1.0 : 0.0 }
}

const minimalLightness = 0.2
const generatedTextLength = 20
const firstColorMinimalDifference= 80.0
const distinctColorCount = 7
const charCodeForA: number = 'a'.charCodeAt(0)
const spaceProbability = 0.3
const defaultAlpha = 0.9

function generateNiceColor(): Chroma.Color {
  const hue = 360 * Math.random()
  const lightness = (1.0 - minimalLightness) * Math.random() + minimalLightness
  return Chroma.hsl(hue, 1.0, lightness)
}

function generateColorSets(count: number): ColorSet[] {
  const colorSets = Array(count).fill(null) as ColorSet[]
  let i = 0;
  while (i < count) {
    const mainColor = generateNiceColor().alpha(defaultAlpha)
    let distinctEnough = true
    for (let j = 1; j < distinctColorCount && j <= i && distinctEnough; ++j) {
      const previousColor = colorSets[i - j].mainColor
      distinctEnough =
        Chroma.distance(previousColor, mainColor, 'lab') >=
        firstColorMinimalDifference * (distinctColorCount + 1 - j) / distinctColorCount
    }
    if (!distinctEnough)
      continue
    const mainColorIsLight = mainColor.lch()[0] > 75.0
    const blackAndWhiteColor = mainColorIsLight ? Chroma('black') : Chroma('white')
    const contrastiveColor = mainColorIsLight ? mainColor.brighten(1.5) : mainColor.darken(2.5)
    const hsl = mainColor.hsl()
    const paleColor = Chroma.hsl(hsl[0], hsl[1], hsl[2] * 0.90)
    const palerColor = Chroma.hsl(hsl[0], hsl[1], hsl[2] * 0.95)
    colorSets[i] = { mainColor, paleColor, palerColor, blackAndWhiteColor, contrastiveColor, }
    ++i
  }
  return colorSets
}

function generateText(): string {
  let text = ""
  for(let i = 0; i < generatedTextLength; i++) {
    const charCode = charCodeForA + Math.floor(26 * Math.random())
    text += String.fromCharCode(charCode)
    if (Math.random() < spaceProbability)
      text += ' '
  }
  return text
}

function generateTextSets(count: number): [string, string][] {
  return Array(count).
    fill(null).
    map(() => [generateText(), generateText()])
}

const generatedSets: ColorSet[] = generateColorSets(100)
const generatedTexts: [string, string][] = generateTextSets(100)

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
      for (const token of this.tokens) {
        const set = generatedSets[index]
        const shadowColor = set.contrastiveColor.hex('rgb')
        const style = {
          backgroundColor: set.mainColor.hex('rgba'),
          color: set.blackAndWhiteColor.hex('rgb'),
          textShadow: `-1px 0 ${shadowColor}, 0 1px ${shadowColor}, 1px 0 ${shadowColor}, 0 -1px ${shadowColor}`,
        }
        const palerColor = set.palerColor.hex('rgb')
        const fuzzyStyle = {
          backgroundColor: "none",
          color: set.paleColor.hex('rgb'),
          textShadow: `-0.5px 0 ${palerColor}, 0 0.5px ${palerColor}, 0.5px 0 ${palerColor}, 0 -0.5px ${palerColor}`,
        }
        const beginning = generatedTexts[index][0]
        const ending = generatedTexts[index][1]
        const row = { index, token, style, fuzzyStyle, beginning, ending }
        rows.push(row)
        ++index
      }
      return rows
    }
  },
  methods: {
    getHiddenOpacity: (mode: ExCadMode) => getOpacity(mode, ExCadMode.Hidden),
    getHalfHiddenOpacity: (mode: ExCadMode) => getOpacity(mode, ExCadMode.HalfHidden),
    getDisclosedOpacity: (mode: ExCadMode) => getOpacity(mode, ExCadMode.Disclosed),
    getReadyForInputOpacity: (mode: ExCadMode) => getOpacity(mode, ExCadMode.ReadyForInput),
  }
})
</script>
