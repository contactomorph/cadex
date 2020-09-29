import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import Firebase from '../views/FirebaseExample.vue'
import Stories from '../views/Stories.vue'
import Story from '../views/Story.vue'
import Firebase2 from '../views/FirebaseExample2.vue'
Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/firebase',
    name: 'Firebase',
    component: Firebase
  },
  {
    path: '/stories',
    name: 'Stories',
    component: Stories
  },
  {
    path: '/stories/:storyId',
    name: 'Story',
    component: Story
  },
  {
    path: '/firebase2',
    name: 'Firebase2',
    component: Firebase2
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
