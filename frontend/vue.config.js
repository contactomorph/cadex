// vue.config.js
module.exports = {
  // https://cli.vuejs.org/guide/troubleshooting.html#symbolic-links-in-node-modules
  chainWebpack: (config) => {
    config.resolve.symlinks(false)
  }
}
