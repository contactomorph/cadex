import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Stories from '../views/Stories.vue'
import Story from '../views/Story.vue'
import Demo from '../views/Demo.vue'
Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: {name: 'Home'}
  },
  {
    path: '/stories',
    name: 'Home',
    component: Stories
  },
  {
    path: '/stories/:storyId',
    name: 'Story',
    component: Story
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
