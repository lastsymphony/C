const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL = "https://komiku.id/";

function isBlocked(html) {
  return (
    html.includes("Cloudflare") &&
    (html.includes("captcha") ||
      html.includes("challenge") ||
      html.includes("security check"))
  );
}

router.get("/", async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = req.query.offset || (page - 1) * limit;
    const targetUrl = page > 1 ? `${URL}page/${page}/` : URL;
    console.log(`Fetching URL: ${targetUrl}`);
    let retries = 0;
    let data;

    while (retries < 3) {
      try {
        const response = await axios.get(targetUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: "https://komiku.id/",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          timeout: 10000,
        });

        data = response.data;

        if (isBlocked(data)) {
          console.log("Terdeteksi CloudFlare CAPTCHA, mencoba lagi...");
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        break;
      } catch (error) {
        console.error(`Request attempt ${retries + 1} failed:`, error.message);
        retries++;

        if (retries >= 3) {
          throw new Error(`Failed after ${retries} attempts: ${error.message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const $ = cheerio.load(data);
    const pustaka = [];

    const debugInfo = {
      url: targetUrl,
      selectors: {
        bgeFound: $(".bge").length,
        daftarFound: $(".daftar").length,
        mainFound: $("main.perapih").length,
        ntahFound: $(".ntah").length,
        h1Found: $("h1").text(),
        spanHxFound: $("span[hx-get]").length,
        hxGetValues: [],
      },
    };

    $("span[hx-get]").each((i, el) => {
      debugInfo.selectors.hxGetValues.push($(el).attr("hx-get"));
    });

    $(".bge").each((i, el) => {
      const title = $(el).find("h3").text().trim();
      if (!title) return;

      const originalLink =
        $(el).find(".bgei a").attr("href") ||
        $(el).find(".kan a").first().attr("href");

      if (!originalLink) return;

      const thumbnail =
        $(el).find(".bgei img").attr("src") ||
        $(el).find(".bgei img").attr("data-src") ||
        $(el).find("img").attr("src") ||
        $(el).find("img").attr("data-src");

      const typeAndGenre = $(el).find(".tpe1_inf").text().trim();
      let type = "";
      let genre = "";

      if ($(el).find(".tpe1_inf b").length) {
        type = $(el).find(".tpe1_inf b").text().trim();
        genre = typeAndGenre.replace(type, "").trim();
      }

      const updateCount = $(el).find(".up").text().trim().replace("Up ", "");
      const description = $(el).find(".kan p").text().trim();
      const infoText = $(el).find(".judul2").text().trim();
      let readers = "";
      let lastUpdate = "";
      let colorStatus = "";

      if (infoText) {
        const infoMatch = infoText.match(
          /([0-9,.]+[jt|rb]+)\s+pembaca\s+•\s+([^•]+)(?:•\s+(.+))?/
        );
        if (infoMatch) {
          readers = infoMatch[1].trim();
          lastUpdate = infoMatch[2].trim();
          colorStatus = infoMatch[3] ? infoMatch[3].trim() : "";
        }
      }

      const firstChapter = $(el)
        .find(".new1")
        .first()
        .find("span:last-child")
        .text()
        .trim();
      const latestChapter = $(el)
        .find(".new1")
        .last()
        .find("span:last-child")
        .text()
        .trim();

      const firstChapterLink = $(el)
        .find(".new1")
        .first()
        .find("a")
        .attr("href");
      const latestChapterLink = $(el)
        .find(".new1")
        .last()
        .find("a")
        .attr("href");

      let mangaSlug = "";
      if (originalLink) {
        const mangaMatches = originalLink.match(/\/manga\/([^/]+)/);
        if (mangaMatches && mangaMatches[1]) {
          mangaSlug = mangaMatches[1];
        }
      }

      pustaka.push({
        title,
        originalLink: originalLink?.startsWith("http")
          ? originalLink
          : `https://komiku.id${originalLink}`,
        apiLink: `/detail-komik/${mangaSlug}`,
        type,
        genre,
        thumbnail: thumbnail || "",
        updateCount,
        readers,
        lastUpdate,
        colorStatus,
        description,
        chapters: {
          first: {
            title: firstChapter,
            link: firstChapterLink?.startsWith("http")
              ? firstChapterLink
              : `https://komiku.id${firstChapterLink}`,
          },
          latest: {
            title: latestChapter,
            link: latestChapterLink?.startsWith("http")
              ? latestChapterLink
              : `https://komiku.id${latestChapterLink}`,
          },
        },
      });
    });

    if (pustaka.length === 0) {
      console.log(
        "Tidak menemukan manga dengan selector biasa, mencoba dengan selector universal"
      );

      $("a[href*='/manga/']").each((i, el) => {
        const link = $(el).attr("href");
        if (!link) return;

        if (link.includes("/category/") || link.includes("/genre/")) return;

        let parentEl = $(el).closest("div.bge, div.bgei, article");
        if (!parentEl.length) {
          parentEl = $(el).parent().parent();
        }

        const titleEl = parentEl.find("h3").first();
        const title = titleEl.length
          ? titleEl.text().trim()
          : $(el).text().trim();

        if (!title || title.length < 2) return;

        const thumbnail =
          parentEl.find("img").attr("src") ||
          parentEl.find("img").attr("data-src") ||
          $(el).find("img").attr("src") ||
          $(el).find("img").attr("data-src");

        let mangaSlug = "";
        const mangaMatches = link.match(/\/manga\/([^/]+)/);
        if (mangaMatches && mangaMatches[1]) {
          mangaSlug = mangaMatches[1];
        }

        const existingIndex = pustaka.findIndex(
          (item) =>
            item.title === title ||
            (item.originalLink && item.originalLink.includes(mangaSlug))
        );

        if (existingIndex === -1) {
          pustaka.push({
            title,
            originalLink: link.startsWith("http")
              ? link
              : `https://komiku.id${link}`,
            apiLink: `/detail-komik/${mangaSlug}`,
            thumbnail: thumbnail || "",
            type: "Unknown",
            genre: "",
          });
        }
      });
    }

    if (pustaka.length === 0) {
      console.log("Mencoba alternatif terakhir dengan seluruh konten HTML");

      const htmlSample = data.substring(0, 1000);
      console.log("Sample HTML:", htmlSample);

      $(
        "[title*='manga' i], [alt*='manga' i], [title*='komik' i], [alt*='komik' i]"
      ).each((i, el) => {
        const title =
          $(el).attr("title") || $(el).attr("alt") || $(el).text().trim();
        if (!title || title.length < 3) return;

        const linkEl = $(el).closest("a") || $(el).find("a").first();
        const link = linkEl.length ? linkEl.attr("href") : null;

        if (!link) return;

        const imgEl = $(el).closest("img") || $(el).find("img").first();
        const thumbnail = imgEl.length
          ? imgEl.attr("src") || imgEl.attr("data-src")
          : null;

        pustaka.push({
          title,
          originalLink: link.startsWith("http")
            ? link
            : `https://komiku.id${link}`,
          thumbnail: thumbnail || "",
          type: "Unknown",
          source: "alternative-selector",
        });
      });
    }

    let nextPageUrl = null;
    let hasNextPage = false;
    let nextPageApiUrl = null;

    $("span[hx-get]").each((i, el) => {
      const hxGet = $(el).attr("hx-get");
      if (hxGet && hxGet.includes("/manga/page/")) {
        nextPageApiUrl = hxGet;
        nextPageUrl = `${URL}page/${parseInt(page) + 1}/`;
        hasNextPage = true;
      }
    });
    if (!hasNextPage) {
      $("a.page-numbers, a.next, a.nextpostslink").each((i, el) => {
        const href = $(el).attr("href");
        if (
          href &&
          (href.includes("/page/") || $(el).text().includes("Next"))
        ) {
          nextPageUrl = href;
          hasNextPage = true;
        }
      });
    }

    if (!hasNextPage) {
      hasNextPage = $(".hxloading").length > 0 || $("#hxloading").length > 0;
      if (hasNextPage) {
        nextPageUrl = `${URL}page/${parseInt(page) + 1}/`;
      }
    }

    let nextPage = null;
    if (nextPageUrl) {
      const pageMatch = nextPageUrl.match(/\/page\/(\d+)/);
      if (pageMatch && pageMatch[1]) {
        nextPage = parseInt(pageMatch[1]);
      } else {
        nextPage = parseInt(page) + 1;
      }
    }

    const totalItems = pustaka.length;

    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const slicedPustaka = pustaka.slice(startIndex, endIndex);

    if (totalItems > endIndex) {
      hasNextPage = true;
      nextPage = parseInt(page) + 1;
      nextPageUrl = `${URL}page/${nextPage}/`;
    }

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasNextPage,
      nextPage,
      nextPageUrl,
      nextPageApiUrl,
      totalItems,
      komik: slicedPustaka,
      debug: debugInfo,
    });
  } catch (err) {
    console.error("Error scraping:", err);
    res.status(500).json({
      error: "Gagal mengambil komik pustaka",
      detail: err.message,
    });
  }
});

