var fs = require('fs');
var assert = require('assert');
var ScssCommentParser = require('../');

describe('ScssCommentParser', function () {
  var scss = fs.readFileSync(__dirname + '/fixtures/demo.scss', 'utf-8');

  // Test Annotations
  var annotations = {
    _: {
      alias: {
        'aliasTest': 'annotationTest'
      }
    },
    annotationTest: {
      parse: function (commentLine) {
        return 'Working';
      }
    },
    multiline: {
      parse: function (commentLine) {
        return commentLine;
      }
    }
  };

  var parser = new ScssCommentParser(annotations);

  describe('#parse', function () {
    it('should group comments by context type', function () {
      var result = parser.parse(scss);
      assert.equal(result.mixin.length, 1);
      assert.equal(result['function'].length, 3);
      assert.equal(result.placeholder.length, 1);
      assert.equal(result.variable.length, 5);
      assert.equal(result.unknown.length, 2);
    });

    it('should contain the whole code in `context.code` function and mixin', function () {
      var result = parser.parse(scss);
      assert.equal(result['function'][0].context.code, '\n  $some : "code";\n');
      assert.equal(result.placeholder[0].context.code, '\n  $some : "code";\n');
      assert.equal(result.mixin[0].context.code, '\n  $some : "code}}";\n  /* } */\n  // }\n');
    });

    it('should allow dash in function/mixin name', function () {
      var result = parser.parse(scss);
      assert.equal(result['function'][1].context.name, 'test-dash');
    });

    it('should group multiple lines after a annotation', function () {
      var result = parser.parse(scss);
      assert.equal(result['function'][0].multiline[0], '\n @test\n This is a\n multiline\n annotation');
    });

    it('should join lines without annotation into description', function () {
      var result = parser.parse(scss);
      assert.equal(result.mixin.length, 1);
      assert.equal(result.mixin[0].description, 'Test a mixin\n');
    });

    it('should resolve a alias to the real name', function () {
      var result = parser.parse(scss);
      assert.equal(result.mixin.length, 1);
      assert.equal(result.mixin[0].annotationTest[0], 'Working' );
    });

    it('should attach correct context', function () {
      var result = parser.parse(scss);
      assert.equal(result.mixin[0].context.name, 'testMixin');
      assert.equal(result['function'][0].context.name, 'testFunction');
      assert.equal(result.placeholder[0].context.name , 'testPlaceholder');
      assert.equal(result.variable[0].context.name, 'testVariable');
    });

    it('should attach the value to a variable', function () {
      var result = parser.parse(scss);
      assert.equal(result.variable[0].context.value, '"value"');
    });

    it('should exclude the global flag', function () {
      var result = parser.parse(scss);
      assert.equal(result.variable[1].context.value, '"value"');
    });

    it('should allow dashes in variables', function () {
      var result = parser.parse(scss);
      assert.equal(result.variable[2].context.value, '"value"');
    });

    it('should parse pretty printed vars', function () {
      var result = parser.parse(scss);
      assert.equal(result.variable[3].context.name, 'map');
      assert.equal(result.variable[3].context.value, '(\n  \"a\": \"b\",\n  \"c\": \"\"\n)');
    });

    it('should parse multiple multiline annotations', function () {
      var result = parser.parse(scss);
      assert.equal(result['function'][2].context.name, 'testMultiline');
      assert.deepEqual(result['function'][2].multiline, [
        '\nThis is a\nmultiline\nannotation\n',
        '\nThis is a\nmultiline\nannotation'
      ]);
    });

    it('should include the scope of a variable', function () {
      var result = parser.parse(scss);
      assert.equal(result.variable[0].context.scope , 'private');
      assert.equal(result.variable[1].context.scope , 'global');
    });

    it('should warn if annotation was not found', function (done) {
      parser.commentParser.on('warning', function(err){
        assert.equal(err + '', 'Error: Parser for annotation `unkownAnnotation` not found.');
        done();
      });
      var result = parser.parse('/**\n *@unkownAnnotation */\n.obj{\n\n}');
    });

    it('should work with semicolons in strings', function () {
      var result = parser.parse(scss);
      assert.equal(result.variable[4].context.value, 'url(\'data:image/svg+xml;base64,asdfasdf\')');
    });
  });

  describe('#extractCode', function () {
    it('should extract a code block', function () {
      assert.equal(parser.extractCode('{{ test }}'), '{ test }');
      assert.equal(parser.extractCode('{{ test }} ignore'), '{ test }');
      assert.equal(parser.extractCode('{{ te"te}}st"st }} ignore'), '{ te"te}}st"st }');
      assert.equal(parser.extractCode('{{ te\'te}}st\'st }} ignore'), '{ te\'te}}st\'st }');
      assert.equal(parser.extractCode('{{ // }\n }} ignore'), '{ // }\n }');
      assert.equal(parser.extractCode('{{ /* }} */ }}'), '{ /* }} */ }');
    });
  });
});
