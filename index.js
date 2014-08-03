var CDocParser = require('cdocparser');
/**
 * SCSS Context Parser
 */
var scssContextParser = (function () {
  var ctxRegEx = /(@|%|\$)([\w-_]+)*(?:\s+([\w-_]+)|[\s\S]*?\:([\s\S]*?)(?:\s!(\w+))?\;)?/;
  var parser = function (ctxCode) {
    var match = ctxRegEx.exec(ctxCode);
    var context = {
      type : 'unknown'
    };

    if (match) {
      if (match[1] === '@' && (match[2] === 'function' || match[2] === 'mixin')){
        context.type = match[2];
        context.name = match[3];
      } else if (match[1] === '%') {
        context.type = 'placeholder';
        context.name = match[2];
      } else if (match[1] === '$') {
        context.type = 'variable';
        context.name = match[2];
        context.value = match[4].trim();
        context.scope = match[5] || 'private';
      }
    }

    return context;
  };

  return parser;
})();

var filterAndGroup = function(lines){
  var nLines = [];
  var group = false;
  lines.forEach(function(line){
    var isAnnotation = line.indexOf('@') === 0;
    if (line.trim().indexOf('---') !== 0) { // Ignore lines that start with "---"
      if (group){
        if ( isAnnotation ) {
          nLines.push(line);
        } else {
          nLines[nLines.length - 1] += '\n' + line ;
        }
      } else if (isAnnotation) {
        group = true;
        nLines.push(line);
      } else {
        nLines.push(line);
      }
    }
  });
  return nLines;
};

var extractor = new CDocParser.CommentExtractor(scssContextParser);

var Parser = function (annotations) {
  this.commentParser = new CDocParser.CommentParser(annotations);
};

Parser.prototype.parse = function(code){
  var comments = extractor.extract(code);
  comments.forEach(function(comment){
    comment.lines = filterAndGroup(comment.lines);
  });
  return this.commentParser.parse(comments);
};

module.exports = Parser;
