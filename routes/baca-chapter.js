const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL_BASE = "https://komiku.org/";

function extractSlugAndChapter(url) {
  const matches =
    url.match(/\/([^\/]+?)-chapter-([^\/]+?)(?:\/|$)/) ||
    url.match(/\/manga\/[^\/]+\/chapter\/([^\/]+?)(?:\/|$)/);
  if (matches && matches[1] && matches[2]) {
    return {
      slug: matches[1],
      chapter: matches[2],
    };
  } else if (url.includes("-chapter-")) {
    const parts = url.split("/");
    const chapterPart = parts.find((part) => part.includes("-chapter-"));
    if (chapterPart) {
      const chapterMatch = chapterPart.match(/^(.*?)-chapter-(.*?)$/);
      if (chapterMatch && chapterMatch[1] && chapterMatch[2]) {
        return {
          slug: chapterMatch[1],
          chapter: chapterMatch[2],
        };
      }
    }
  }
  return { slug: "", chapter: "" };
}

router.get("/:slug/:chapter", async (req, res) => {
  try {
    const { slug, chapter } = req.params;
    const chapterUrl = `${URL_BASE}${slug}-chapter-${chapter}/`;

    const { data } = await axios.get(chapterUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://komiku.id/",
        "Cache-Control": "public, max-age=3600",
        timeout: 10000,
      },
    });

    const $ = cheerio.load(data);

    const title = $("#Judul h1").text().trim();
    const mangaTitleElement = $("#Judul p a b");
    const mangaTitle = mangaTitleElement.text().trim();
    const mangaLink = mangaTitleElement.parent().attr("href");

    const description =
      $("#Description")
        .first()
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim() +
      " " +
      $("#Description b").first().text().trim() +
      " " +
      $("#Description a[href='/'] b").first().text().trim();

    let mangaSlug = "";
    if (mangaLink) {
      const mangaMatches = mangaLink.match(/\/manga\/([^/]+)/);
      if (mangaMatches && mangaMatches[1]) {
        mangaSlug = mangaMatches[1];
      }
    }

    const chapterInfo = {};
    $("#Judul table.tbl tbody tr").each((i, el) => {
      const key = $(el).find("td").first().text().trim();
      const value = $(el).find("td").last().text().trim();
      chapterInfo[key] = value;
    });

    const images = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (
        src &&
        src.includes("komiku.org") &&
        !src.includes("thumbnail") &&
        !src.includes("resize") &&
        /\.(jpg|jpeg|png)$/.test(src)
      ) {
        images.push(src);
      }
    });

    const chapterValueInfo = $(".chapterInfo").attr("valuechapter") || "";
    const totalImages =
      $(".chapterInfo").attr("valuegambar") || images.length.toString();
    const viewAnalyticsUrl = $(".chapterInfo").attr("valueview") || "";
    const additionalDescription = $("#Komentar p").first().text().trim();
    const publishDate =
      $("time[property='datePublished']").attr("datetime") ||
      $("time").first().text().trim();

    // ✅ FIXED: Cari prev dan next berdasarkan nomor
    let prevChapterLink = "";
    let nextChapterLink = "";

    $(".nxpr a[href*='-chapter-']").each((i, el) => {
      const href = $(el).attr("href");
      const { chapter: foundChapter } = extractSlugAndChapter(href);

      if (foundChapter) {
        const foundNum = parseFloat(foundChapter.replace(/[^0-9.]/g, ""));
        const currentNum = parseFloat(chapter.replace(/[^0-9.]/g, ""));

        if (foundNum < currentNum) {
          prevChapterLink = href;
        } else if (foundNum > currentNum) {
          nextChapterLink = href;
        }
      }
    });

    let prevChapterInfo = null;
    if (prevChapterLink) {
      const { slug: prevSlug, chapter: prevChapter } =
        extractSlugAndChapter(prevChapterLink);
      if (prevSlug && prevChapter) {
        prevChapterInfo = {
          originalLink: prevChapterLink.startsWith("http")
            ? prevChapterLink
            : `${URL_BASE}${prevChapterLink.replace(/^\//, "")}`,
          apiLink: `/baca-chapter/${prevSlug}/${prevChapter}`,
          slug: prevSlug,
          chapter: prevChapter,
        };
      }
    }

    let nextChapterInfo = null;
    if (nextChapterLink) {
      const { slug: nextSlug, chapter: nextChapter } =
        extractSlugAndChapter(nextChapterLink);
      if (nextSlug && nextChapter) {
        nextChapterInfo = {
          originalLink: nextChapterLink.startsWith("http")
            ? nextChapterLink
            : `${URL_BASE}${nextChapterLink.replace(/^\//, "")}`,
          apiLink: `/baca-chapter/${nextSlug}/${nextChapter}`,
          slug: nextSlug,
          chapter: nextChapter,
        };
      }
    }

    res.json({
      title,
      mangaInfo: {
        title: mangaTitle,
        originalLink: mangaLink?.startsWith("http")
          ? mangaLink
          : `${URL_BASE}${mangaLink?.replace(/^\//, "")}`,
        apiLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
        slug: mangaSlug,
      },
      description,
      chapterInfo,
      images,
      meta: {
        chapterNumber: chapterValueInfo || chapter,
        totalImages: parseInt(totalImages) || images.length,
        publishDate,
        viewAnalyticsUrl,
        slug,
      },
      navigation: {
        prevChapter: prevChapterInfo,
        nextChapter: nextChapterInfo,
        allChapters: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
      },
      additionalDescription,
    });
  } catch (err) {
    console.error("Error fetching chapter:", err);
    res.status(500).json({
      error: "Gagal mengambil data chapter komik",
      detail: err.message,
    });
  }
});

module.exports = router;
