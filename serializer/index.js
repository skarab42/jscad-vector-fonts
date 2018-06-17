#!/usr/bin/env node
const { name, version } = require('../package.json')
const { writeFile } = require('./fs-helpers')
const serialize = require('./serialize')
const camelCase = require('camelcase')
const program = require('commander')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

// defaults i/o paths
let inputPath = './fonts/opentype/'
let outputPath = './fonts/vector/'

// command line handler
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

// defaults params
inputPath = path.resolve(program.inputPath || inputPath)
outputPath = path.resolve(program.outputPath || outputPath)

let fontSize = program.fontSize || 500
let decimals = program.decimals || 0
let replace = !!program.replace

// check input path
if (!fs.existsSync(inputPath)) {
  console.error(`[ ERROR ] input path not found: ${inputPath}`)
  process.exit(1)
}

console.log('Input path :', inputPath)

// check output path
if (!fs.existsSync(outputPath)) {
  console.error(`[ ERROR ] output path not found: ${outputPath}`)
  process.exit(1)
}

console.log('Output path:', outputPath)

// search for opentype fonts files
const inputTypes = 'ttf|otf|woff|woff2'
const globPattern = path.normalize(`${inputPath}/**/*.@(${inputTypes})`)
const files = glob.sync(globPattern)
const filesCount = files.length

if (!filesCount) {
  console.warn(`[ WARNING ] no font file found in the input directory: ${inputPath}`)
  process.exit(1)
}

console.log('Files found:', filesCount)
console.log()

// process files found
files.forEach(file => {
  // serialize the font file
  let font = serialize({ formatName }, file)

  // test if the output file exists
  let outputFile = path.join(outputPath, `${font.name}.js`)
  let fileExists = fs.existsSync(outputFile)

  console.log('>', font.name)

  if (!replace && fileExists) {
    console.warn(`[ WARNING ] this font already exists in the output directory,`)
    console.warn(`use the "-r or --replace" flag to replace fonts that already exist.`)
  } else if (font.errors.length) {
    // print errors messages
    font.errors.forEach(message => console.error(`[ ERROR ] ${message}`))
  } else {
    // print warnings messages
    if (font.warnings.length) {
      font.warnings.forEach(message => console.warn(`[ WARNING ] ${message}`))
    }

    // remove old file
    if (fileExists) {
      fs.unlinkSync(outputFile)
    }

    // create font module
    let fontObject = font.json.replace(/\s/g, '')
    let fontModule = `${font.name}Font = ${fontObject}

if (typeof module === 'object' && module.exports) {
  module.exports = ${font.name}Font
}
`
    // write the vector font file
    writeFile(outputFile, fontModule)
  }
})

// format/clean font name
function formatName (name) {
  name = name.replace(/^1CamBam/, 'CamBam')
  return camelCase(name)
  .replace(/^([0-9])/, '_$1')
  .replace(/Normal$/, '')
}
