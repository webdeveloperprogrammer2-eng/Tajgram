async function check() {
  const urls = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`${url} Status:`, res.status);
    } catch (err) {
      console.error(`${url} Error:`, err.message);
    }
  }
}
check();
