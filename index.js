var CDocParser = require('cdocparser');

/**
 * SCSS Context Parser
 */
var scssContextParser = (function(){
  var ctxRegEx = /(@|\$)(\w+)(?:\s+(\w+)){0,1}/m;
  var parser = function( ctxCode ) {
    var match = ctxRegEx.exec(ctxCode);
    var context = {};
    if ( match ) {
      switch (match[1]){
        case "@" : // Mixin/fucntion
          context.type = match[2]; // mixin/function
          context.name = match[3];
          break;
        case "$" :
          context.type = 'variable';
          context.name = match[2];
          break;
        default :
          context.type = 'unkown';
      }
    }
    return context;
  };
  return parser;
})();


var extractor = new CDocParser.CommentExtractor( scssContextParser );

var Parser = function( annotations ){
  this.commentParser = new CDocParser.CommentParser( annotations );
};

Parser.prototype.parse = function( code ){
  var comments = extractor.extract ( code );
  return this.commentParser.parse(comments);
};

module.exports = Parser;