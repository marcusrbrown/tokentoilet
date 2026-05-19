module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'viem' && pkg.dependencies?.ws === '8.18.3') {
        pkg.dependencies.ws = '8.20.1'
      }
      if (pkg.name === 'isows' && pkg.peerDependencies?.ws === '*') {
        pkg.peerDependencies.ws = '>=8.20.1'
      }
      return pkg
    },
  },
}
