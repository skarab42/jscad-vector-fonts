include('vector/camBamStick1.js');
include('vector/camBamStick2.js');
include('vector/camBamStick3.js');
include('vector/camBamStick4.js');
include('vector/camBamStick5.js');
include('vector/camBamStick6.js');
include('vector/camBamStick7.js');
include('vector/camBamStick8.js');
include('vector/camBamStick9.js');
include('vector/cncVector.js');
include('vector/engEuroExtLine.js');
include('vector/engFuturaLine.js');
include('vector/engHelveticaFil2.js');
include('vector/engHelvLine.js');
include('vector/engHelvFill.js');
include('vector/engLubalinLine.js');
include('vector/engParkAveLine.js');
include('vector/engRomanFill.js');
include('vector/engRomanFil2.js');
include('vector/engSquireLine.js');
include('vector/engUniversLine.js');
include('vector/engVandLine.js');

  function getFontObjects () {
    return [ camBamStick1Font, camBamStick2Font, camBamStick3Font, camBamStick4Font, camBamStick5Font, camBamStick6Font, camBamStick7Font, camBamStick8Font, camBamStick9Font, cncVectorFont, engEuroExtLineFont, engFuturaLineFont, engHelveticaFil2Font, engHelvLineFont, engHelvFillFont, engLubalinLineFont, engParkAveLineFont, engRomanFillFont, engRomanFil2Font, engSquireLineFont, engUniversLineFont, engVandLineFont ];
  }

  function getFontNames () {
    return [ 'camBamStick1', 'camBamStick2', 'camBamStick3', 'camBamStick4', 'camBamStick5', 'camBamStick6', 'camBamStick7', 'camBamStick8', 'camBamStick9', 'cncVector', 'engEuroExtLine', 'engFuturaLine', 'engHelveticaFil2', 'engHelvLine', 'engHelvFill', 'engLubalinLine', 'engParkAveLine', 'engRomanFill', 'engRomanFil2', 'engSquireLine', 'engUniversLine', 'engVandLine' ];
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
