// Utility functions.

var regex = /({{(\S+?:\S+?)}})/g;

// Functions.

function getProperty (path, doc) {

  if ('string' !== typeof path ||
      'object' !== typeof doc)
    return null;

  var split = path.split('.');

  while (split.length) {
    doc = doc[split.shift()];
    if (!doc)
      return null;
  }

  return doc;

}

// Exports.

exports.buildString = function (str, objects) {

  if ('object' !== typeof objects)
    return str;

  var newStr = str;
  var match;

  while ((match = regex.exec(str))) {
    var split = match[2].split(':');

    if (split.length !== 2 || !objects[split[0]])
      continue;

    var property = getProperty(split[1], objects[split[0]]);
    if (property) newStr = newStr.replace(match[1], property);
  }

  return newStr;

};
