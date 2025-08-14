/* Core algorithms for prototype.
   Move these to PHP services later (RankingService, TrustService, PricingService).
*/

(function(window){
  // small helpers
  function daysSince(dateStr){ return (Date.now() - new Date(dateStr).getTime()) / 86400000; }
  function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
  function haversineKm(lat1,lon1,lat2,lon2){
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(a));
  }
  function overlapFrac(a,b){
    const start = Math.max(new Date(a.from), new Date(b.from));
    const end = Math.min(new Date(a.to), new Date(b.to));
    const total = (new Date(a.to) - new Date(a.from)) || 1;
    const ol = Math.max(0, end - start);
    return clamp(ol / total, 0, 1);
  }

  // Farmer Reliability Index
  function farmerReliability(stats){
    const confirmed = Math.max(1, stats.confirmed || 0);
    const delivered = stats.delivered || 0;
    const onTime = stats.onTime || 0;
    const canceled = stats.canceled || 0;
    const fulfillment = delivered / confirmed;
    const timeliness = delivered ? onTime / delivered : 0;
    const cancelRate = canceled / confirmed;
    const cancellationPenalty = Math.exp(-3 * cancelRate);
    const n = stats.ratingCount || 0, avg = stats.avgRating || 0;
    const bayes = ((n*avg) + (10*3.8)) / (n + 10);
    const ratings = bayes / 5;
    const kyc = stats.kycVerified ? 1 : 0.6;
    return 0.45*fulfillment + 0.25*timeliness + 0.15*cancellationPenalty + 0.10*ratings + 0.05*kyc;
  }

  // KLRR ranking
  function klrr(listing, ctx){
    const freshness = Math.exp(-daysSince(listing.createdAt) / 14);
    const km = haversineKm(ctx.user.lat, ctx.user.lng, listing.lat, listing.lng);
    const proximity = 1 / (1 + km);
    const median = (ctx.medians[listing.category] || listing.price);
    const priceFairness = clamp(median / listing.price, 0.4, 1.6);
    const availabilityFit = overlapFrac(ctx.requestWindow, listing.window || ctx.requestWindow);
    const reliability = farmerReliability(listing.farmerStats || {});
    const w = {f:0.30, p:0.20, pr:0.20, r:0.20, a:0.10};
    return w.f*freshness + w.p*proximity + w.pr*priceFairness + w.r*reliability + w.a*availabilityFit;
  }

  // Price band suggestion
  function suggestPriceBand(catStats, listing){
    const M = catStats.median || listing.price;
    const q1 = catStats.q1 || (M*0.85);
    const q3 = catStats.q3 || (M*1.15);
    const IQR = q3 - q1;
    let minP = Math.max(0.85 * M, q1 - 0.5 * IQR);
    let maxP = Math.min(1.15 * M, q3 + 0.5 * IQR);
    const quality = (listing.tags || []).includes('organic') ? 1.06 : 1.0;
    const demand = clamp(catStats.demandIndex || 1, 0.93, 1.07);
    return {min: Math.round(minP * quality * demand), max: Math.round(maxP * quality * demand)};
  }

  // Counteroffer engine
  function counterOffer(offer, target, band, ctx){
    const days = daysSince(ctx.listingCreated || (new Date().toISOString()));
    const freshness = Math.max(0, 1 - days/14);
    const stockPct = Math.min(1, (ctx.stockLeft || 1) / (ctx.initialStock || 1));
    let a = 0.4 + 0.2*stockPct - 0.2*freshness;
    a = clamp(a, 0.2, 0.7);
    let price = offer*a + target*(1-a);
    price = clamp(price, band.min, band.max);
    const jitter = 1 + (Math.random()*0.04 - 0.02);
    return Math.round(price * jitter);
  }

  // Synonym map for Ghana-local search
  const SYN = {
    "maize":["corn","aburoo"], "corn":["maize","aburoo"], "aburoo":["maize","corn"],
    "plantain":["borode","borɔdeɛ"], "borode":["plantain"], "borɔdeɛ":["plantain"],
    "yam":["pɔnwuma"], "pɔnwuma":["yam"], "tomato":["tomatoes","tomato"]
  };
  function norm(s){ return (s||'').toLowerCase().normalize("NFKD").replace(/[^\w\s]/g,''); }
  function tokens(s){ return norm(s).split(/\s+/).filter(Boolean); }
  function expandQuery(q){
    const terms = tokens(q), out = new Set(terms);
    for(const t of terms){ (SYN[t]||[]).forEach(x => out.add(x)); }
    return Array.from(out);
  }
  function searchScore(listing, q){
    const terms = expandQuery(q);
    const docset = new Set(tokens(`${listing.title} ${listing.description} ${listing.category}`));
    let s = 0;
    for(const t of terms){ if(docset.has(t)) s += 1 + ((SYN[t] && SYN[t].length) ? 0.25 : 0); }
    return s;
  }

  // Integrity risk (lightweight)
  function integrityRisk(sig){
    const a=0.5,b=0.4,c=0.3,d=0.6,e=0.5;
    const z = a*(sig.photoReuse||0) + b*(sig.priceOutlier||0) + c*(sig.editBurst||0) + d*(sig.momoDup||0) + e*(sig.lowFRI||0);
    return 1 - Math.exp(-z);
  }

  window.AgriAlgo = {
    farmerReliability, klrr, suggestPriceBand, counterOffer, searchScore, integrityRisk
  };
})(window);
