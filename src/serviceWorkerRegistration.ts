export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          if (import.meta.env.DEV) {
            console.log('SW registered:', registration);
          }
        })
        .catch(error => {
          if (import.meta.env.DEV) {
            console.error('SW registration failed:', error);
          }
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
