// netlify/functions/get-benzinga-news.js
const https = require("https");
const { parseStringPromise } = require("xml2js");

exports.handler = async function () {
  // Using Benzinga's public RSS feed for news
  const url = "https://www.benzinga.com/feed";

  return new Promise((resolve) => {
    https
      .get(url, { headers: { 'User-Agent': 'Productivity-Dashboard/1.0' } }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`Benzinga feed returned status code: ${res.statusCode}`);
            return resolve({
                statusCode: res.statusCode,
                body: JSON.stringify({ error: "Failed to fetch Benzinga feed" }),
            });
        }
        
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", async () => {
          try {
            // Benzinga feed might not use arrays for single items, so explicitArray: false is safer.
            const parsed = await parseStringPromise(data, { trim: true, explicitArray: false });
            
            // Ensure channel and item exist before mapping
            let items = [];
            if (parsed?.rss?.channel?.item) {
                const rawItems = Array.isArray(parsed.rss.channel.item) 
                                 ? parsed.rss.channel.item 
                                 : [parsed.rss.channel.item]; // Ensure item is an array
                
                items = rawItems.map((item) => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    description: item.description || "",
                }));
            }

            resolve({
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ articles: items }),
            });
          } catch (err) {
            console.error("Benzinga RSS parse error", err);
            resolve({
              statusCode: 500,
              body: JSON.stringify({ error: "Failed to parse Benzinga feed" }),
            });
          }
        });
      })
      .on("error", (err) => {
        console.error("Benzinga fetch error", err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Could not fetch Benzinga feed" }),
        });
      });
  });
};
