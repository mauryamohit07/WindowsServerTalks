// site.js — small enhancements for the docs site
document.addEventListener('DOMContentLoaded', () => {
  // --- 1) Auto-highlight active sidebar link ---
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.sidebar a[href]').forEach(a => {
    const target = a.getAttribute('href').split('/').pop().toLowerCase();
    if (target === current || (current === '' && target === 'index.html')) {
      a.classList.add('active');
    }
  });

  // --- 2) Add "Copy" buttons to code blocks ---
  document.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.replaceWith(wrap);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Copy code');
    btn.textContent = 'Copy';
    wrap.appendChild(btn);

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      } catch {
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    });
  });

  // --- 3) Click-to-zoom images (simple lightbox) ---
  document.querySelectorAll('img.doc-image').forEach(img => {
    img.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-backdrop';
      overlay.tabIndex = 0;

      const big = img.cloneNode();
      big.removeAttribute('width'); big.removeAttribute('height');
      overlay.appendChild(big);
      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target === big) close(); });
      const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
      overlay.focus();
    });
  });
});
