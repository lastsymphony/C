const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL = "https://komiku.id/";

function extractSlugAndChapter(url) {
  const matches = url.match(/\/([^/]+)-chapter-([^/]+)\//);
  if (matches && matches[1] && matches[2]) {
    return {
      slug: matches[1],
      chapter: matches[2],
    };
  }
  return { slug: "", chapter: "" };
}

router.get("/:slug/:chapter", async (req, res) => {
  try {
    const { slug, chapter } = req.params;

    const chapterUrl = `${URL}${slug}-chapter-${chapter}/`;

    const { data } = await axios.get(chapterUrl, {
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

    const breadcrumb = [];
    $("#breadcrumb li").each((i, el) => {
      const text = $(el).find("span").text().trim();
      const link = $(el).find("a").attr("href");

      let detailLink = null;
      if (link && link.includes("/manga/")) {
        const matches = link.match(/\/manga\/([^/]+)/);
        if (matches && matches[1]) {
          detailLink = `/detail-komik/${matches[1]}`;
        }
      }

      breadcrumb.push({
        text,
        originalLink: link || "",
        apiLink: detailLink,
      });
    });

    const title = $("#Judul h1").text().trim();
    const mangaTitle = $("#Judul p a b").text().trim();
    const mangaLink = $("#Judul p a").attr("href");
    const description = $("#Description").text().trim();

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
    $("#Baca_Komik img").each((i, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt");
      const id = $(el).attr("id");

      if (src && src.includes("/uploads") && id) {
        images.push({
          src,
          alt,
          id,
          fallbackSrc: src.replace("cdn.komiku.id", "img.komiku.id"),
        });
      }
    });

    const chapterValueInfo = $(".chapterInfo").attr("valuechapter") || "";
    const totalImages =
      $(".chapterInfo").attr("valuegambar") || images.length.toString();
    const viewAnalyticsUrl = $(".chapterInfo").attr("valueview") || "";

    const additionalDescription = $("#Komentar p").text().trim();

    const publishDate = $("time").attr("datetime") || $("time").text().trim();

    const prevChapterLink =
      $("a:contains('Chapter Sebelumnya')").attr("href") || "";
    const nextChapterLink =
      $("a:contains('Chapter Berikutnya')").attr("href") || "";

    let prevChapterInfo = null;
    if (prevChapterLink) {
      const { slug: prevSlug, chapter: prevChapter } =
        extractSlugAndChapter(prevChapterLink);
      if (prevSlug && prevChapter) {
        prevChapterInfo = {
          originalLink: prevChapterLink.startsWith("http")
            ? prevChapterLink
            : `https://komiku.id${prevChapterLink}`,
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
            : `https://komiku.id${nextChapterLink}`,
          apiLink: `/baca-chapter/${nextSlug}/${nextChapter}`,
          slug: nextSlug,
          chapter: nextChapter,
        };
      }
    }

    res.json({
      // breadcrumb,
      title,
      mangaInfo: {
        title: mangaTitle,
        originalLink: mangaLink?.startsWith("http")
          ? mangaLink
          : `https://komiku.id${mangaLink}`,
        apiLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
        slug: mangaSlug,
      },
      description,
      chapterInfo,
      images,
      meta: {
        chapterNumber: chapterValueInfo || chapter,
        totalImages: parseInt(totalImages),
        publishDate,
        viewAnalyticsUrl,
        slug: slug,
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
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

router.get("/url", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL parameter diperlukan",
      });
    }

    if (!url.includes("komiku.id/") || !url.includes("chapter")) {
      return res.status(400).json({
        error: "URL tidak valid, harus dari komiku.id dan berisi 'chapter'",
      });
    }

    const { slug, chapter } = extractSlugAndChapter(url);

    if (!slug || !chapter) {
      return res.status(400).json({
        error: "URL tidak valid, tidak bisa mengekstrak slug dan nomor chapter",
      });
    }

    return res.redirect(`/baca-chapter/${slug}/${chapter}`);
  } catch (err) {
    console.error("Error fetching chapter from URL:", err);
    res.status(500).json({
      error: "Gagal mengambil data chapter komik",
      detail: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

module.exports = router;
