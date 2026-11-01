// Doğrulama betiklerinin ortak sonuç sayacı. Her kontrol "GEÇTİ/KALDI" yazar;
// en az bir KALDI varsa ya da betik yarıda kesilirse süreç sıfırdan farklı kodla biter.

export function createChecker({ setExit = (code) => (process.exitCode = code), log = console.log } = {}) {
  let passed = 0;
  const failures = [];
  const ok = (name, cond, extra = '') => {
    log(cond ? 'GEÇTİ ' : 'KALDI ', name, extra);
    if (cond) passed++;
    else failures.push(name);
    return !!cond;
  };
  /** Rapor alanı boş değilse (taşma, küçük hedef, çakışma…) kontrolü başarısız sayar. */
  const none = (name, list, extra = '') => ok(name, !list || list.length === 0, list?.length ? `${JSON.stringify(list)} ${extra}` : extra);
  /** Uygulamadan gelen konsol hataları başarısızlıktır; bilinen üçüncü taraf uyarıları ayıklanır. */
  const consoleClean = (logs, ignore = /DevTools|THREE\.Clock|vite|Context Lost|WEBGL_lose_context/) => {
    const errors = logs.filter((l) => /^(error|EXC|assert)/.test(l) && !ignore.test(l));
    if (logs.length) log(logs.filter((l) => !ignore.test(l)).join('\n') || '(konsol temiz)');
    return none('konsolda uygulama hatası yok', errors);
  };
  const finish = () => {
    const code = failures.length > 0 ? 1 : 0;
    log(`\nSonuç: ${passed} geçti, ${failures.length} kaldı${failures.length ? ` → ${failures.join(' · ')}` : ''}`);
    setExit(code);
    return code;
  };
  return { ok, none, consoleClean, finish, get failures() { return [...failures]; } };
}

/**
 * Betik gövdesini çalıştırır: beklenmeyen bir hata da başarısızlık sayılır ve
 * tarayıcı her durumda kapatılır.
 */
export async function runChecks(body, { close, checker = createChecker() } = {}) {
  try {
    await body(checker);
  } catch (error) {
    checker.ok('betik hatasız tamamlandı', false, String(error?.stack ?? error));
  } finally {
    try { await close?.(); } catch { /* tarayıcı zaten kapalı */ }
  }
  return checker.finish();
}

// `node scripts/check.mjs --hata-yolu`: başarısız bir kontrolün gerçekten 1 ile çıktığını gösterir.
if (process.argv[1]?.endsWith('check.mjs') && process.argv.includes('--hata-yolu')) {
  await runChecks(async ({ ok, none }) => {
    ok('örnek başarılı kontrol', true);
    none('örnek taşma raporu', ['Sıradaki yıldıza']);
  });
}
