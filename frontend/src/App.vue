<template>
<div id="app">
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="#">Cadex</a>

    <ul class="navbar-nav">
      <li class="nav-item"><router-link :to="{name: 'Home'}" class="nav-link">Home</router-link></li>
      <li class="nav-item"><router-link :to="{name: 'Demo'}" class="nav-link">Component Demo</router-link></li>
      <li class="nav-item"><router-link :to="{name: 'About'}" class="nav-link">About</router-link></li>
    </ul>
  </nav>
  <div class="container mt-3">
    <router-view/>
  </div>
</div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#nav a {
}

#nav a.router-link-exact-active {
}
</style>
