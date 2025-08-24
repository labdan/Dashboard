// netlify/functions/get-stock-news.js
const https = require("https");
const { parseStringPromise } = require("xml2js");

exports.handler = async function () {
  const url = "https://seekingalpha.com/feed.xml";

  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", async () => {
          try {
            const parsed = await parseStringPromise(data, { trim: true });
            const items = parsed.rss.channel[0].item.map((item) => ({
              title: item.title[0],
              link: item.link[0],
              pubDate: item.pubDate[0],
              description: item.description ? item.description[0] : "",
            }));

            resolve({
              statusCode: 200,
              body: JSON.stringify({ articles: items }),
            });
          } catch (err) {
            console.error("RSS parse error", err);
            resolve({
              statusCode: 500,
              body: JSON.stringify({ error: "Failed to parse Seeking Alpha feed" }),
            });
          }
        });
      })
      .on("error", (err) => {
        console.error("Fetch error", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Could not fetch feed" }),
        });
      });
  });
};
