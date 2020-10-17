<template>
  <div class="ex_cad_frame">
    <table class="ex_cad_table">
      <colgroup>
       <col span="1" style="width:100px;">
       <col span="1">
      </colgroup>
      <tr v-for="row in getRows()" :key="row.index" :style="row.style">
        <td style="font-style: italic">{{ row.token.authorName }}: </td>
        <td>
          <template v-if="isDisclosed()">
            <span>{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </template>
          <template v-else-if="row.isAlmostLast">
            <span :style="row.fuzzyStyle">{{ row.token.beginning }}</span>&nbsp;
            <span>{{ row.token.ending }}</span>
          </template>
          <template v-else-if="row.isLast">
            <input type="text" style="width:45%; border:none; background-color:transparent" :value="row.token.beginning">&nbsp;|&nbsp;
            <input type="text" style="width:45%; border:none; background-color:transparent" :value="row.token.ending">
          </template>
          <template v-else>
            <span :style="row.fuzzyStyle">{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </template>
        </td>
      </tr>
    </table>
  </div>
</template>

<style>
.ex_cad_frame {
  width: 700px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-weight: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  border-style: solid;
  border-color: black;
  border-width: 1px;
  align-content: left;
  text-align: left;
}
</style>

<script lang="ts">
import Vue from 'vue'
import Chroma from 'chroma-js'

export enum ExCadMode { Waiting, ReadyForInput, Disclosed }

export class ExCadToken {
  readonly beginning: string
  readonly ending: string
  readonly authorName: string
  constructor(authorName: string, beginning: string, ending: string) {
    this.beginning = beginning
    this.ending = ending
    this.authorName = authorName
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
  readonly isAlmostLast: boolean;
  readonly isLast: boolean;
  readonly token: ExCadToken;
  readonly style: TextColorStyle;
  readonly fuzzyStyle: TextColorStyle;
}

const minimalLightness = 0.2
const generatedTextLength = 20
const firstColorMinimalDistinct = 60.0
const distinctColorCount = 5
const charCodeForA: number = 'a'.charCodeAt(0)

function generateNiceColor(): Chroma.Color {
  const hue = 360 * Math.random()
  const lightness = (1.0 - minimalLightness) * Math.random() + minimalLightness
  return Chroma.hsl(hue, 1.0, lightness)
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

function generateColorSets(count: number): ColorSet[] {
  const colorSets = Array(count).fill(null) as ColorSet[]
  let i = 0;
  while (i < count) {
    const mainColor = generateNiceColor().alpha(0.8)
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

const generatedSets: ColorSet[] = generateColorSets(100)

export default Vue.component('ex-cad',
{
  props: {
    tokens: {
      type: Array as () => ExCadToken[],
      required: true,
    },
    mode: {
      type: Object as () => ExCadMode,
      required: true,
    }
  },
  data: function() { return { } },
  methods: {
    transformToken: function(
      token: ExCadToken,
      isAlmostLast: boolean,
      isLast: boolean,
    ): ExCadToken {
      if (this.mode === ExCadMode.Disclosed)
        return token
      return new ExCadToken(
          token.authorName,
          isLast ? token.beginning : generateText(),
          isLast || isAlmostLast ? token.ending : generateText())
    },
    getRows: function*(): Iterable<ExCadRow> {
      let index = 0
      const length: number = this.tokens.length
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
          hsl(hsl[0], hsl[1], hsl[2] * 0.95).alpha(0.5).hex('rgba')
        const palerColor = Chroma.
          hsl(hsl[0], hsl[1], hsl[2] * 0.98).alpha(0.5).hex('rgba')
        const fuzzyStyle = {
          backgroundColor: "none",
          color: paleColor,
          textShadow: `-0.5px 0 ${palerColor}, 0 0.5px ${palerColor}, 0.5px 0 ${palerColor}, 0 -0.5px ${palerColor}`,
        }
        const isAlmostLast = index === length - 2
        const isLast = index === length - 1
        const token = this.transformToken(otoken, isAlmostLast, isLast)
        yield { index, isAlmostLast, isLast, token, style, fuzzyStyle }
        ++index
      }
    },
    isDisclosed: function(): boolean {
      return this.mode === ExCadMode.Disclosed;
    },
    isReadyForInput: function(): boolean {
      return this.mode === ExCadMode.ReadyForInput;
    }
  },
})
</script>
