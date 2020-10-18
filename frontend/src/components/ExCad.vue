<template>
  <div class="ex_cad_frame">
    <table class="ex_cad_table">
      <colgroup>
       <col span="1">
       <col span="1">
      </colgroup>
      <tr class="ex_cad_table_th"><th>Joueurs</th><th>Texte</th></tr>
      <tr v-for="row in getRows()" :key="row.index" :style="row.style">
        <td class="ex_cad_col1">{{ row.token.authorName }}: </td>
        <td class="ex_cad_col2">
          <template v-if="row.token.isDisclosed()">
            <span>{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </template>
          <template v-else-if="row.token.isHalfHidden()">
              <span :style="row.fuzzyStyle">{{ row.token.beginning }}</span>&nbsp;
              <span>{{ row.token.ending }}</span>
          </template>
          <template v-else-if="row.token.isHidden()">
              <span :style="row.fuzzyStyle">{{ row.token.beginning }}</span>&nbsp;
              <span :style="row.fuzzyStyle">{{ row.token.ending }}</span>
          </template>
          <template v-else>
              <input type="text" class="ex_cad_input" :style="row.style" :value="row.token.beginning">&nbsp;|&nbsp;
              <input type="text" class="ex_cad_input" :style="row.style" :value="row.token.ending">
          </template>
        </td>
      </tr>
    </table>
  </div>
</template>

<style>
.ex_cad_frame {
  width: 700px;
  background-image: url("https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX1171229.jpg");
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
  readonly beginning: string
  readonly ending: string
  readonly authorName: string
  readonly mode: ExCadMode
  constructor(authorName: string, beginning: string, ending: string, mode: ExCadMode) {
    this.beginning = beginning
    this.ending = ending
    this.authorName = authorName
    this.mode = mode
  }
  changeMode(mode: ExCadMode): ExCadToken {
    return new ExCadToken(
      this.authorName,
      this.beginning,
      this.ending,
      mode)
  }
  isDisclosed(): boolean {
    return this.mode === ExCadMode.Disclosed
  }
  isHalfHidden(): boolean {
    return this.mode === ExCadMode.HalfHidden
  }
  isHidden(): boolean {
    return this.mode === ExCadMode.Hidden
  }
  isReadyForInput(): boolean {
    return this.mode === ExCadMode.ReadyForInput
  }
}

type TextColorStyle = {
  readonly backgroundColor: string;
  readonly color: string;
  readonly textShadow: string;
}

type ColorSet = {
  readonly mainColor: Chroma.Color;
  readonly blackAndWhiteColor: Chroma.Color;
  readonly contrastiveColor: Chroma.Color;
}

type ExCadRow = {
  readonly index: number;
  readonly token: ExCadToken;
  readonly style: TextColorStyle;
  readonly fuzzyStyle: TextColorStyle;
}

const minimalLightness = 0.2
const generatedTextLength = 20
const firstColorMinimalDistinct = 60.0
const distinctColorCount = 5
const charCodeForA: number = 'a'.charCodeAt(0)
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
    let tooSimilar = false
    for (let j = 1; j < distinctColorCount && !tooSimilar; ++j) {
      if (i < j)
        continue;
      const previousColor = colorSets[i - j].mainColor
      tooSimilar =
        Chroma.distance(previousColor, mainColor, 'lab') <
        firstColorMinimalDistinct * (j + 1) / distinctColorCount
    }
    if (tooSimilar) {
      console.log(`Collision for ${i}`)
      continue
    }
    const mainColorIsLight = mainColor.lch()[0] > 75.0
    const blackAndWhiteColor = mainColorIsLight ? Chroma('black') : Chroma('white')
    const contrastiveColor = mainColorIsLight ? mainColor.brighten(1.5) : mainColor.darken(2.5)
    colorSets[i] = { mainColor, blackAndWhiteColor, contrastiveColor, }
    ++i
  }
  return colorSets
}

function generateText(): string {
  let text = ""
  for(let i = 0; i < generatedTextLength; i++) {
    const charCode = charCodeForA + Math.floor(26 * Math.random())
    text += String.fromCharCode(charCode)
    if (Math.random() > 0.7)
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

export default Vue.component('ex-cad',
{
  props: {
    tokens: {
      type: Array as () => ExCadToken[],
      required: true,
    }
  },
  data: function() { return { } },
  methods: {
    transformToken: function(
      token: ExCadToken,
      index: number,
    ): ExCadToken {
      switch (token.mode) {
        case ExCadMode.Disclosed:
        case ExCadMode.ReadyForInput:
          return token
        case ExCadMode.HalfHidden:
          return new ExCadToken(
              token.authorName,
              generatedTexts[index][0],
              token.ending,
              token.mode)
        case ExCadMode.Hidden:
          return new ExCadToken(
              token.authorName,
              generatedTexts[index][0],
              generatedTexts[index][1],
              token.mode)
      }
    },
    getRows: function*(): Iterable<ExCadRow> {
      let index = 0
      for (const otoken of this.tokens) {
        const set = generatedSets[index]
        const shadowColor = set.contrastiveColor.hex('rgb')
        const style = {
          backgroundColor: set.mainColor.hex('rgba'),
          color: set.blackAndWhiteColor.hex('rgb'),
          textShadow: `-1px 0 ${shadowColor}, 0 1px ${shadowColor}, 1px 0 ${shadowColor}, 0 -1px ${shadowColor}`,
        }
        const hsl = set.mainColor.hsl()
        const paleColor = Chroma.
          hsl(hsl[0], hsl[1], hsl[2] * 0.90).hex('rgb')
        const palerColor = Chroma.
          hsl(hsl[0], hsl[1], hsl[2] * 0.95).hex('rgb')
        const fuzzyStyle = {
          backgroundColor: "none",
          color: paleColor,
          textShadow: `-0.5px 0 ${palerColor}, 0 0.5px ${palerColor}, 0.5px 0 ${palerColor}, 0 -0.5px ${palerColor}`,
        }
        const token = this.transformToken(otoken, index)
        yield { index, token, style, fuzzyStyle }
        ++index
      }
    },
  },
})
</script>
