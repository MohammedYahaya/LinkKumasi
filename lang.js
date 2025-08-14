// Simple i18n for prototype (client-side). Later move to PHP + JSON lang files.
const i18n = {
  en: {
    welcome: "Welcome to AgriLink",
    subtitle: "Kumasi’s smart marketplace for fresh farm produce",
    search_placeholder: "Search tomatoes, yam, plantain ...",
    browse: "Browse",
    kumasiOnly: "Kumasi only (pilot)",
    login: "Login",
    register: "Register",
    featured: "Featured near you",
    chatFarmer: "Chat",
    addToOrder: "Add to Order",
    suggestedBand: "Suggested price band"
  },
  tw: {
    welcome: "Akwaaba wo AgriLink",
    subtitle: "Kumasi adwumayɛbea ma afifideɛ foforo",
    search_placeholder: "Hwehwɛ tomato, pɔnwuma, borɔdeɛ ...",
    browse: "Hwɛ",
    kumasiOnly: "Kumasi nko ara (sɔhwɛ)",
    login: "Kɔ mu",
    register: "Kyerɛw wo din",
    featured: "Nnɔbaeɛ a ɛbɛn wo",
    chatFarmer: "Kasa",
    addToOrder: "Fa ka wɔhyɛ",
    suggestedBand: "Tosɔ a ɛfata"
  }
};

function setLang(lang = 'en'){
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(i18n[lang] && i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if(i18n[lang] && i18n[lang][key]) el.placeholder = i18n[lang][key];
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('lang') || 'en';
  setLang(lang);
  document.querySelectorAll('[data-setlang]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-setlang]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setLang(btn.dataset.setlang);
      showToast(`Language: ${btn.dataset.setlang.toUpperCase()}`);
    });
    if(btn.dataset.setlang === (localStorage.getItem('lang') || 'en')) btn.classList.add('active');
  });
});
