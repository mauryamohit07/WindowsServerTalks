// site.js — shared header/sidebar loader + small UX enhancements
document.addEventListener('DOMContentLoaded', () => {
  // ---------- Base path detection (GitHub Pages friendly) ----------
  // If hosted at https://<user>.github.io/<repo>/..., BASE = "/<repo>"
  // If hosted at the root or running locally (file:// or localhost), BASE = ""
  const detectBase = () => {
    const { protocol, hostname, pathname } = window.location;
    const isGithub = hostname.endsWith('github.io');
    if (isGithub) {
      // pathname like: /WindowsServerTalks/path/to/page.html
      const seg = pathname.split('/').filter(Boolean); // ["WindowsServerTalks","path","to","page.html"]
      return seg.length ? `/${seg[0]}` : '';
    }
    return ''; // localhost or custom domain root
  };
  const BASE = detectBase();

  // Helper: safely fetch a partial and inject into a host element
  const injectPartial = async (hostSelector, partialPath, afterInject = () => {}) => {
    const host = document.querySelector(hostSelector);
    if (!host) return;
    try {
      const res = await fetch(`${BASE}${partialPath}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const html = await res.text();
      host.innerHTML = html;
      afterInject(host);
    } catch (err) {
      // Optional: show a small non-blocking warning in console
      console.warn(`Failed to load ${partialPath}:`, err);
    }
  };

  // ---------- 1) Load shared HEADER ----------
  // In your pages, add: <div id="header-container"></div> near the top of <body>
  injectPartial('#header-container', '/assets/includes/header.html', (headerHost) => {
    // If you plan to generate breadcrumbs dynamically later, you can do it here.
    // For now, your pages already contain their own breadcrumbs below the header.
  });

  // ---------- 2) Load shared SIDEBAR ----------
  // In your pages, add: <div id="sidebar-container"></div> inside .layout, as a sibling of <main>
  injectPartial('#sidebar-container', '/assets/includes/sidebar.html', (sidebarHost) => {
    // After sidebar is available, highlight the current page link
    const here = window.location;
    const normalize = (url) => url.replace(/\/+$/, '').toLowerCase(); // strip trailing slash
    const currentUrl = normalize(here.origin + here.pathname);

    // Prefer aria-current for accessibility; also keep .active class for your existing CSS
    sidebarHost.querySelectorAll('a[href]').forEach(a => {
      const linkUrl = normalize(a.href);
      if (linkUrl === currentUrl) {
        a.setAttribute('aria-current', 'page');
        a.classList.add('active');
      }
      // Also consider "index.html" equivalence (e.g., /docs/ == /docs/index.html)
      if (
        currentUrl.endsWith('/index.html') &&
        linkUrl === currentUrl.replace(/\/index\.html$/, '')
      ) {
        a.setAttribute('aria-current', 'page');
        a.classList.add('active');
      }
    });
  });

  // ---------- 3) Copy buttons for code blocks ----------
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

  // ---------- 4) Click-to-zoom images (simple lightbox) ----------
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
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === big) close();
      });
      const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
      overlay.focus();
    });
  });
});
