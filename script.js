<script>
async function loadListings() {
  const VISIBLE_COUNT = 5; // show first 5 initially
  const listContainer = document.getElementById('listContainer');
  const moreSelect = document.getElementById('moreSelect');
  const showAllBtn = document.getElementById('showAllBtn');

  try {
    // ✅ Fetch data from assets/listings.json
    const response = await fetch('assets/listings.json');
    const listings = await response.json();

    // Card template
    const cardHTML = (item) => `
      <div style="border:1px solid #345; padding:14px 16px; display:flex; justify-content:space-between; gap:12px;">
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-weight:700;">${item.title}</div>
          <div style="opacity:.9;"><span style="color:#f0c040;">${item.price}</span> · ${item.status}</div>
          <div>Media:
            <a href="${item.youtube}" target="_blank" style="color:#5eb3ff;">YouTube</a> /
            <a href="${item.instagram}" target="_blank" style="color:#5eb3ff;">Instagram</a>
          </div>
        </div>
        <a href="${item.youtube}" target="_blank" class="btn primary"
           style="padding:8px 12px; border:1px solid #f0c040; color:#f0c040; text-decoration:none;">
           View Details
        </a>
      </div>
    `;

    // Render first few
    listContainer.innerHTML = listings.slice(0, VISIBLE_COUNT).map(cardHTML).join('');

    // Fill dropdown with remaining
    const remaining = listings.slice(VISIBLE_COUNT);
    moreSelect.innerHTML = <option value="">Select another property…</option> +
      remaining.map((item, i) => <option value="${VISIBLE_COUNT + i}">${item.title}</option>).join('');

    const hideControls = () => {
      moreSelect.style.display = 'none';
      showAllBtn.style.display = 'none';
    };

    if (remaining.length === 0) hideControls();

    // Handle dropdown
    moreSelect.addEventListener('change', (e) => {
      const index = Number(e.target.value);
      if (!isNaN(index)) {
        listContainer.insertAdjacentHTML('beforeend', cardHTML(listings[index]));
        moreSelect.remove(moreSelect.selectedIndex);
        moreSelect.value = '';
        if (moreSelect.options.length === 1) hideControls();
      }
    });

    // Handle show all
    showAllBtn.addEventListener('click', () => {
      const remainingCards = listings.slice(VISIBLE_COUNT).map(cardHTML).join('');
      listContainer.insertAdjacentHTML('beforeend', remainingCards);
      hideControls();
    });
  } catch (error) {
    console.error('Failed to load listings:', error);
    listContainer.innerHTML = '<p style="color:red;">Error loading listings.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadListings);
</script>
