import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import * as firebase from 'firebase/app'
import 'firebase/database'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

const firebaseConfig = {
  apiKey: "AIzaSyC8rR63t7K3Spv97jNn7bvlq8EHVXB479s",
  authDomain: "cadex-a057e.firebaseapp.com",
  databaseURL: "https://cadex-a057e.firebaseio.com",
  projectId: "cadex-a057e",
  storageBucket: "cadex-a057e.appspot.com",
  messagingSenderId: "633469560244",
  appId: "1:633469560244:web:1ff4dfdeef557038d47ee1"
};

firebase.initializeApp(firebaseConfig)
