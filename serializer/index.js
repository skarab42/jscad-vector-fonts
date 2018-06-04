#!/usr/bin/env node
const { name, version } = require('../package.json')
const { makeDirectory, writeFile } = require('./fs-helpers')
const serialize = require('./serialize')
const camelCase = require('camelcase')
const program = require('commander')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

let inputPath = './fonts/opentype/'
let outputPath = './fonts/jscad/'

program
  .option('-i, --input-path   <path>', 'path to a directory containing some Opentype font files')
  .option('-o, --output-path  <path>', 'path to a directory where the vector fonts will be saved')
  .option('-s, --font-size    <int>', 'font size in pixels; default = 500', parseInt)
  .option('-d, --decimals     <int>', 'font decimals precision; default = 0', parseInt)
  .option('-r, --replace', 'replace files that already exist in the output path')
  .version(version, '-v, --version')
  .arguments('[inputPath] [outputPath]')
  .action(function (inputPath, outputPath) {
    program.inputPath = inputPath || program.inputPath
    program.outputPath = outputPath || program.outputPath
  })
  .parse(process.argv)

inputPath = path.resolve(program.inputPath || inputPath)
outputPath = path.resolve(program.outputPath || outputPath)

let fontSize = program.fontSize || 500
let decimals = program.decimals || 0
let replace = !!program.replace

if (!fs.existsSync(inputPath)) {
  console.error(`[ ERROR ] input path not found: ${inputPath}`)
  process.exit(1)
}

if (!fs.existsSync(outputPath)) {
  console.error(`[ ERROR ] output path not found: ${outputPath}`)
  process.exit(1)
}

const inputTypes = 'ttf|otf|woff|woff2'
const globPattern = path.normalize(`${inputPath}/**/*.@(${inputTypes})`)
const files = glob.sync(globPattern)
const filesCount = files.length

if (!filesCount) {
  console.warn(`[ WARNING ] no font file found in the input directory: ${inputPath}`)
  process.exit(1)
}

console.log('Input path :', inputPath)
console.log('Output path:', outputPath)
console.log('Files found:', filesCount)
console.log()

let relativePath = null
let outputFile = null
let fileExists = false
let fontName = null

files.forEach(file => {
  relativePath = path.relative(inputPath, file)
  relativePath = relativePath.replace(/\.(ttf|otf|woff|woff2)$/, '')
  relativePath = camelCase(relativePath)
  fontName = path.basename(relativePath)
  relativePath += '.jscad'
  outputFile = path.join(outputPath, relativePath)
  fileExists = fs.existsSync(outputFile)

  console.log('Serialize >', relativePath)

  if (!replace && fileExists) {
    console.warn(`[ WARNING ] this file already exists in the output directory,`)
    console.warn(`            use the "-r or --replace" flag to replace files that already exist`)
  } else {
    let font = serialize({ fontSize, decimals, replace }, file)

    if (fileExists) {
      fs.unlinkSync(outputFile)
    }

    font = `${fontName}Font = function () { return ${font} }`

    makeDirectory(outputFile)
    writeFile(outputFile, font)
  }

  console.log()
})
