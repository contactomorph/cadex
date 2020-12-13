<template>
  <div>
    <div
        ref='spaceRef'
        class='locator-space'
        :style='spaceStyle'
        @mousedown='handleMouseDown($event, "s")'
        @touchstart='handleMouseDown($event, "s")' >
      <div class='locator-box' :style='spaceBoxStyle'>
        <div class='locator-selection' :style='pointerStyle'>
          <sup :style="{ color: characters[1].color }">{{characters[1].character}}</sup>
          <sub :style="{ color: characters[2].color }">{{characters[2].character}}</sub>
        </div>
      </div>
    </div>
    <div
        ref='barRef'
        class='locator-bar'
        :style='barStyle'
        @mousedown='handleMouseDown($event, "b")'
        @touchstart='handleMouseDown($event, "b")' >
      <div class='locator-box' :style='barBoxStyle'>
        <div
          class='locator-selection'
          :style="{ ...pointerStyle, color: characters[0].color }"
          >{{characters[0].character}}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import throttle from 'lodash/throttle'
import Vue, { PropType } from 'vue'

export class UnitPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  constructor(x: number, y: number, z: number) {
    if (x < 0 || 1 < x || y < 0 || 1 < y || z < 0 || 1 < z) {
      throw new Error(`Unvalid range for UnitPosition: (${x}, ${y}, ${z})`)
    }
    this.x = x
    this.y = y
    this.z = z
  }
  equals(p: UnitPosition): boolean {
    return this.x === p.x && this.y === p.y && this.z === p.z
  }
  static ZERO: UnitPosition = new UnitPosition(0, 0, 0)
}

export type BackgroundStyle = {
  background: string;
}

export type ColoredChar = {
  character: string;
  color: string;
}

const defaultColoredChar: ColoredChar = {
  character: "",
  color: "#000",
}

enum EventSource { None, Bar, Space }

type Locator2dState = {
  position: UnitPosition;
  source: EventSource;
}

function clamp(v: number): number {
  if (v <= 0) return 0
  else if (1 <= v) return 1
  else return v
}

function toSpaceEventPosition(
  e: MouseEvent | TouchEvent,
  container: Element,
): [number, number] {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  let xcoord: number, ycoord: number
  if (e instanceof MouseEvent) {
    xcoord = e.pageX
    ycoord = e.pageY
  } else if (e instanceof TouchEvent) {
    xcoord = e.touches[0].pageX
    ycoord = e.touches[0].pageY
  } else {
    throw new Error("Unexpected event")
  }
  xcoord -= container.getBoundingClientRect().left + window.pageXOffset
  ycoord -= container.getBoundingClientRect().top + window.pageYOffset
  const x = clamp(xcoord / containerWidth)
  const y = clamp(ycoord / containerHeight)
  return [x, y]
}

function toBarEventPosition(
  e: MouseEvent | TouchEvent,
  container: Element
): number {
  const containerWidth = container.clientWidth
  let xcoord: number
  if (e instanceof MouseEvent) {
    xcoord = e.pageX
  } else if (e instanceof TouchEvent) {
    xcoord = e.touches[0].pageX
  } else {
    throw new Error("Unexpected event")
  }
  xcoord -= container.getBoundingClientRect().left + window.pageXOffset
  return clamp(xcoord / containerWidth)
}

export default Vue.component('locator-2d', {
  props: {
    value: {
      type: UnitPosition,
      default: UnitPosition.ZERO,
    },
    characters: {
      type: Object as PropType<[ColoredChar, ColoredChar, ColoredChar]>,
      validator: function(c: [ColoredChar, ColoredChar, ColoredChar]): boolean {
        return Array.isArray(c) && c.length === 3
      },
      default: [defaultColoredChar, defaultColoredChar, defaultColoredChar],
    },
    spaceStyle: {
      type: Object as PropType<BackgroundStyle>,
      validator: function(s: BackgroundStyle): boolean {
        return typeof s.background === "string"
      },
      default: function() { return { background: "black" } },
    },
    barStyle: {
      type: Object as PropType<BackgroundStyle>,
      validator: function(s: BackgroundStyle): boolean {
        return typeof s.background === "string"
      },
      default: function() { return { background: "black" } },
    },
    pointerStyle: {
      type: Object as PropType<BackgroundStyle>,
      validator: function(s: BackgroundStyle): boolean {
        return typeof s.background === "string"
      },
      default: function() { return { background: "black" } },
    },
  },
  data: function(): Locator2dState {
    return {
      position: UnitPosition.ZERO,
      source: EventSource.None,
    }
  },
  computed: {
    spaceBoxStyle: function(): object {
      return {
        left: this.position.x * 100 + '%',
        top: this.position.y * 100 + '%',
        transition: this.source === EventSource.None ? 'all 375ms cubic-bezier(0.4,0,0.2,1)' : null,
        transform: 'translate(-30px, 10px) ' + (this.position.y > 0.78 ? 'rotate(180deg)' : ''),
      }
    },
    barBoxStyle: function(): object {
      return {
        left: this.position.z * 100 + '%',
        top: '20px',
        transition: this.source === EventSource.None ? 'all 375ms cubic-bezier(0.4,0,0.2,1)' : null,
        transform: 'translate(-30px, 0px)',
      }
    }
  },
  methods: {
    handleMouseDown: function(e: MouseEvent | TouchEvent, source: "s" | "b"): void {
      this.source = source === "s" ? EventSource.Space : EventSource.Bar
      this.handleChange(e)
      window.addEventListener('mousemove', this.handleChange)
      window.addEventListener('touchmove', this.handleChange)
      window.addEventListener('mouseup', this.handleMouseUp)
      window.addEventListener('touchend', this.handleMouseUp)
    },
    handleMouseUp: function(): void {
      this.source = EventSource.None
      window.removeEventListener('mousemove', this.handleChange)
      window.removeEventListener('touchmove', this.handleChange)
      window.removeEventListener('mouseup', this.handleMouseUp)
      window.removeEventListener('touchend', this.handleMouseUp)
    },
    handleChange: function(e: MouseEvent | TouchEvent): void {
      let p: UnitPosition
      if (this.source === EventSource.Space) {
        const [x, y] = toSpaceEventPosition(e, this.$refs.spaceRef as Element)
        p = new UnitPosition(x, y, this.position.z)
      } else {
        const z = toBarEventPosition(e, this.$refs.barRef as Element)
        p = new UnitPosition(this.position.x, this.position.y, z)
      }
      this.position = p
      this.$emit('input', p)
    },
  },
  watch: {
    value: function(p: UnitPosition): void {
      this.position = p
    },
  },
  beforeMount: function(): void {
    this.handleChange = throttle(this.handleChange, 20)
    this.position = this.value
  },
})

</script>

<style scoped>
.locator-space {
  position: relative;
  width: 100%;
  height: 200px;
  background: black;
}
.locator-bar {
  position: relative;
  margin-top: 20px;
  width: 100%;
  height: 70px;
  background: black;
}
.locator-box {
  box-sizing: border-box;
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 3px, rgba(0, 0, 0, 0.117647) 0px 1px 2px;
  width: 60px;
  height: 40px;
  padding: 4px;
  transform-origin: 30px -10px;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.locator-box::before {
  box-sizing: border-box;
  position: absolute;
  left: 20px;
  top: -20px;
  content: '';
  border-width: 10px;
  border-color: transparent transparent #fff  transparent;
  border-style: solid;
}
.locator-selection {
  box-sizing: border-box;
  height: 100%;
  border: 1px solid rgba(200,200,200,0.2);
  text-align: center;
}
</style>