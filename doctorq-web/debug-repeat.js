const origRepeat = String.prototype.repeat;
String.prototype.repeat = function patchedRepeat(count) {
  if (count < 0) {
    console.error('repeat called with negative count:', count, 'string:', String(this));
    console.trace();
    count = 0;
  }
  return origRepeat.call(this, count);
};
