<template>
<div id="app" class="container">
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="#">Cadex</a>

    <div>
      <ul class="navbar-nav">
        <li class="nav-item"><router-link :to="{name: 'Home'}" class="nav-link">
            <i class="bi bi-house-fill"></i>&nbsp;<span class="collapseme">Home</span>
        </router-link></li>
        <li class="nav-item"><router-link :to="{name: 'Demo'}" class="nav-link">
            <i class="bi bi-layers-fill"></i>&nbsp;<span class="collapseme">Component Demo</span>
        </router-link></li>
        <li class="nav-item"><router-link :to="{name: 'About'}" class="nav-link">
            <i class="bi bi-info-square-fill"></i>&nbsp;<span class="collapseme">About</span>
        </router-link></li>
      </ul>
    </div>
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

.navbar-nav {
    flex-direction: row!important;
}

@media (max-width: 992px) {
    .collapseme {
        font-size: 0px;
    }
}


</style>
