/* App wiring + demo data */
function showToast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.style.display='none', 1800);
}

/* Demo context (Kumasi center lat/lng) */
const ctx = {
  user: { lat: 6.68848, lng: -1.62443, name: 'Demo Buyer' },
  medians: { 'Vegetables': 30, 'Roots': 45, 'Fruits': 35 },
  requestWindow: { from: '2025-08-10', to: '2025-08-25' }
};

/* Demo listings */
const listings = [
  { id:1, title:'Fresh Tomatoes (crate)', category:'Vegetables', description:'Red and juicy, local variety', price:32, lat:6.70, lng:-1.63, createdAt:'2025-08-12', tags:['fresh'], farmerStats:{confirmed:40,delivered:37,onTime:33,canceled:3,avgRating:4.4,ratingCount:28,kycVerified:true}, window:{from:'2025-08-11',to:'2025-08-26'}, photo:'https://picsum.photos/seed/tom/600/400' },
  { id:2, title:'Organic Yam (bag)', category:'Roots', description:'Pɔnwuma from Ejisu — quality grade A', price:50, lat:6.68, lng:-1.59, createdAt:'2025-08-07', tags:['organic'], farmerStats:{confirmed:20,delivered:18,onTime:16,canceled:2,avgRating:4.2,ratingCount:12,kycVerified:false}, window:{from:'2025-08-09',to:'2025-08-30'}, photo:'https://picsum.photos/seed/yam/600/400' },
  { id:3, title:'Sweet Plantain (bundle)', category:'Fruits', description:'Borɔdeɛ ripe/green mix', price:36, lat:6.66, lng:-1.64, createdAt:'2025-08-14', tags:['fresh'], farmerStats:{confirmed:12,delivered:12,onTime:10,canceled:0,avgRating:4.9,ratingCount:6,kycVerified:true}, window:{from:'2025-08-14',to:'2025-08-28'}, photo:'https://picsum.photos/seed/plant/600/400' }
];

function renderListings(list){
  const wrap = document.getElementById('listings');
  if(!wrap) return;
  const ranked = list.slice().sort((a,b) => AgriAlgo.klrr(b, ctx) - AgriAlgo.klrr(a, ctx));
  wrap.innerHTML = ranked.map(x => {
    const fri = Math.round(AgriAlgo.farmerReliability(x.farmerStats || {})*100);
    const rank = AgriAlgo.klrr(x, ctx).toFixed(2);
    return `
      <article class="card listing">
        <img src="${x.photo}" alt="${x.title}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <strong>${x.title}</strong>
              <div class="muted" style="font-size:13px">${x.category} • Kumasi</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800">GHS ${x.price}</div>
              <div class="chip muted">Rank ${rank}</div>
            </div>
          </div>
          <p class="muted" style="margin:8px 0">${x.description}</p>
          <div style="display:flex;gap:8px;align-items:center">
            <a class="btn" href="product.html?id=${x.id}" data-i18n="chatFarmer">Details</a>
            <button class="btn primary" onclick="showToast('Added to cart (demo)')" data-i18n="addToOrder">Add to Order</button>
            <div class="chip">Trust ${fri}%</div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* Search wiring */
function doSearch(q){
  q = (q || document.getElementById('q') && document.getElementById('q').value || '').trim();
  if(!q) { renderListings(listings); return; }
  const scored = listings.map(l => ({ l, s: AgriAlgo.searchScore(l, q) })).filter(x => x.s > 0);
  const results = scored.map(x => x.l);
  renderListings(results);
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  renderListings(listings);

  const searchInput = document.getElementById('q');
  if(searchInput){
    searchInput.addEventListener('input', () => doSearch(searchInput.value));
    document.getElementById('searchBtn')?.addEventListener('click', () => doSearch(searchInput.value));
  }

  // Simple service worker registration if present
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.error('SW registration failed', err));
}
