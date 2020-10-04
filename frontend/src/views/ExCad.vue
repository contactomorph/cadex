<template>
  <div class="ex_cad_frame">
    <table class="ex_cad_table">
      <colgroup>
       <col span="1" style="width:100px;">
       <col span="1">
      </colgroup>
      <tr v-for="row in getRows()" :key="row.index" :style="row.style">
        <th style="font-style: italic">{{ row.token.authorName }}: </th>
        <th>
          <template v-if="!isSecret">
            <span>{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </template>
          <template v-else-if="row.isLast">
            <span :style="row.fuzzyStyle">{{ row.token.beginning }}</span>&nbsp;
            <span>{{ row.token.ending }}</span>
          </template>
          <template v-else>
            <span :style="row.fuzzyStyle">{{ row.token.beginning }}&nbsp;{{ row.token.ending }}</span>
          </template>
        </th>
      </tr>
    </table>
  </div>
</template>

<style>
.ex_cad_frame {
  width: 100%;
  height: 400px;
  border-style: solid;
  border-color: black;
  border-width: 1px;
  background-size: 100%;
  background-image: url("https://static.boredpanda.com/blog/wp-content/uploads/2015/03/Teletubbies-in-Black-White-Look-Like-A-Horror-Show__700.jpg");
}
.ex_cad_table {
  width: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-weight: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  align-content: left;
  text-align: left;
}
</style>

<script lang="ts">
import Vue from 'vue'
import Chroma, { Color } from 'chroma-js'

export class ExCadToken {
  beg$: string
  ending$: string
  name$: string
  get beginning(): string { return this.beg$ }
  get ending(): string { return this.ending$ }
  get authorName(): string { return this.name$ }
  constructor(authorName: string, beginning: string, ending: string) {
    this.beg$ = beginning
    this.ending$ = ending
    this.name$ = authorName
  }
}

type ColorStyle = {
  readonly backgroundColor: string;
  readonly color: string;
  readonly textShadow: string;
}

type TextColorStyle = {
  readonly color: string;
}

type ColorSet = {
  readonly textColor: Chroma.Color;
  readonly shadowColor: Chroma.Color;
  readonly plainColor: Chroma.Color;
  readonly softenedColor: Chroma.Color;
}

type ExCadRow = {
  readonly index: number;
  readonly isLast: boolean;
  readonly token: ExCadToken;
  readonly style: ColorStyle;
  readonly fuzzyStyle: TextColorStyle;
}

function generateNiceColor(): Chroma.Color {
  const hue = 360 * Math.random()
  const lightness = 0.6 * Math.random() + 0.2
  return Chroma.hsl(hue, 1.0, lightness)
}

const charCodeForA: number = 'a'.charCodeAt(0)

function generateText(): string {
  let text = ""
  for(let i = 0; i < 20; i++) {
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
    const plainColor = generateNiceColor().alpha(0.8)
    let tooSimilar = false
    for (let j = 1; j < 5 && !tooSimilar; ++j) {
      if (i - j < 0)
        continue;
      const previousColor = colorSets[i - j].plainColor
      tooSimilar = Chroma.distance(previousColor, plainColor) < 30
    }
    if (tooSimilar) {
      console.log(`Collision for ${i}`)
      continue
    }
    const plainColorIsLight = plainColor.lch()[0] > 75.0
    const textColor = plainColorIsLight ? Chroma('black') : Chroma('white')
    const shadowColor = plainColorIsLight ? plainColor.brighten(1.5) : plainColor.darken(2.5)
    const softenedColor = plainColor.darken()
    colorSets[i] = { plainColor, textColor, shadowColor, softenedColor, }
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
    isSecret : {
      type: Boolean,
      required: true,
    }
  },
  data: function() { return { } },
  methods: {
    transformToken: function(token: ExCadToken, isLast: boolean): ExCadToken {
      if (!this.isSecret)
        return token
      return new ExCadToken(
          token.authorName,
          generateText(),
          isLast ? token.ending : generateText())
    },
    getRows: function*(): Iterable<ExCadRow> {
      let index = 0
      const length: number = this.tokens.length
      for (const otoken of this.tokens) {
        const set = generatedSets[index]
        const shadowColor = set.shadowColor.hex('rgb')
        const style = {
          backgroundColor: set.plainColor.hex('rgba'),
          color: set.textColor.hex('rgb'),
          textShadow: `-1px 0 ${shadowColor}, 0 1px ${shadowColor}, 1px 0 ${shadowColor}, 0 -1px ${shadowColor}`,
        }
        const fuzzyStyle = {
          color: set.softenedColor.hex('rgba'),
          textShadow: "none",
        }
        const isLast = index == length - 1
        const token = this.transformToken(otoken, isLast)
        yield { index, isLast, token, style, fuzzyStyle }
        ++index
      }
    }
  },
})
</script>
