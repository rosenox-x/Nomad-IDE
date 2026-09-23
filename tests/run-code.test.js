const test = require('node:test');
const assert = require('node:assert/strict');
const { runCode } = require('../server');

test('python execution works', async () => {
  const result = await runCode({
    language: 'python',
    filename: 'hello.py',
    code: 'print("hello from python test")\n'
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /hello from python test/);
});

test('java execution works', async () => {
  const result = await runCode({
    language: 'java',
    filename: 'HelloWorld.java',
    code: `public class HelloWorld {
  public static void main(String[] args) {
    System.out.println("hello from java test");
  }
}`
  });

  assert.equal(result.exitCode, 0);
  assert.match(result.output, /hello from java test/);
});
