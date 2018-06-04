const opentype = require('opentype.js')
const { CSG } = require('@jscad/csg')

let skippedPoints = 0

module.exports = function (options, file) {
  if (typeof options === 'string') {
    file = options
    options = null
  }

  let settings = Object.assign({
    fontSize: 50,
    decimals: 0,
    replace: false
  }, options || {})

  const font = opentype.loadSync(file)
  const glyphs = font.glyphs.glyphs
  const decimals = settings.decimals
  const glyphIndex = font.charToGlyphIndex('w')
  const glyphTest = font.glyphs.get(glyphIndex)
  const glyphMetrics = glyphTest.getMetrics()
  const sxHeight = glyphMetrics.yMax - glyphMetrics.yMin
  const scale = settings.fontSize / sxHeight
  const y = -glyphMetrics.yMin

  let id = null
  let glyph = null
  let paths = null
  let advanceWidth = null
  let json = []

  for (id in glyphs) {
    glyph = glyphs[id]
    if (glyph.unicode) {
      paths = parsePath(glyph.path)
      paths = formatPaths({ scale, decimals, y }, paths)
      advanceWidth = Math.round(glyph.advanceWidth * scale)
      json.push(`  ${glyph.unicode}:[${advanceWidth},${paths}]`)
    }
  }

  if (skippedPoints) {
    console.warn(`[ WARNING ] skipped ${skippedPoints} duplicate points`)
    skippedPoints = 0
  }

  json = json.join(',\n')
  json = `{\n  height:${settings.fontSize},\n${json}\n}`

  return json
}

function formatPath (options, path) {
  if (options instanceof opentype.Path) {
    path = options
    options = null
  }

  let settings = Object.assign({
    scale: 1,
    decimals: 0,
    x: 0, y: 0
  }, options || {})

  const decimals = settings.decimals
  const scale = settings.scale
  const points = path.points

  let lastPoint = null
  let point = null
  let output = []
  let [x, y] = []

  for (let i = 0, il = points.length; i < il; i++) {
    point = points[i]
    x = +((point._x + settings.x) * scale)
    y = -((point._y + settings.y) * scale)
    point = [ x.toFixed(decimals), y.toFixed(decimals) ]
    if (lastPoint && lastPoint[0] === point[0] && lastPoint[1] === point[1]) {
      skippedPoints++
      continue
    }
    lastPoint = point
    output.push(point)
  }

  return output.join(',')
}

function formatPaths (options, paths) {
  if (Array.isArray(options)) {
    paths = options
    options = null
  }

  for (let i = 0, il = paths.length; i < il; i++) {
    paths[i] = formatPath(options, paths[i])
  }

  return paths.join(',,')
}

function parsePath (options, opentypePath) {
  if (options instanceof opentype.Path) {
    opentypePath = options
    options = null
  }

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
      console.warn('[ WARNING ] Unknow PATH command [' + command.type + ']')
      break
    }
  }

  return paths
}
