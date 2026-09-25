import https from 'https';

const properties = [
  { id: 1, name: "Sumur Bor", url: "https://maps.app.goo.gl/PdBnkExGndUhDQaW6", phone: "+6283193389736", area: "Cengkareng" },
  { id: 3, name: "Pesing Lama", url: "https://maps.app.goo.gl/NkAYSEQgT6tFgbyc7", phone: "+6285773577956", area: "Kebon Jeruk" },
  { id: 4, name: "Pesing Baru", url: "https://maps.app.goo.gl/NkAYSEQgT6tFgbyc7", phone: "+6285773577956", area: "Kebon Jeruk" },
  { id: 5, name: "Alpukat", url: "https://maps.app.goo.gl/YBVADLa7G7E2q9fW8", phone: "+6285894999293", area: "Grogol" },
  { id: 6, name: "GREENVILLE", url: "https://maps.app.goo.gl/jJhUASZEtzvJyvQT8", phone: "+6285284572706", area: "Kebon Jeruk" },
  { id: 7, name: "TD647", url: "https://maps.app.goo.gl/yEpZi6ZJVjRGaGTYA", phone: "+6282129971616", area: "Grogol" },
  { id: 8, name: "TD Guest", url: "https://maps.app.goo.gl/zKTzJZ4XS9CJSWje8", phone: "+6282129971616", area: "Grogol" },
  { id: 9, name: "Green Garden", url: "https://maps.app.goo.gl/p1tmTWG4UgqtyaLE6", phone: "+6281521753872", area: "Kebon Jeruk" },
  { id: 10, name: "Pedongkelan", url: "https://maps.app.goo.gl/tgCQL1KuLfF4TUJL8", phone: "+6285932528041", area: "Cengkareng" },
  { id: 11, name: "Pakjo", url: "https://maps.app.goo.gl/cTsjLmxg7xaW2QPGA", phone: "+628218165001", area: "Palembang" },
  { id: 12, name: "Taman Mahkota", url: "https://maps.app.goo.gl/e8r7HXXHk87gT2ME7", phone: "+6282298697600", area: "Tangerang" },
  { id: 13, name: "TD795", url: "https://maps.app.goo.gl/ucUNd2LYY6CjFDyDA", phone: "+6282129971616", area: "Grogol" },
  { id: 14, name: "Jelambar", url: "https://maps.app.goo.gl/51MHN2xQE8rdtcpH9", phone: "+6285714209196", area: "Grogol" },
  { id: 15, name: "Rajawali", url: "https://maps.app.goo.gl/S11CpBdboki7hu837", phone: "+6282247435024", area: "Kemayoran" }
];

function resolveUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const loc = res.headers.location;
      if (loc) {
        resolve(loc);
      } else {
        resolve(url);
      }
    }).on('error', () => resolve(url));
  });
}

function extractCoords(url) {
  // Check !3d and !4d
  const pinMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pinMatch) {
    return { lat: parseFloat(pinMatch[1]), lng: parseFloat(pinMatch[2]) };
  }
  // Check @lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  // Check ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  return null;
}

async function run() {
  const results = [];
  for (const item of properties) {
    const finalUrl = await resolveUrl(item.url);
    const coords = extractCoords(finalUrl);
    results.push({
      ...item,
      finalUrl,
      coords
    });
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
