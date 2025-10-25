/* ===== LISTINGS (JSON -> UI) ===== */
(() => {
  const VISIBLE_COUNT = 5;

  // Runs when DOM is ready (works even if this file is loaded without 'defer')
  document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('listContainer');
    const moreSelect    = document.getElementById('moreSelect');
    const showAllBtn    = document.getElementById('showAllBtn');

    if (!listContainer || !moreSelect || !showAllBtn) return;

    try {
      // IMPORTANT: leading slash so it works from any #route
      const res = await fetch('/assets/listings.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(HTTP ${res.status});
      const listings = await res.json();

      const cardHTML = (item) => {
        return (
          '<div style="border:1px solid #345; padding:14px 16px; ' +
          'display:flex; justify-content:space-between; gap:12px;">' +
            '<div style="display:flex; flex-direction:column; gap:6px;">' +
              '<div style="font-weight:700;">' + item.title + '</div>' +
              '<div style="opacity:.9;"><span style="color:#f0c040;">' +
                item.price + '</span> · ' + item.status + '</div>' +
              '<div>Media: ' +
                '<a href="' + item.youtube + '" target="_blank" style="color:#5eb3ff; text-decoration:none;">YouTube</a> / ' +
                '<a href="' + item.instagram + '" target="_blank" style="color:#5eb3ff; text-decoration:none;">Instagram</a>' +
              '</div>' +
            '</div>' +
            '<a href="' + (item.youtube || '#') + '" target="_blank" class="btn primary" ' +
               'style="padding:8px 12px; border:1px solid #f0c040; color:#f0c040; text-decoration:none;">' +
               'View Details' +
            '</a>' +
          '</div>'
        );
      };

      // render first N
      listContainer.innerHTML = listings.slice(0, VISIBLE_COUNT).map(cardHTML).join('');

      // dropdown with remaining
      const remaining = listings.slice(VISIBLE_COUNT);
      let options = '<option value="">Select another property…</option>';
      remaining.forEach((it, i) => {
        options += '<option value="' + (VISIBLE_COUNT + i) + '">' + it.title + '</option>';
      });
      moreSelect.innerHTML = options;

      const hideControls = () => {
        moreSelect.style.display = 'none';
        showAllBtn.style.display = 'none';
      };
      if (remaining.length === 0) hideControls();

      moreSelect.addEventListener('change', function () {
        const idx = Number(this.value);
        if (!Number.isNaN(idx)) {
          listContainer.insertAdjacentHTML('beforeend', cardHTML(listings[idx]));
          moreSelect.remove(moreSelect.selectedIndex);
          moreSelect.value = '';
          if (moreSelect.options.length === 1) hideControls();
        }
      });

      showAllBtn.addEventListener('click', function () {
        const html = remaining.map(cardHTML).join('');
        listContainer.insertAdjacentHTML('beforeend', html);
        hideControls();
      });

    } catch (err) {
      console.error('Failed to load listings.json:', err);
      listContainer.innerHTML = '<p style="color:#ff8a8a;">Could not load listings.</p>';
    }
  });
})();
