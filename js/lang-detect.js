/* ============================================================
   DESTRIER 自动语言检测
   - 海外 IP 访问中文页 → 跳转英文版 en.html
   - 国内 IP 访问英文版 → 跳转中文版 index.html
   - 用户显式点过语言按钮 → 尊重选择，不自动跳转
   - 检测失败 → 保持当前语言
   ============================================================ */
(function () {
  if (location.protocol === 'file:') return;
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return;

  var onEn = /(^|\/)en\.html/i.test(location.pathname);
  var saved = null;
  try { saved = localStorage.getItem('destrier-lang'); } catch (e) {}

  if (saved === (onEn ? 'en' : 'zh')) return;

  function switchTo(target, lang) {
    try { localStorage.setItem('destrier-lang', lang); } catch (e) {}
    location.replace(target);
  }

  function decide(code) {
    if (!code) return;
    var isCN = (code === 'CN');
    if (!isCN && !onEn)      switchTo('en.html', 'en');
    else if (isCN && onEn)   switchTo('index.html', 'zh');
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a.lang-btn');
    if (!a) return;
    var lang = /en\.html/.test(a.getAttribute('href')) ? 'en' : 'zh';
    try { localStorage.setItem('destrier-lang', lang); } catch (e) {}
  });

  var tries = [
    function (cb) {
      fetch('https://ipapi.co/json/', { mode: 'cors' })
        .then(function (r) { return r.json(); })
        .then(function (d) { cb(d && d.country_code); })
        .catch(function () { cb(null); });
    },
    function (cb) {
      fetch('https://ipinfo.io/json', { mode: 'cors' })
        .then(function (r) { return r.json(); })
        .then(function (d) { cb(d && d.country); })
        .catch(function () { cb(null); });
    }
  ];
  var i = 0;
  (function next() {
    if (i >= tries.length) return;
    tries[i++](function (code) {
      if (code) decide(code);
      else next();
    });
  })();
})();
