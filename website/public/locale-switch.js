(function () {
  if (window.__chambeLocaleSwitch) return;
  window.__chambeLocaleSwitch = true;
  window.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var anchor = target.closest('a[data-locale-switch]');
      if (!anchor) return;
      var code = anchor.getAttribute('data-locale-switch');
      document.cookie = 'NEXT_LOCALE=' + code + ';path=/;max-age=31536000;SameSite=Lax';
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (anchor.getAttribute('aria-current') === 'true') return;
      window.location.assign(anchor.getAttribute('href'));
    },
    true,
  );
})();
