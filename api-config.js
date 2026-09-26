(function (globalThis) {
  function isNativeCapacitorPlatform(capacitor = globalThis.Capacitor) {
    return !!(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform());
  }

  function resolveApiBaseUrl(options = {}) {
    const storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const location = options.location || (typeof globalThis.location !== 'undefined' ? globalThis.location : {});
    const capacitor = options.capacitor || globalThis.Capacitor;
    const configured = options.configuredUrl || (storage && storage.getItem('nomadApiBaseUrl'));

    if (configured) {
      return configured.replace(/\/$/, '');
    }

    if (isNativeCapacitorPlatform(capacitor)) {
      return '';
    }

    if (location.origin && location.origin !== 'null' && location.protocol && location.protocol !== 'file:') {
      return location.origin.replace(/\/$/, '');
    }

    return '';
  }

  const NomadApi = {
    isNativeCapacitorPlatform,
    resolveApiBaseUrl
  };

  globalThis.NomadApi = NomadApi;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NomadApi;
  }
})(typeof window !== 'undefined' ? window : globalThis);
