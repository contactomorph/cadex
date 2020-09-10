<template>
  <table class="ex_cad_frame">
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
//import Chroma from 'chroma-js'

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
  backgroundColor: string;
  color: string;
}

type TextColorStyle = {
  color: string;
}

type ColorSet = {
  textColor: string;
  plainColor: string;
  softenedColor: string;
}

type ExCadRow = {
  index: number;
  isLast: boolean;
  token: ExCadToken;
  style: ColorStyle;
  fuzzyStyle: TextColorStyle;
}

function generateNiceColor(isDark: boolean): [number, number, number] {
  const color: [number, number, number] = [0, 0, 0]
  const offset = isDark ? 64 : 0
  const j = Math.floor(3 * Math.random())
  for (let i = 0; i < 3; i++)
  {
    if (i == j)
      color[i] = isDark ? 0 : 255
    else
      color[i] = Math.floor(192 * Math.random()) + offset
  }
  return color
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

const generatedSets: ColorSet[] =
  Array(1000).fill(null).map(() => {
    const isBgDark = Math.random() > 0.5
    const bcolor = generateNiceColor(isBgDark)
    const tcolor = isBgDark ? "white" : "black"
    const scolor: [number, number, number] = [0, 0, 0]
    scolor[0] = Math.floor(bcolor[0] * 0.75)
    scolor[1] = Math.floor(bcolor[1] * 0.75)
    scolor[2] = Math.floor(bcolor[2] * 0.75)
    return {
      plainColor: `rgb(${bcolor[0]}, ${bcolor[1]}, ${bcolor[2]})`,
      textColor: tcolor,
      softenedColor: `rgb(${scolor[0]}, ${scolor[1]}, ${scolor[2]})`,
    }
  })

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
        const style = {
          backgroundColor: set.plainColor,
          color: set.textColor,
        }
        const fuzzyStyle = {
          color: set.softenedColor,
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
