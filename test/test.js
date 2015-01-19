var fs = require('fs');
var assert = require('assert');
var ScssCommentParser = require('../');

var getContent = function(file){
  return fs.readFileSync(__dirname + '/fixtures/'+file, 'utf-8');
};


describe('ScssCommentParser', function () {
  describe('#contextParser', function () {
    var parser;

    beforeEach(function(){
      parser = new ScssCommentParser({});
    });

    describe('placeholder', function(){
      var expected = {
        type: 'placeholder',
        name: 'testPlaceholder',
        code: '\n  $some : "code";\n'
      };

      it('should detect it', function(){
        var context = parser.contextParser(getContent('placeholder.test.scss'));
        assert.deepEqual(context, expected);
      });

      it('should detect it with linebreaks', function(){
        var context = parser.contextParser(getContent('placeholderLinebreaks.test.scss'));
        assert.deepEqual(context, expected);
      });

      it('should detect code block while ignoring raw values', function(){
        var context = parser.contextParser(getContent('placeholderWithRawValue.test.scss'));
        assert.deepEqual(context, {
          type: 'placeholder',
          name: 'testPlaceholder-',
          code: '\n  $some : "code";\n'
        });
      });
    });

    describe('mixin', function(){
      var expected = {
        type: 'mixin',
        name: 'name',
        code: '\n  $some : "code";\n'
      };

      it('should detect it', function(){
        var context = parser.contextParser(getContent('mixin.test.scss'));
        assert.deepEqual(context, expected);
      });

      it('should detect it with linebreaks', function(){
        var context = parser.contextParser(getContent('mixinLinebreaks.test.scss'));
        assert.deepEqual(context, expected);
      });
    });

    describe('function', function(){
      var expected = {
        type: 'function',
        name: 'name',
        code: '\n  $some : "code";\n'
      };

      it('should detect it', function(){
        var context = parser.contextParser(getContent('function.test.scss'));
        assert.deepEqual(context, expected);
      });

      it('should detect it with linebreaks', function(){
        var context = parser.contextParser(getContent('functionLinebreaks.test.scss'));
        assert.deepEqual(context, expected);
      });
    });

    describe('variable', function(){
      var expected = {
        type: 'variable',
        name: 'name',
        value: '\'value\'',
        scope: 'private'
      };

      it('should detect it', function(){
        var context = parser.contextParser(getContent('variable.test.scss'));
        assert.deepEqual(context, expected);
      });

      it('should detect it with linebreaks', function(){
        var context = parser.contextParser(getContent('variableLinebreaks.test.scss'));
        assert.deepEqual(context, expected);
      });

      it('should detect it as global', function(){
        var context = parser.contextParser(getContent('variableGlobal.test.scss'));
        assert.deepEqual(context, {
          type: 'variable',
          name: 'name',
          value: '\'value\'',
          scope: 'global'
        });
      });

      it('should detect it with multiline Value', function(){
        var context = parser.contextParser(getContent('variableMultilineValue.test.scss'));
        assert.deepEqual(context, {
          type: 'variable',
          name: 'map',
          value: '(\n  \"a\": \"b\",\n  \"c\": \"\"\n)',
          scope: 'private'
        });
      });

      it('should work for a variable that is build of of variabels', function(){
        var context = parser.contextParser(getContent('variableAsListOfVariables.test.scss'));
        assert.deepEqual(context, {
          type: 'variable',
          name: 'badge-xs-padding',
          value: '$badge-xs-padding-top $badge-xs-padding-right $badge-xs-padding-bottom $badge-xs-padding-left',
          scope: 'private'
        });
      });

      it('should work if a line comments is after the variable', function(){
        var context = parser.contextParser(getContent('commentAfterVariable.test.scss'));
        assert.deepEqual(context, {
          type: 'variable',
          name: 'var',
          value: '\'test\'',
          scope: 'private'
        });
      });
    });

    describe('unknown', function(){
      it('should assing unknown', function(){
        var context = parser.contextParser(getContent('unknown.test.scss'));
        assert.deepEqual(context, {
          type : 'unknown'
        });
      });
    });
  });

  describe('#parser', function(){
    var parser;

    beforeEach(function(){
      parser = new ScssCommentParser({});
    });

    describe('group by type', function(){
      var ignoreDescription = function(result){
        result.forEach(function(item){
          delete item.description;
        });
        return result;
      };

      it('should work with line comments', function(){
        var result = parser.parse(getContent('groupByType.test.scss'));
        result = ignoreDescription(result);
        assert.deepEqual(result, require(__dirname + '/expected/groupByType.json'));
      });
    });

    it('should ignore lines that start with "---"', function(){
        var result = parser.parse(getContent('ignoreLine.test.scss'));
        assert.equal(result.length, 1);
        assert.deepEqual(result[0], {
          description : 'Test\nTest\n',
          commentRange: {
            start:1,
            end:3
          },
          context : {
            type : 'function',
            line : {
              start : 4,
              end : 4
            },
            name : 'test',
            code : ''
          }
        });
    });


  });

  describe('#extractCode', function () {
    var parser;

    beforeEach(function(){
      parser = new ScssCommentParser({});
    });

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