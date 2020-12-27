<template>
  <div class="registr_frame">
    <table class="registr_table">
      <colgroup>
       <col span="1">
       <col span="1">
       <col span="1">
      </colgroup>
      <tr class="registr_table_th">
        <th></th>
        <th>Joueur</th>
        <th>Couleur</th>
      </tr>
      <tr v-for="row in rows" :key="row.index" :style="row.style">
        <td class="registr_col">
          <span class="registr_span" :style="{ opacity: row.token.mode === 0 || row.token.mode === 3 ? 1.0 : 0.0 }">
            {{ row.token.authorName }}
          </span>
          <span class="registr_span" :style="{ opacity: row.token.mode === 1 || row.token.mode === 2 ? 1.0 : 0.0 }">
            <input
              type="text"
              class="registr_input"
              :disabled="row.token.mode === 0 || row.token.mode === 3"
              :style="row.style"
              v-model="row.token.authorName">
          </span>
        </td>
        <td class="registr_col">
          <span class="registr_span" :style="{ opacity: row.token.mode === 1 || row.token.mode === 2 ? 1.0 : 0.0 }">
            <input
              type="button"
              class="registr_button"
              :value="'\u{1F308}'"
              :style="row.buttonStyle"
              @click="openPicker(row)">
          </span>
        </td>
        <td class="registr_col1">
          <span class="registr_span" :style="{ opacity: row.token.mode < 3 ? 1.0 : 0.0 }">
            <input
              type="button"
              class="registr_button"
              :value="row.token.mode === 0 ? '\u270e' : row.token.mode === 1 ? '\u2713' : '+'"
              @click="clickplus(row.token, row.index)"
              :style="row.buttonStyle">
          </span>
        </td>
      </tr>
    </table>
    <Picker
      :visible="pickerVisible"
      :color="pickerColor"
      @accept="pickColor"
      @cancel="pickColor">
    </Picker>
  </div>
</template>

<style>
.registr_frame {
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
.registr_table {
  width: 100%;
  border-spacing: 0;
}
.registr_table_th {
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.8);
}
.registr_col1 {
  width: 15%;
  height: 30px;
  position: relative;
}
.registr_col {
  width: 40%;
  height: 30px;
  font-style: italic;
  position: relative;
}
.registr_span {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  transition: opacity 0.4s linear;
}
.registr_input {
  width: 80%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
}
.registr_button {
  width: 90%;
  height: 25px;
  border: solid;
  border-width: 2px;
  margin: 3px;
}
</style>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Chroma, { Color } from 'chroma-js'
import Picker from './Picker.vue'

export enum RegistrationMode { Recorded, ReadyForModifying, ReadyForAdding, Locked }

const defaultAlpha = 0.9

export class RegistrationToken {
  authorName: string
  mode: RegistrationMode
  color: Color

  constructor(authorName: string, color: Color, mode?: RegistrationMode) {
    this.authorName = authorName
    this.mode = mode ?? RegistrationMode.Locked
    this.color = color
  }
}

type TextColorStyle = {
  readonly backgroundColor: string;
  readonly color: string;
  readonly textShadow: string;
}

type ButtonColorStyle = {
  readonly backgroundColor: string;
  readonly color: string;
  readonly borderColor: string;
}

type RegistrationRow = {
  readonly index: number;
  readonly token: RegistrationToken;
  readonly style: TextColorStyle;
  readonly buttonStyle: ButtonColorStyle;
}

export default Vue.component('registration', {
  components: { Picker },
  props: {
    tokens: {
      type: Array as () => RegistrationToken[],
      required: true,
    },
    clickplus: {
      type: Function as PropType<((row: RegistrationToken, num: number) => void)>,
      required: true,
    },
  }, 
  data: function() {
    return {
      pickerVisible: false,
      pickerColor: Chroma.rgb(255, 0, 0),
      selectedRow: null as RegistrationRow | null
    }
  },
  methods: {
    openPicker: function(row: RegistrationRow) {
      this.selectedRow = row
      this.pickerColor = row.token.color
      this.pickerVisible = true
    },
    pickColor: function(c: Color|undefined) {
      if (this.selectedRow && c) {
        this.selectedRow.token.color = c
      }
      this.selectedRow = null
      this.pickerVisible = false
    },
  },
  computed: {
    rows: function(): RegistrationRow[] {
      let index = 0
      const rows = [] as RegistrationRow[]
      for (const token of this.tokens as RegistrationToken[]) {
        const mainColor = token.color.alpha(defaultAlpha)
        const mainColorIsLight = mainColor.lch()[0] > 75.0
        const blackAndWhiteColor = mainColorIsLight ? Chroma('black') : Chroma('white')
        const contrastiveColor = mainColorIsLight ? mainColor.brighten(1.5) : mainColor.darken(2.5)
        const shadowColor = contrastiveColor.hex('rgb')
        const lighterColor = mainColor.brighten().hex('rgb')
        const darkerColor = mainColor.darken().hex('rgb')
        const style = {
          backgroundColor: mainColor.hex('rgba'),
          color: blackAndWhiteColor.hex('rgb'),
          textShadow: `-1px 0 ${shadowColor}, 0 1px ${shadowColor}, 1px 0 ${shadowColor}, 0 -1px ${shadowColor}`,
        }
        const buttonStyle: ButtonColorStyle = {
          backgroundColor: mainColor.hex('rgb'),
          color: blackAndWhiteColor.hex('rgb'),
          borderColor: `${lighterColor} ${darkerColor} ${darkerColor} ${lighterColor}`,
        }
        const row: RegistrationRow = { index, token, style, buttonStyle }
        rows.push(row)
        ++index
      }
      return rows
    },
  },
})
</script>
