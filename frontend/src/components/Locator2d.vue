<template>
  <div>
    <div
        ref='root'
        class='locator-space'
        :class='{disabled: disabled}'
        :style='spaceStyle'
        @mousedown='handleMouseDown'
        @touchstart='handleMouseDown' >
      <div class='locator-box' :style='boxStyle'>
        <div class='locator-selection' :style='pointerStyle'></div>
      </div>
    </div>
    <div class='locator-bar' :style='barStyle'></div>
  </div>
</template>

<script lang="ts">
import throttle from 'lodash/throttle'
import Vue, { PropType } from 'vue'

export type RatioPosition = {
  xRatio: number;
  yRatio: number;
}
export type BackgroundStyle = {
  background: string;
}
type Locator2dState = {
  x: number;
  y: number;
  active: boolean;
}

function calcEventPosition(e: MouseEvent | TouchEvent, container: Element): RatioPosition {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  let x: number, y: number
  if (e instanceof MouseEvent) {
    x = e.pageX
    y = e.pageY
  } else if (e instanceof TouchEvent) {
    x = e.touches[0].pageX
    y = e.touches[0].pageY
  } else {
    throw new Error("Unexpected event")
  }
  let left = x - (container.getBoundingClientRect().left + window.pageXOffset)
  let top = y - (container.getBoundingClientRect().top + window.pageYOffset)

  left = left < 0 ? 0 : left
  left = left > containerWidth ? containerWidth : left
  top = top < 0 ? 0 : top 
  top = top > containerHeight ? containerHeight : top

  return {
    xRatio: left / containerWidth,
    yRatio: top / containerHeight
  }
}

export default Vue.component('locator-2d', {
  props: {
    locationX: {
      type: Number,
      default: 0,
    },
    locationY: {
      type: Number,
      default: 0,
    },
    disabled: {
      type: Boolean,
      default: false,
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
    return { x: 0, y: 0, active: false }
  },
  computed: {
    boxStyle: function(): object {
      return {
        left: this.x * 100 + '%',
        top: this.y * 100 + '%',
        transition: this.active ? null : 'all 375ms cubic-bezier(0.4,0,0.2,1)',
        transform: 'translate(-30px, 10px) ' + (this.y > 0.78 ? 'rotate(180deg)' : ''),
      }
    }
  },
  methods: {
    handleMouseDown: function(e: MouseEvent | TouchEvent): void {
      this.active = true
      this.handleChange(e)
      window.addEventListener('mousemove', this.handleChange)
      window.addEventListener('touchmove', this.handleChange)
      window.addEventListener('mouseup', this.handleMouseUp)
      window.addEventListener('touchend', this.handleMouseUp)
    },
    handleMouseUp: function(): void {
      this.active = false
      window.removeEventListener('mousemove', this.handleChange)
      window.removeEventListener('touchmove', this.handleChange)
      window.removeEventListener('mouseup', this.handleMouseUp)
      window.removeEventListener('touchend', this.handleMouseUp)
    },
    handleChange: function(e: MouseEvent | TouchEvent): void {
      const position = calcEventPosition(e, this.$refs.root as Element)
      this.x = position.xRatio 
      this.y = position.yRatio
      this.$emit('change', position)
    },
  },
  watch: {
    locationX: function(v: number): void {
      this.x = v
    },
    locationY: function(v: number): void {
      this.y = v
    },
  },
  beforeMount: function(): void {
    this.handleChange = throttle(this.handleChange, 20)
    this.x = this.locationX
    this.y = this.locationY
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
  height: 30px;
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
}
</style>