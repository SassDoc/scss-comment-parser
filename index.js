var CDocParser = require('cdocparser');

var extractCode = function(code, offset){
  offset = offset || 0;
  var start = offset;
  var cursor = offset;
  var depth = 1;
  var length = code.length;

  var inString = false;
  var openChar = '';

  var inComment = false;
  var bComment = false;
  var lComment = false;

  cursor++; // Ignore the first brace

  while (cursor < length && depth > 0) {
    var cb = code[cursor-1];
    var c = code[cursor];
    var cn = code[cursor+1];

    if (!inString){
      if (c === '/' && cn === '/' && !bComment) { // line comment: begin
        cursor++; // swallow
        inComment = lComment = true;
      } else if ((c === '\n' || c === '\r') && lComment && !bComment) {
        lComment = inComment = false;
      } else if (c === '/' && cn === '*') {       // block comment: begin
        cursor++; // swallow
        bComment = true;
        inComment = !lComment;
      } else if (c === '*' && cn === '/') {       // block comment: begin
        cursor++; // swallow
        inComment = bComment = lComment;
      }
    }

    if (!inComment && cb !== '\\') {  // in String
      if (c === '"' || c === '\'') {
        if (!inString) {
          openChar = c;
          inString = true;
        } else if (openChar === c){
          inString = false;
        }
      }
    }

    if (!(inString || inComment)){
      if (c === '{'){
        depth++;
      } else if (c === '}'){
        depth--;
      }
    }

    cursor++;
  }

  if (depth > 0){
    return '';
  }

  return code.substring(start, cursor);
};


/**
 * SCSS Context Parser
 */
var scssContextParser = (function () {
  var ctxRegEx = /^(@|\$)([\w-_]+)*(?:\s+([\w-_]+)|[\s\S]*?\:([\s\S]*?)(?:\s!(\w+))?\;)?/;
  var parser = function (ctxCode) {
    var match = ctxRegEx.exec(ctxCode.trim());
    var context = {
      type : 'unknown'
    };

    if (match) {
      if (match[1] === '@' && (match[2] === 'function' || match[2] === 'mixin')){
        context.type = match[2];
        context.name = match[3];
        var codeStart = ctxCode.indexOf('{', match.index + match[0].length);
        if (codeStart >= 0) {
          context.code = extractCode(ctxCode, codeStart);
        }
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

Parser.prototype.extractCode = extractCode;

module.exports = Parser;
