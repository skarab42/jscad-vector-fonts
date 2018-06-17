const opentype = require('opentype.js')
const camelCase = require('camelcase')
const { CSG } = require('@jscad/csg')

function serialize (options, file) {
  // merge defauls and user settings
  let settings = Object.assign({
    fontSize: 50,
    decimals: 0,
    replace: false,
    formatName
  }, options || {})

  // get the opentype.js font object
  const font = opentype.loadSync(file)

  // get the font name
  const name = settings.formatName(font.names.fullName.en)

  // create output payload
  let output = {
    file, settings, font, name, warnings: [], errors: [], json: ''
  }

  // create output data
  let data = [ `height: ${settings.fontSize}` ]
  let skippedPoints = 0

  // for each glyphs
  const glyphs = font.glyphs.glyphs
  const decimals = settings.decimals
  const glyphMetrics = font.glyphs.get(font.charToGlyphIndex('w')).getMetrics()
  const scale = settings.fontSize / (glyphMetrics.yMax - glyphMetrics.yMin)
  const y = -glyphMetrics.yMin

  for (id in glyphs) {
    const glyph = glyphs[id]
    let paths = null

    if (glyph.unicode) {
      try {
        const paths = formatPaths({ decimals, scale, y }, parsePath(glyph.path))
        const advanceWidth = Math.round(glyph.advanceWidth * scale)
        data.push(`  ${glyph.unicode}: [ ${advanceWidth}, ${paths.paths} ]`)
        skippedPoints += paths.skippedPoints
      } catch (error) {
        output.errors.push(error)
      }
    }
  }

  if (skippedPoints) {
    output.warnings.push(`skipped ${skippedPoints} duplicate points`)
  }

  // format output json
  data = data.join(',\n')
  output.json = `{\n  ${data}\n}`

  // return output payload
  return output
}

// format/clean font name
function formatName (name) {
  return camelCase(name).replace(/^([0-9])/, '_$1').replace(/Normal$/, '')
}

// parse font path
function parsePath (opentypePath) {
  const commands = opentypePath.commands

  let command = null
  let paths = []
  let path = []

  for (let i = 0, il = commands.length; i < il; i++) {
    command = commands[i]

    switch (command.type) {
      case 'M': // new path
        path = new CSG.Path2D([[command.x, -command.y]], false)
        break
      case 'L': // line to
        path = path.appendPoint([command.x, -command.y])
        break
      case 'Q': // absolute quadratic Bézier
        path = path.appendBezier([
          [command.x1, -command.y1],
          [command.x1, -command.y1],
          [command.x, -command.y]
        ])
        break
      case 'C': // absolute cubic Bézier
        path = path.appendBezier([
          [command.x1, -command.y1],
          [command.x2, -command.y2],
          [command.x, -command.y]
        ])
        break
      case 'Z': // end of path
        paths.push(path)
        break
      default:
        throw new Error('Unknow PATH command [' + command.type + ']')
        break
    }
  }

  return paths
}

function formatPath (options, path) {
  let settings = Object.assign({
    scale: 1,
    decimals: 0,
    x: 0,
    y: 0
  }, options || {})

  let output = { points: [], skippedPoints: 0 }

  const decimals = settings.decimals
  const scale = settings.scale
  const points = path.points

  let lastPoint = null
  let point = null
  let [x, y] = []

  for (let i = 0, il = points.length; i < il; i++) {
    point = points[i]
    x = +((point._x + settings.x) * scale)
    y = -((point._y + settings.y) * scale)
    point = [ x.toFixed(decimals), y.toFixed(decimals) ]

    if (lastPoint && lastPoint[0] === point[0] && lastPoint[1] === point[1]) {
      output.skippedPoints++
      continue
    }

    lastPoint = point
    output.points.push(point)
  }

  output.points = output.points.join(',')

  return output
}

function formatPaths (options, paths) {
  let output = { paths: [], skippedPoints: 0 }

  for (let i = 0, il = paths.length; i < il; i++) {
    const path = formatPath(options, paths[i])
    output.skippedPoints += path.skippedPoints
    output.paths.push(path.points)
  }

  output.paths = output.paths.join(',,')

  return output
}

module.exports = serialize
