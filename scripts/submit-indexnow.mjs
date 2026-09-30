const host = "www.sthenofitness.com";
const key = "fff60e75be574589808ec299e72fc968";
const keyLocation = `https://${host}/${key}.txt`;
const requested = process.argv.slice(2).filter((value) => !value.startsWith("--"));

async function sitemapUrls() {
  const response = await fetch(`https://${host}/sitemap.xml`);
  if (!response.ok) throw new Error(`SITEMAP_FETCH_FAILED:${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const urlList = requested.length
  ? requested.map((value) => value.startsWith("https://") ? value : `https://${host}${value.startsWith("/") ? value : `/${value}`}`)
  : await sitemapUrls();

if (!urlList.length) throw new Error("INDEXNOW_URL_LIST_EMPTY");
if (urlList.some((url) => new URL(url).hostname !== host)) throw new Error("INDEXNOW_HOST_MISMATCH");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`INDEXNOW_SUBMISSION_FAILED:${response.status}:${await response.text()}`);
}

console.log(JSON.stringify({ status: response.status, submitted: urlList.length, keyLocation }, null, 2));
