import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "bootstrap-icons/font/bootstrap-icons.css";

import * as backend from './backend'

Vue.config.productionTip = false

backend.initialize()

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
