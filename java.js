window.onscroll = function() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  btn.style.display = (document.documentElement.scrollTop > 200) ? "block" : "none";
};

document.addEventListener("DOMContentLoaded", function() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  btn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});