<template>
  <div class='vc-color-picker'>
    <div class='vc-container'>
      <transition name='opacity'>
        <div v-if='currVisible' class='vc-mask'></div>
      </transition>
      <transition name='raise'>
      <div v-if='currVisible' class='vc-root'>
        <div class='vc-base'>
          <div class='vc-model'>
            <ul>
              <li key='r' :class='currModel === "r" ? "vc-model-selected" : ""'>
                <div @click='_ => handleModelChange("r")' style="color: #f00">&#x2B24;</div>
              </li>
              <li key='g' :class='currModel === "g" ? "vc-model-selected" : ""'>
                <div @click='_ => handleModelChange("g")' style="color: #0f0">&#x2B24;</div>
              </li>
              <li key='b' :class='currModel === "b" ? "vc-model-selected" : ""'>
                <div @click='_ => handleModelChange("b")' style="color: #00f">&#x2B24;</div>
              </li>
              <li key='h' :class='currModel === "h" ? "vc-model-selected" : ""'>
                <div @click='_ => handleModelChange("h")'>&#x1F308;</div>
              </li>
              <li key='s' :class='currModel === "s" ? "vc-model-selected" : ""'>
                <div @click='_ => handleModelChange("s")'>&#x1F317;</div>
              </li>
              <li key='l' :class='currModel === "l" ? "vc-model-selected" : ""'>
                <div @click='_ => handleModelChange("l")'>&#x1F4A1;</div>
              </li>
            </ul>
          </div>
          <div class='vc-color2d'>
            <ColorLocator2d
              :value='innerColor'
              :model='currModel'
              @input='handleColorChange'>
            </ColorLocator2d>
          </div>
          <div class='vc-buttons'>
            <button class='vc-buttons-accept' @click='handleAccept'>&#x2713;</button>
            <button class='vc-buttons-cancel' @click='handleCancel'>&#x2717;</button>
         </div>
        </div>
      </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import ColorLocator2d, { Model } from './ColorLocator2d.vue'
import Chroma, { Color } from 'chroma-js'

export default Vue.component('picker', {
  components: { ColorLocator2d },
  props: {
    color: {
      type: Object as PropType<Color>,
      default: function() { return Chroma.rgb(0, 0, 0) },
    },
    model: {
      type: String as PropType<Model>,
      validator: function(m: Model): boolean {
        return ['r','g','b','h','s','l'].indexOf(m) > -1
      },
      default: 'r',
    },
    visible: {
      type: Boolean,
      default: false,
    }
  },
  data () {
    return {
      currVisible: false,
      outerColor: Chroma.rgb(0, 0, 0),
      innerColor: Chroma.rgb(0, 0, 0),
      currModel: 'r' as Model,
    }
  },
  methods: {
    handleModelChange: function(newModel: Model): void {
      if (newModel !== this.currModel) {
        this.currModel = newModel
        this.innerColor = this.outerColor
      }
    },
    handleColorChange: function(newColor: Color): void {
      this.outerColor = newColor
    },
    handleAccept: function(): void {
      this.currVisible = false
      this.$emit('accept', this.outerColor)
    },
    handleCancel: function(): void {
      this.currVisible = false
      this.$emit('cancel')
    },
  },
  watch: {
    color: function(c: Color): void {
      this.outerColor = c
      this.innerColor = c
    },
    model: function(m: Model): void {
      this.currModel = m
    },
    visible: function(v: boolean): void {
      this.currVisible = v
    }
  },
  beforeMount: function(): void {
    this.outerColor = this.color
    this.innerColor = this.color
  }
})

</script>

<style scoped>
.vc-color-picker {
  display: inline-block;
}
.vc-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}
.vc-root {
  position: relative;
  font-family: Consolas;
  background: #fff;
  width: 100%;
  max-width: 768px;
}
.vc-root button {
  cursor: pointer;
}
.vc-base {
  transition: all 375ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
.vc-root ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.vc-root li {
  display: inline-block;
}
.vc-model ul {
  display: flex;
  justify-content: center;
}
.vc-model li {
  overflow: hidden;
  padding: 6px 0;
}
.vc-model li div {
  cursor: pointer;
  border-right: 1px solid #f0f0f0;
  background: #fff;
  text-align: center;
  color: rgba(0,0,0,0.87);
  width: 46px;
  height: 30px;
  line-height: 30px;
  box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 3px, rgba(0, 0, 0, 0.117647) 0px 1px 2px;
  transition: all 125ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
.vc-model li:first-child {
  border-radius: 4px 0 0 4px;
}
.vc-model li:first-child div {
  border-radius: 4px 0 0 4px;
}
.vc-model li:last-child {
  border-radius: 0 2px 2px 0;
}
.vc-model li:last-child div {
  border-radius: 0 2px 2px 0;
}
li.vc-model-selected div{
  cursor: default;
  color: rgba(0,0,0,0.33);
  background: #f0f0f0;
  box-shadow: rgba(0,0,0,0.18) 0 1px 1px;
}

.vc-buttons {
  font-size: 0;
}
.vc-buttons button {
  box-sizing: border-box;
  min-width: 88px;
  height: 36px;
  padding: 0 8px;
  box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;
  box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 3px, rgba(0, 0, 0, 0.117647) 0px 1px 2px;
  background: #fff;
  border-bottom: 2px;
  border: none;
  margin: 8px 0 8px 8px;
  color: rgba(0,0,0,0.87);
}
button.vc-buttons-accept {
  background: #2196f3;
  color: #fff;
}
button.vc-buttons-cancel {
  background: #2196f3;
  color: #fff;
}

.raise-enter-active {
  transition: all 375ms cubic-bezier(0.4,0,0.6,1);
}
.raise-leave-active {
	transition: all 375ms cubic-bezier(0.4,0,0.6,1);
}
.raise-enter {
	transform: translate(0, 100%);
}
.raise-leave-to {
	transform: translate(0, 100%);
}

.vc-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0,0,0,0.24);
}
.opacity-leave-active, .opacity-enter-active {
  transition: all 375ms cubic-bezier(0.4,0,0.6,1);
}
.opacity-enter {
  opacity: 0;
}
.opacity-leave-to {
  opacity: 0;
}
</style>