// ui-core.js - Motor de efectos visuales globales

// 1. Efecto Spotlight (La luz sigue al ratón en las tarjetas)
document.addEventListener('mousemove', (e) => {
  const cards = document.querySelectorAll('.cyber-glass-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// 2. Sistema global de notificaciones flotantes (Toasts)
function dispararToast(mensaje, tipo = 'success') {
  let cont = document.getElementById('cyber_toasts');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'cyber_toasts';
    cont.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none';
    document.body.appendChild(cont);
  }

  const toast = document.createElement('div');
  const isSuccess = tipo === 'success';
  const isInfo = tipo === 'info';
  
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border cyber-glass-card text-xs font-semibold shadow-2xl transition-all ${
    isSuccess 
      ? 'bg-white/95 text-emerald-800 border-emerald-300 shadow-emerald-500/10' 
      : (isInfo ? 'bg-white/95 text-indigo-800 border-indigo-300 shadow-indigo-500/10' : 'bg-white/95 text-rose-800 border-rose-300 shadow-rose-500/10')
  }`;

  const icon = isSuccess 
    ? 'fa-circle-check text-emerald-500' 
    : (isInfo ? 'fa-circle-info text-indigo-500' : 'fa-triangle-exclamation text-rose-500');

  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base"></i>
    <span class="font-medium">${mensaje}</span>
  `;
  cont.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}