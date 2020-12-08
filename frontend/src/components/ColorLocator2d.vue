<template>
  <Locator2d 
    :locationX='location.xRatio'
    :locationY='location.yRatio'
    :spaceStyle='spaceStyle'
    :barStyle='barStyle'
    :pointerStyle='pointerStyle'
    @change='handleColorChange'
  ></Locator2d>
</template>

<script lang="ts">
import Locator2d, { RatioPosition, BackgroundStyle } from './Locator2d.vue'
import Vue, { PropType } from 'vue'
import Chroma, { Color } from 'chroma-js'

export type Model = 'r' | 'g' | 'b' | 'h' | 's' | 'l'

function createLeftRightHueGradient(s: number, l: number): string {
  const sp = Math.round(100 * s)
  const lp = Math.round(100 * l)
  return `linear-gradient(to right, ` +
    `hsl(0,${sp}%,${lp}%) 0%, ` +
    `hsl(60,${sp}%,${lp}%) 17%, ` +
    `hsl(120,${sp}%,${lp}%) 33%, ` +
    `hsl(180,${sp}%,${lp}%) 50%, ` +
    `hsl(240,${sp}%,${lp}%) 67%, ` +
    `hsl(300,${sp}%,${lp}%) 83%, ` +
    `hsl(0,${sp}%,${lp}%) 100%)`
}

export default Vue.component('color-locator-2d', {
  components: { Locator2d },
  props: {
    color: {
      type: Object as PropType<Color>,
      validator: function(c: Color): boolean {
        return c.darken !== undefined && c.brighten !== undefined
      },
      default: function() { return Chroma.rgb(0, 0, 0) },
    },
    model: {
      type: String as PropType<Model>,
      validator: function(m: Model): boolean {
        return ['r','g','b','h','s','l'].indexOf(m) > -1
      },
      default: 'r'
    },
  },
  data: function() { return {} },
  computed: {
    spaceStyle: function(): BackgroundStyle {
      const color = this.color as Color
      let background: string
      switch (this.model as Model) {
        case 'r': {
          const r = color.rgb()[0]
          background = `linear-gradient(to top right, rgb(${r},0,0), transparent, rgb(${r},255,255)), ` +
            `linear-gradient(to bottom right, rgb(${r},255,0), rgb(${r},0,255))`
          break
        }
        case 'g': {
          const g = color.rgb()[1]
          background = `linear-gradient(to top right, rgb(0,${g},0), transparent, rgb(255,${g},255)), ` +
            `linear-gradient(to bottom right, rgb(255,${g},0), rgb(0,${g},255))`
          break
        }
        case 'b': {
          const b = color.rgb()[2]
          background = `linear-gradient(to top right, rgb(0,0,${b}), transparent, rgb(255,255,${b})), ` +
            `linear-gradient(to bottom right, rgb(0,255,${b}), rgb(255,0,${b}))`
          break
        }
        case 'h': {
          const h = color.hsl()[0]
          background =  `linear-gradient(to right, #000, transparent, #fff), ` +
            `linear-gradient(to top, #888, hsl(${h},100%,50%))`
          break
        }
        case 's': {
          const s = color.hsl()[1]
          background = `linear-gradient(to top, #000, transparent, #fff), ` +
            createLeftRightHueGradient(s, 0.5)
          break
        }
        case 'l': {
          const l = color.hsl()[2]
          background = `linear-gradient(to top, #888, transparent),` +
            createLeftRightHueGradient(1, l)
          break
        }
      }
      return { background }
    },
    barStyle: function(): BackgroundStyle {
      const color = this.color as Color
      let background: string
      switch (this.model as Model) {
        case 'r': {
          const [, g, b] = color.rgb()
          background = `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}) )`
          break
        }
        case 'g': {
          const [r, , b] = color.rgb()
          background = `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`
          break
        }
        case 'b': {
          const [r, g, ] = color.rgb()
          background = `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`
          break
        }
        case 'h': {
          const [, s, l] = color.hsl()
          background = createLeftRightHueGradient(s, l)
          break
        }
        case 's': {
          const [h, , l] = color.hsl()
          const lp = Math.round(100 * l)
          background = `linear-gradient(to right, #888, hsl(${h},100%,${lp}%))`
          break
        }
        case 'l': {
          const [h, s, ] = color.hsl()
          const sp = Math.round(100 * s)
          background = `linear-gradient(to right, #000, hsl(${h},${sp}%,50%), #fff)`
          break
        }
      }
      return { background }
    },
    pointerStyle: function(): BackgroundStyle {
      return { background: this.color.hex() }
    },
    location: function(): RatioPosition {
      const color = this.color as Color
      switch (this.model as Model) {
        case 'r': {
          const [, g, b] = color.rgb()
          return { xRatio: b / 255, yRatio: 1 - g / 255 }
        }
        case 'g': {
          const [r, , b] = color.rgb()
          return { xRatio: b / 255, yRatio: 1 - r / 255 }
        }
        case 'b': {
          const [r, g, ] = color.rgb()
          return { xRatio: r / 255, yRatio: 1 - g / 255 }
        }
        case 'h': {
          const [, s, l] = color.hsl()
          return { xRatio: l, yRatio: 1 - s }
        }
        case 's':{
          const [h, , l] = color.hsl()
          return { xRatio: h / 360, yRatio: 1 - l }
        }
        case 'l':{
          const [h, s, ] = color.hsl()
          return { xRatio: h / 360, yRatio: 1 - s }
        }
      }
      throw new Error("Unreachable")
    },
  },
  methods: {
    handleColorChange: function(p: RatioPosition): void {
      const color = this.color as Color
      let projectedColor: Color
      switch (this.model as Model) {
        case 'r': {
          const r = color.rgb()[0]
          projectedColor = Chroma.rgb(r, 255 - p.yRatio * 255, p.xRatio * 255)
          break
        }
        case 'g': {
          const g = color.rgb()[1]
          projectedColor = Chroma.rgb(255 - p.yRatio * 255, g, p.xRatio * 255)
          break
        }
        case 'b': {
          const b = color.rgb()[2]
          projectedColor = Chroma.rgb(p.xRatio * 255, 255 - p.yRatio * 255, b)
          break
        }
        case 'h': {
          const h = color.hsl()[0]
          projectedColor = Chroma.hsl(h, 1 - p.yRatio, p.xRatio)
          break
        }
        case 's': {
          const s = color.hsl()[1]
          projectedColor = Chroma.hsl(p.xRatio * 360, s, 1 - p.yRatio)
          break
        }
        case 'l': {
          const l = color.hsl()[2]
          projectedColor = Chroma.hsl(p.xRatio * 360, 1 - p.yRatio, l)
          break
        }
      }
      this.$emit('change', projectedColor)
    },
  },
})

</script>
