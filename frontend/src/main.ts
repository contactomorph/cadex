import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import * as backend from './backend'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

backend.initialize()

