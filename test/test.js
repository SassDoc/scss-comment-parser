var fs = require('fs');
var assert = require("assert");
var ScssCommentParser = require('../');


describe('ScssCommentParser', function(){

  var scss = fs.readFileSync(__dirname + '/fixtures/demo.scss', 'utf-8');

  // Test Annotations
  var annotations = {
    _ : {
      alias : {
        "aliasTest" : "annotationTest"
      }
    },
    annotationTest : function ( commentLine ){
      return "Working";
    },
    multiline : function( commentLine ){
      return commentLine;
    }
  };

  var parser = new ScssCommentParser( annotations );

  describe('#parse', function(){
    it('should group comments by context type', function(){
     var result = parser.parse ( scss );
         assert.equal(result.mixin.length , 1);
         assert.equal(result['function'].length , 3);
         assert.equal(result.variable.length , 4);
    });

    it('should allow dash in function/mixin name', function(){
     var result = parser.parse ( scss );
         assert.equal(result['function'][1].context.name , 'test-dash');
    });

    it('should group multiple lines after a annotation', function(){
      var result = parser.parse ( scss );
      assert.equal(result['function'][0].multiline[0], 'This is a\nmultiline\nannotation');
    });

    it('should join lines without annotation into description', function(){
     var result = parser.parse ( scss );
         assert.equal(result.mixin.length , 1);
         assert.equal(result.mixin[0].description , 'Test a mixin\n');
    });

    it('should resolve a alias to the real name', function(){
     var result = parser.parse ( scss );
         assert.equal(result.mixin.length , 1);
         assert.equal(result.mixin[0].annotationTest[0] , 'Working' );
    });

    it('should attach correct context', function(){
     var result = parser.parse ( scss );
         assert.equal(result.mixin[0].context.name , 'testMixin');
         assert.equal(result['function'][0].context.name , 'testFunction');
         assert.equal(result.variable[0].context.name , 'testVariable');
    });

    it('should attach the value to a variable', function(){
     var result = parser.parse ( scss );
         assert.equal(result.variable[0].context.value , '"value"');
    });

    it('should exclude the global flag', function(){
     var result = parser.parse ( scss );
         assert.equal(result.variable[1].context.value , '"value"');
    });

    it('should allow dashes in variables', function(){
     var result = parser.parse ( scss );
         assert.equal(result.variable[2].context.value , '"value"');
    });

    it('should parse pretty printed vars', function(){
     var result = parser.parse ( scss );
        assert.equal(result.variable[3].context.name, 'map');
        assert.equal(result.variable[3].context.value, '(\n  \"a\": \"b\",\n  \"c\": \"\"\n)');
    });

    it('should parse multiple multiline annotations', function(){
     var result = parser.parse ( scss );
         assert.equal(result['function'][2].context.name , 'testMultiline');
         assert.deepEqual(result['function'][2].multiline , [ "This is a\nmultiline\nannotation",
                                                              "This is a\nmultiline\nannotation"]);
    });

    it('should include the scope of a variable', function(){
     var result = parser.parse ( scss );
         assert.equal(result.variable[0].context.scope , 'private');
         assert.equal(result.variable[1].context.scope , 'global');
    });

  });

});