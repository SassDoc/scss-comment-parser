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
    }
  };

  var parser = new ScssCommentParser( annotations );

  describe('#parse', function(){
    it('should group comments by context type', function(){
     var result = parser.parse ( scss );
         assert.equal(result.mixin.length , 1);
         assert.equal(result['function'].length , 1);
         assert.equal(result.variable.length , 1);
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

  });

});