const path = require('path')
const fs = require('fs')

const makeDirectory = function (dirPath) {
  dirPath = path.dirname(dirPath)
  if (fs.existsSync(dirPath)) return
  makeDirectory(dirPath)
  fs.mkdirSync(dirPath)
}

const writeFile = function (file, data, options) {
  if (fs.existsSync(file)) fs.unlinkSync(file)
  return fs.writeFileSync(file, data, options)
}

module.exports = { makeDirectory, writeFile }
