import bonjour from 'bonjour';

let bonjourInstance = null;

export function createBonjour() {
  if (!bonjourInstance) {
    bonjourInstance = bonjour();
  }
  return bonjourInstance;
}

export function closeBonjour() {
  if (bonjourInstance) {
    try {
      bonjourInstance.destroy();
    } catch (_) {
      // ignore
    }
    bonjourInstance = null;
  }
}

export async function discoverPrinters({ timeoutMs = 3000 } = {}) {
  const bonjour = createBonjour();
  const services = [];

  return new Promise((resolve) => {
    const browser = bonjour.find({ type: 'ipp' });

    const onUp = (service) => {
      try {
        const host = Array.isArray(service.addresses) && service.addresses.length > 0
          ? service.addresses[0]
          : service.host || service.fqdn || undefined;

        const port = service.port;
        const name = service.name || service.txt?.ty || service.host || 'Unknown Printer';
        const path = service.txt?.rp ? `/${service.txt.rp.replace(/^\//, '')}` : '';
        const protocol = 'ipp';
        const url = host && port ? `${protocol}://${host}:${port}${path}` : undefined;

        services.push({
          name,
          host,
          port,
          url,
        });
      } catch (_) {
        // ignore malformed service
      }
    };

    browser.on('up', onUp);

    const timer = setTimeout(() => {
      try {
        browser.removeListener('up', onUp);
        browser.stop();
      } catch (_) {
        // ignore
      }
      resolve(services.filter((s) => Boolean(s.url)));
    }, timeoutMs);

    // Safety: also resolve on browser error
    browser.on('error', () => {
      clearTimeout(timer);
      try {
        browser.removeListener('up', onUp);
        browser.stop();
      } catch (_) {
        // ignore
      }
      resolve(services.filter((s) => Boolean(s.url)));
    });
  });
}


