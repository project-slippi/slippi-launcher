// locationService.js

const CACHE_KEY = "app_location_cache";
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
const INFLIGHT: any = { promise: null };

function now() {
  return Date.now();
}

// ------------------
// Cache helpers
// ------------------
function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw);

    if (now() - data.timestamp > CACHE_TTL) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export type Location = {
  lat: number;
  lng: number;
  source: string;
};

function setCached(location: Location) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      ...location,
      timestamp: now(),
    }),
  );
}

// ------------------
// GPS with timeout
// ------------------
function getGPS(timeoutMs = 4000) {
  return new Promise<Location | null>((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "gps",
          });
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 0,
      },
    );
  });
}

// ------------------
// IP fallback
// ------------------
async function getIPLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    return {
      lat: data.latitude,
      lng: data.longitude,
      source: "ip",
    };
  } catch {
    return null;
  }
}

// ------------------
// Background upgrade
// ------------------
async function tryUpgradeToGPS() {
  const gps = await getGPS(4000);

  if (gps) {
    setCached(gps);
    console.log("[location] upgraded to GPS");
  }
}

// ------------------
// Public API
// ------------------
export async function getLocation(): Promise<Location> {
  // Deduplicate concurrent calls
  if (INFLIGHT.promise) {
    return INFLIGHT.promise;
  }

  INFLIGHT.promise = (async () => {
    // 1. Return cache if available
    const cached = getCached();
    if (cached) {
      // If cached is IP, try upgrade in background
      if (cached.source === "ip") {
        void tryUpgradeToGPS();
      }
      return cached;
    }

    // 2. Try GPS first
    const gps = await getGPS();
    if (gps) {
      setCached(gps);
      return gps;
    }

    // 3. Fallback to IP
    const ip = await getIPLocation();
    if (ip) {
      setCached(ip);

      // Try upgrading in background
      void tryUpgradeToGPS();

      return ip;
    }

    return null;
  })();

  try {
    return await INFLIGHT.promise;
  } finally {
    INFLIGHT.promise = null;
  }
}
