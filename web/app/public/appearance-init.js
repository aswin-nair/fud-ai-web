// Blocking external script keeps first paint in the chosen theme under the site's CSP.
(() => {
  let preference = 'system'
  try {
    const saved = localStorage.getItem('fud-appearance-v1')
    if (saved === 'light' || saved === 'dark') preference = saved
  } catch { /* System appearance works when storage is unavailable. */ }
  const dark = preference === 'dark' || (preference === 'system'
    && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191B1A' : '#FFF8EB')
})()
