module.exports = function (fontNames, fontPath = 'fonts') {
  let includes = []
  let objects = []
  let names = []

  fontNames.forEach(fontName => {
    includes.push(`include('${ fontPath }/${ fontName }.js');`)
    objects.push(`${ fontName }Font`)
    names.push(`'${ fontName }'`)
  })

  return `${ includes.join('\n') }

  function getFontObjects () {
    return [ ${ objects.join(', ') } ];
  }

  function getFontNames () {
    return [ ${ names.join(', ') } ];
  }

  function getParameterDefinitions () {
    const fontNamesCaptions = getFontNames();
    const fontNamesValues = Array.from(fontNamesCaptions.keys());
    return [
      { name: 'text', caption: 'Text to render', type: 'text', initial: 'OpenJSCAD', size: 30 },
      { name: 'font', caption: 'Font', type: 'group' },
      { name: 'fontName', caption: 'Name:', type: 'choice', captions: fontNamesCaptions, values: fontNamesValues, initial: 0 },
      { name: 'fontSize', caption: 'Size:', type: 'float', initial: 10 }
    ];
  }

  function csgFromSegments (segments) {
    let output = [];
    for (let i = 0, il = segments.length; i < il; i++) {
      output.push(rectangular_extrude(segments[i], { w: 2, h: 2 }));
    }
    return union(output);
  }

  function testFont (options, text) {
    const settings = Object.assign({
      height: 10,
      extrudeOffset: 2
    }, options || {});
    return center([1, 0, 0], csgFromSegments(vectorText(settings, text)));
  }

  function main (params) {
    const text = params.text;
    const fonts = getFontObjects();
    const font = fonts[params.fontName];
    const height = params.fontSize;
    return testFont({ font, height }, text);
  }
`
}
