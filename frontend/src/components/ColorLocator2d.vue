<template>
  <Locator2d 
    :value='position'
    :characters='characters'
    @input='handlePositionChange'
    :spaceStyle='styles.space'
    :barStyle='styles.bar'
    :pointerStyle='styles.pointer'
  ></Locator2d>
</template>

<script lang="ts">
import Locator2d, { UnitPosition, BackgroundStyle, ColoredChar } from './Locator2d.vue'
import Vue, { PropType } from 'vue'
import Chroma, { Color } from 'chroma-js'

export type LocatorStyle = {
  space: BackgroundStyle;
  bar: BackgroundStyle;
  pointer: BackgroundStyle;
}

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

function toPosition(color: Color, model: Model): UnitPosition {
  switch (model) {
    case 'r': {
      const [r, g, b] = color.rgb()
      return new UnitPosition(g / 255, 1 - b / 255, r / 255)
    }
    case 'g': {
      const [r, g, b] = color.rgb()
      return new UnitPosition(b / 255, 1 - r / 255, g / 255)
    }
    case 'b': {
      const [r, g, b] = color.rgb()
      return new UnitPosition(r / 255, 1 - g / 255, b / 255)
    }
    case 'h': {
      const [h, s, l] = color.hsl()
      return new UnitPosition(l, 1 - s, h / 360)
    }
    case 's':{
      const [h, s, l] = color.hsl()
      return new UnitPosition(h / 360, 1 - l, s)
    }
    case 'l':{
      const [h, s, l] = color.hsl()
      return new UnitPosition(h / 360, 1 - s, l)
    }
  }
  throw new Error("Unreachable")
}

function toColor(p: UnitPosition, model: Model): Color {
  switch (model as Model) {
    case 'r': {
      return Chroma.rgb(255 * p.z, p.x * 255, 255 - p.y * 255)
    }
    case 'g': {
      return Chroma.rgb(255 - p.y * 255, 255 * p.z, p.x * 255)
    }
    case 'b': {
      return Chroma.rgb(p.x * 255, 255 - p.y * 255, p.z * 255)
    }
    case 'h': {
      return Chroma.hsl(p.z * 360, 1 - p.y, p.x)
    }
    case 's': {
      return Chroma.hsl(p.x * 360, p.z, 1 - p.y)
    }
    case 'l': {
      return Chroma.hsl(p.x * 360, 1 - p.y, p.z)
    }
  }
  throw new Error("Unreachable")
}

const redChar = { character: "\u2B24", color: "#f00", }
const greenChar = { character: "\u2B24", color: "#0f0", }
const blueChar = { character: "\u2B24", color: "#00f", }
const hueChar = { character: "\u{1F308}", color: "#000", }
const satChar = { character: "\u{1F317}", color: "#000", }
const lightChar = { character: "\u{1F4A1}", color: "#000", }


export default Vue.component('color-locator-2d', {
  components: { Locator2d },
  props: {
    value: {
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
  data: function() {
    return {
      position: UnitPosition.ZERO,
      color: Chroma.rgb(0, 0, 0),
    }
  },
  computed: {
    characters: function(): [ColoredChar, ColoredChar, ColoredChar] {
      switch (this.model as Model) {
        case 'r': return [redChar, blueChar, greenChar]
        case 'g': return [greenChar, redChar, blueChar]
        case 'b': return [blueChar, greenChar, redChar]
        case 'h': return [hueChar, satChar, lightChar]
        case 's': return [satChar, lightChar, hueChar]
        case 'l': return [lightChar, satChar, hueChar]
        default:
          throw new Error(`Unknown model: ${this.model}`)
      }
    },
    styles: function(): LocatorStyle {
      const color = this.color as Color
      let sb: string, bb: string
      switch (this.model as Model) {
        case 'r': {
          const [r, g, b] = color.rgb()
          sb = `linear-gradient(to top right, rgb(${r},0,0), transparent, rgb(${r},255,255)), ` +
            `linear-gradient(to bottom right, rgb(${r},0,255), rgb(${r},255,0))`
          bb = `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}) )`
          break
        }
        case 'g': {
          const [r, g, b] = color.rgb()
          sb = `linear-gradient(to top right, rgb(0,${g},0), transparent, rgb(255,${g},255)), ` +
            `linear-gradient(to bottom right, rgb(255,${g},0), rgb(0,${g},255))`
          bb = `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`
          break
        }
        case 'b': {
          const [r, g, b] = color.rgb()
          sb = `linear-gradient(to top right, rgb(0,0,${b}), transparent, rgb(255,255,${b})), ` +
            `linear-gradient(to bottom right, rgb(0,255,${b}), rgb(255,0,${b}))`
          bb = `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`
          break
        }
        case 'h': {
          const [h, s, l] = color.hsl()
          sb =  `linear-gradient(to right, #000, transparent, #fff), ` +
            `linear-gradient(to top, #888, hsl(${h},100%,50%))`
          bb = createLeftRightHueGradient(s, l)
          break
        }
        case 's': {
          const [h, s, l] = color.hsl()
          const lp = Math.round(100 * l)
          sb = `linear-gradient(to top, #000, transparent, #fff), ` +
            createLeftRightHueGradient(s, 0.5)
          bb = `linear-gradient(to right, hsl(${h},0%,${lp}%), hsl(${h},100%,${lp}%))`
          break
        }
        case 'l': {
          const [h, s, l] = color.hsl()
          const sp = Math.round(100 * s)
          sb = `linear-gradient(to top, #888, transparent),` +
            createLeftRightHueGradient(1, l)
          bb = `linear-gradient(to right, #000, hsl(${h},${sp}%,50%), #fff)`
          break
        }
        default:
          throw new Error(`Unknown model: ${this.model}`)
      }
      return {
        space: { background: sb },
        bar: { background: bb },
        pointer: { background: color.hex() },
      }
    },
  },
  methods: {
    handlePositionChange: function(p: UnitPosition): void {
      if (!p.equals(this.position)) {
        this.position = p
        const c = toColor(p, this.model as Model)
        if (this.color.num() !== c.num()) {
          this.color = c
          this.$emit('input', c)
        }
      }
    },
  },
  watch: {
    value: function(c: Color): void {
      if (c.num() !== this.color.num()) {
        this.color = c
        this.position = toPosition(c, this.model as Model)
      }
    },
    model: function(m: Model): void {
      this.position = toPosition(this.color, m as Model)
    },
  },
  beforeMount: function(): void {
    this.color = this.value
    this.position = toPosition(this.value, this.model as Model)
  },
})

</script>