router.get("/api-page/:page", async (req, res) => {
  try {
    const page = req.params.page || 1;
    const limit = req.query.limit || 10;
    const offset = req.query.offset || (page - 1) * limit;

    const apiUrl = `https://api.komiku.id/manga/page/${page}/`;

    console.log(`Fetching API URL: ${apiUrl}`);

    const { data } = await axios.get(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://komiku.id/",
      },
    });

    if (typeof data === "object") {
      const totalItems = Array.isArray(data) ? data.length : 0;
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const slicedData = Array.isArray(data)
        ? data.slice(startIndex, endIndex)
        : data;

      return res.json({
        page: parseInt(page),
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalItems,
        komik: slicedData,
        source: "json-api",
      });
    }

    const $ = cheerio.load(data);
    const komikItems = [];

    $(".bge").each((i, el) => {
      const title = $(el).find("h3").text().trim();
      if (!title) return;

      const originalLink =
        $(el).find(".bgei a").attr("href") ||
        $(el).find(".kan a").first().attr("href");

      if (!originalLink) return;

      const thumbnail =
        $(el).find(".bgei img").attr("src") ||
        $(el).find(".bgei img").attr("data-src");

      komikItems.push({
        title,
        originalLink: originalLink.startsWith("http")
          ? originalLink
          : `https://komiku.id${originalLink}`,
        thumbnail: thumbnail || "",
        source: "html-api",
      });
    });

    if (komikItems.length === 0) {
      $("a[href*='/manga/']").each((i, el) => {
        const link = $(el).attr("href");
        if (!link || link.includes("/category/") || link.includes("/genre/"))
          return;

        const title = $(el).text().trim() || $(el).find("h3").text().trim();
        if (!title || title.length < 3) return;

        const thumbnail =
          $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

        komikItems.push({
          title,
          originalLink: link.startsWith("http")
            ? link
            : `https://komiku.id${link}`,
          thumbnail: thumbnail || "",
          source: "alternative-api",
        });
      });
    }

    const totalItems = komikItems.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const slicedItems = komikItems.slice(startIndex, endIndex);

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      offset: parseInt(offset),
      totalItems,
      komik: slicedItems,
    });
  } catch (err) {
    console.error("Error fetching API page:", err);
    res.status(500).json({
      error: "Gagal mengambil data dari API pagination",
      detail: err.message,
    });
  }
});

module.exports = router;
