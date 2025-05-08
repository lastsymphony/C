const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL = "https://komiku.id/";

function scrapeKomikSection($, sectionSelector) {
  const result = [];

  const section = $(sectionSelector);

  const sectionTitle = section.find("h2.lsh3").text().trim();

  section.find("article.ls2").each((i, el) => {
    const title = $(el).find(".ls2j h3 a").text().trim();
    const link = $(el).find(".ls2j h3 a").attr("href");

    const thumbnail =
      $(el).find(".ls2v img").attr("src") ||
      $(el).find(".ls2v img").attr("data-src");

    const infoText = $(el).find(".ls2t").text().trim();

    let genre = "";
    let readers = "";

    if (infoText) {
      if (infoText.includes("•")) {
        const infoSplit = infoText.split("•").map((item) => item.trim());
        if (infoSplit.length >= 1) {
          genre = infoSplit[0];
        }
        if (infoSplit.length >= 2) {
          readers = infoSplit[1];
        }
      } else if (infoText.includes(" ")) {
        const lastSpaceIndex = infoText.lastIndexOf(" ");
        if (lastSpaceIndex > 0 && infoText.includes("pembaca")) {
          genre = infoText.substring(0, lastSpaceIndex).trim();
          readers = infoText.substring(lastSpaceIndex).trim();
        } else {
          genre = infoText;
        }
      } else {
        genre = infoText;
      }
    }

    const latestChapter = $(el).find(".ls2j a.ls2l").text().trim();
    const chapterLink = $(el).find(".ls2j a.ls2l").attr("href");

    const formattedLink = link?.startsWith("http")
      ? link
      : `https://komiku.id${link}`;
    const formattedChapterLink = chapterLink?.startsWith("http")
      ? chapterLink
      : `https://komiku.id${chapterLink}`;

    let mangaSlug = "";
    let chapterNumber = "";

    if (link) {
      const mangaMatches = link.match(/\/manga\/([^/]+)/);
      if (mangaMatches && mangaMatches[1]) {
        mangaSlug = mangaMatches[1];
      }
    }

    if (chapterLink) {
      const chapterMatches = chapterLink.match(/\/([^/]+)-chapter-([^/]+)\//);
      if (chapterMatches && chapterMatches[2]) {
        chapterNumber = chapterMatches[2];
      }
    }

    const apiDetailLink = mangaSlug ? `/detail-komik/${mangaSlug}` : null;
    const apiChapterLink =
      mangaSlug && chapterNumber
        ? `/baca-chapter/${mangaSlug}/${chapterNumber}`
        : null;

    result.push({
      title,
      originalLink: formattedLink,
      apiDetailLink,
      thumbnail,
      genre,
      readers,
      latestChapter,
      originalChapterLink: formattedChapterLink,
      apiChapterLink,
      mangaSlug,
      chapterNumber,
    });
  });

  return { title: sectionTitle, items: result };
}

router.get("/", async (req, res) => {
  try {
    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://komiku.id/",
        "Cache-Control": "no-cache",
      },
    });

    const $ = cheerio.load(data);

    const mangaPopuler = scrapeKomikSection(
      $,
      "#Komik_Hot_Manga, section#Komik_Hot_Manga"
    );
    const manhwaPopuler = scrapeKomikSection(
      $,
      "#Komik_Hot_Manhwa, section#Komik_Hot_Manhwa"
    );
    const manhuaPopuler = scrapeKomikSection(
      $,
      "#Komik_Hot_Manhua, section#Komik_Hot_Manhua"
    );

    if (mangaPopuler.items.length === 0) {
      $("section.ls").each((i, el) => {
        const title = $(el).find("h2.lsh3").text().trim().toLowerCase();

        if (title.includes("manga") && mangaPopuler.items.length === 0) {
          mangaPopuler.title = $(el).find("h2.lsh3").text().trim();
          $(el)
            .find("article.ls2")
            .each((j, article) => {});
        } else if (
          title.includes("manhwa") &&
          manhwaPopuler.items.length === 0
        ) {
        } else if (
          title.includes("manhua") &&
          manhuaPopuler.items.length === 0
        ) {
        }
      });
    }

    res.json({
      manga: mangaPopuler,
      manhwa: manhwaPopuler,
      manhua: manhuaPopuler,
    });
  } catch (err) {
    console.error("Error scraping komik populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data komik populer",
      detail: err.message,
    });
  }
});

router.get("/manga", async (req, res) => {
  try {
    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const $ = cheerio.load(data);
    const mangaPopuler = scrapeKomikSection(
      $,
      "#Komik_Hot_Manga, section#Komik_Hot_Manga"
    );

    res.json(mangaPopuler);
  } catch (err) {
    console.error("Error scraping manga populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manga populer",
      detail: err.message,
    });
  }
});

router.get("/manhwa", async (req, res) => {
  try {
    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const $ = cheerio.load(data);
    const manhwaPopuler = scrapeKomikSection(
      $,
      "#Komik_Hot_Manhwa, section#Komik_Hot_Manhwa"
    );

    res.json(manhwaPopuler);
  } catch (err) {
    console.error("Error scraping manhwa populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manhwa populer",
      detail: err.message,
    });
  }
});

router.get("/manhua", async (req, res) => {
  try {
    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const $ = cheerio.load(data);
    const manhuaPopuler = scrapeKomikSection(
      $,
      "#Komik_Hot_Manhua, section#Komik_Hot_Manhua"
    );

    res.json(manhuaPopuler);
  } catch (err) {
    console.error("Error scraping manhua populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manhua populer",
      detail: err.message,
    });
  }
});

module.exports = router;
