describe('CI gate demo', () => {
  it('fails on purpose to prove the gate blocks merging', () => {
    expect(1).toBe(2);
  });
});
