import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectWebGL } from './hooks';

afterEach(() => vi.unstubAllGlobals());

describe('gökyüzünün WebGL2 gereksinimi', () => {
  it('yalnız WebGL1 bulunan cihazı destekleniyor diye işaretlemez', () => {
    const getContext = vi.fn((kind: string) => kind === 'webgl' ? {} : null);
    vi.stubGlobal('document', { createElement: () => ({ getContext }) });
    expect(detectWebGL()).toBe(false);
    expect(getContext).toHaveBeenCalledExactlyOnceWith('webgl2');
  });

  it('kontrol bağlamını WebGL2 doğrulamasından sonra bırakır', () => {
    const loseContext = vi.fn();
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ getExtension: () => ({ loseContext }) }) }) });
    expect(detectWebGL()).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('bağlam oluşturma hatasında yedeğe geçer', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => { throw new Error('GPU yok'); } }) });
    expect(detectWebGL()).toBe(false);
  });
});
