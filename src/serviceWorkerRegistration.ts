const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register() {
  // Só registra o Service Worker em produção (não em desenvolvimento)
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('SW registrado:', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    });
  } else if (isLocalhost) {
    // Em desenvolvimento, desregistra qualquer SW existente para evitar cache
    unregister();
    console.log(
      '🔄 Service Worker desabilitado em desenvolvimento (HMR ativo)'
    );
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}
