const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

// Function to get random delay between 1-3 seconds
const getRandomDelay = () =>
  Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);

// Function to get random user agent
const getRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

// Function to scrape manga data from a given page
async function scrapeMangaData(page = 1) {
  try {
    // Add delay before request
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));

    const response = await axios.get(
      `https://api.komiku.id/manga/page/${page}/`,
      {
        headers: {
          "User-Agent": getRandomUserAgent(),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
          Referer: "https://komiku.id/",
        },
        timeout: 5000,
      }
    );

    const $ = cheerio.load(response.data);
    const mangaList = [];

    $(".bge").each((i, element) => {
      const manga = {
        title: $(element).find(".kan h3").text().trim(),
        thumbnail: $(element).find(".bgei img").attr("src"),
        type: $(element).find(".tpe1_inf b").text(),
        genre: $(element)
          .find(".tpe1_inf")
          .text()
          .replace($(element).find(".tpe1_inf b").text(), "")
          .trim(),
        url: $(element).find(".bgei a").attr("href"),
        description: $(element).find(".kan p").text().trim(),
        stats: $(element).find(".judul2").text().trim(),
        firstChapter: {
          title: $(element).find(".new1:first-child a").attr("title"),
          url: $(element).find(".new1:first-child a").attr("href"),
        },
        latestChapter: {
          title: $(element).find(".new1:last-child a").attr("title"),
          url: $(element).find(".new1:last-child a").attr("href"),
        },
      };
      mangaList.push(manga);
    });

    return {
      page: page,
      results: mangaList,
    };
  } catch (error) {
    console.error("Error scraping manga:", error);
    throw error;
  }
}

// Add rate limiting middleware
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Route for base pustaka endpoint
router.get("/", async (req, res) => {
  try {
    const data = await scrapeMangaData(1);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch manga data" });
  }
});

// Route for paginated pustaka endpoint
router.get("/:page", async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const data = await scrapeMangaData(page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch manga data" });
  }
});

module.exports = router;
