export function getLocation() {
  console.log("getLocation called");
  return new Promise((resolve, _reject) => {
    navigator.geolocation.getCurrentPosition(resolve, async () => {
      console.log("failed to get location. falling back");
      // fallback to IP-based lookup
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      resolve({
        coords: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
    });
  });
}
