import { jcsCanonicalize } from '../src/verify/jcs.js';

describe('jcsCanonicalize', () => {
  it('serializes BigInt values as decimal integers', () => {
    expect(jcsCanonicalize(9007199254740993n)).toBe('9007199254740993');
  });

  it('encodes Unicode code points above U+FFFF as surrogate pairs', () => {
    expect(jcsCanonicalize('\u{1f600}')).toBe('"\\ud83d\\ude00"');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('canonicalizes %s as null', (_label, value) => {
    expect(jcsCanonicalize(value)).toBe('null');
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('rejects %s', (_label, value) => {
    expect(() => jcsCanonicalize(value)).toThrow('JCS does not support Infinity or NaN');
  });

  it('canonicalizes empty objects and arrays', () => {
    expect(jcsCanonicalize({})).toBe('{}');
    expect(jcsCanonicalize([])).toBe('[]');
  });

  it('escapes control characters', () => {
    expect(jcsCanonicalize('\b\t\n\f\r\u0000')).toBe('"\\b\\t\\n\\f\\r\\u0000"');
  });
});
