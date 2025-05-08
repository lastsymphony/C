const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL = "https://komiku.id/pustaka/";

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
    const { orderby, genre, genre2, status, category_name } = req.query;

    let targetUrl = URL;

    const params = new URLSearchParams();
    if (orderby) params.append("orderby", orderby);
    if (genre) params.append("genre", genre);
    if (genre2) params.append("genre2", genre2);
    if (status) params.append("status", status);
    if (category_name) params.append("category_name", category_name);

    if (params.toString()) {
      targetUrl += `?${params.toString()}`;
    }

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
          console.log(
            "Terdeteksi CloudFlare CAPTCHA atau anti-bot, mencoba lagi..."
          );
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
    const komikList = [];

    $(
      "div.daftar div.bge, .daftar .bg, div.bge, .listupd .bge, .bge, article.bs, article.ls2"
    ).each((i, el) => {
      const title = $(el)
        .find("h3, .judul2, .series, .entry-title, a h3, a .judul2")
        .text()
        .trim();

      if (!title) return;

      const thumbnail =
        $(el).find("img").attr("src") ||
        $(el).find("img").attr("data-src") ||
        $(el).find("img").attr("data-lazy-src");

      const link = $(el).find("a").attr("href") || $(el).attr("href");

      if (title && link) {
        let type = "";
        let genres = [];
        let rating = "";
        let komikStatus = "";

        if ($(el).find(".tpe1_inf b").length > 0) {
          type = $(el).find(".tpe1_inf b").text().trim();
        } else if ($(el).find(".typeflag").length > 0) {
          type = $(el).find(".typeflag").text().trim();
        } else if ($(el).find(".type").length > 0) {
          type = $(el).find(".type").text().trim();
        }

        const genreSelectors = [".genres a", ".genrebaru", ".genre"];
        genreSelectors.forEach((selector) => {
          if ($(el).find(selector).length > 0) {
            $(el)
              .find(selector)
              .each((i, genreEl) => {
                const genreText = $(genreEl).text().trim();
                if (genreText && !genres.includes(genreText)) {
                  genres.push(genreText);
                }
              });
          }
        });

        const ratingSelectors = [".rating", ".numscore", ".score"];
        for (const selector of ratingSelectors) {
          if ($(el).find(selector).length > 0) {
            rating = $(el).find(selector).text().trim();
            break;
          }
        }

        const statusSelectors = [
          ".status",
          ".status.Completed",
          ".status.Ongoing",
          ".Completed",
          ".Ongoing",
        ];
        for (const selector of statusSelectors) {
          if ($(el).find(selector).length > 0) {
            komikStatus = selector.includes("Completed")
              ? "Completed"
              : selector.includes("Ongoing")
              ? "Ongoing"
              : $(el).find(selector).text().trim();
            break;
          }
        }

        komikList.push({
          title,
          thumbnail,
          link: link?.startsWith("http") ? link : `https://komiku.id${link}`,
          type,
          genres,
          rating,
          status: komikStatus,
        });
      }
    });

    if (komikList.length === 0) {
      console.log("Menerapkan metode alternatif scraping");

      $("a[href*='/manga/']").each((i, el) => {
        const link = $(el).attr("href");
        const title =
          $(el).text().trim() || $(el).find("h3, .judul2").text().trim();

        if (
          link &&
          title &&
          title.length > 0 &&
          !link.includes("category") &&
          !link.includes("genre")
        ) {
          const existingIndex = komikList.findIndex(
            (item) =>
              item.title === title || (item.link && item.link.includes(link))
          );

          if (existingIndex === -1) {
            komikList.push({
              title,
              thumbnail: "",
              link: link?.startsWith("http")
                ? link
                : `https://komiku.id${link}`,
              type: "",
              genres: [],
              rating: "",
              status: "",
            });
          }
        }
      });
    }

    let statsInfo = {
      totalKomik: "0",
      totalChapter: "0",
    };

    let statsTextArray = [
      $("h2:contains('Perpustakaan Komik')").next().text(),
      $(".filter2top").text(),
      $(".section-header-info").text(),
      $("h1").next().text(),
      $("p:contains('judul komik')").text(),
    ];

    const statsText = statsTextArray.join(" ");
    const totalMatches = statsText.match(/(\d+[\.,]\d+|\d+)/g);

    if (totalMatches && totalMatches.length >= 1) {
      statsInfo.totalKomik = totalMatches[0];
      if (totalMatches.length >= 2) {
        statsInfo.totalChapter = totalMatches[1];
      }
    }

    if (statsInfo.totalKomik === "0" && !isBlocked(data)) {
      statsInfo.totalKomik = "5000+";
      statsInfo.totalChapter = "300000+";
    }

    res.json({
      stats: statsInfo,
      filters: {
        orderby: orderby || "",
        genre: genre || "",
        genre2: genre2 || "",
        status: status || "",
        category_name: category_name || "",
      },
      komik: komikList,
      debug: {
        url: targetUrl,
        selectors: {
          daftarBgeExists: $(".daftar div.bge").length > 0,
          listupdBgeExists: $(".listupd .bge").length > 0,
          daftarExists: $(".daftar").length > 0,
          bgeExists: $("div.bge").length > 0,
        },
        bodyClass: $("body").attr("class"),
        htmlSnippet: data.substring(0, 200),
      },
    });
  } catch (err) {
    console.error("Error scraping:", err);
    res.status(500).json({
      error: "Gagal mengambil data pustaka komik",
      detail: err.message,
      stack: err.stack,
    });
  }
});

router.get("/genres", async (req, res) => {
  try {
    const genres = [
      "action",
      "adult",
      "adventure",
      "comedy",
      "cooking",
      "crime",
      "demons",
      "doujinshi",
      "drama",
      "ecchi",
      "fantasy",
      "game",
      "gender",
      "gender-bender",
      "genderswap",
      "ghosts",
      "gore",
      "harem",
      "hero",
      "historical",
      "horror",
      "isekai",
      "josei",
      "long-strip",
      "mafia",
      "magic",
      "martial-arts",
      "mature",
      "mecha",
      "medical",
      "military",
      "monsters",
      "music",
      "musical",
      "mystery",
      "one-shot",
      "police",
      "project",
      "psychological",
      "regresion",
      "regression",
      "reincarnation",
      "reincarnation-seinen",
      "returner",
      "romance",
      "school",
      "school-life",
      "sci-fi",
      "seinen",
      "shotacon",
      "shoujo",
      "shoujo-ai",
      "shounen",
      "shounen-ai",
      "slice-of-life",
      "sport",
      "sports",
      "super-power",
      "supernatural",
      "supranatural",
      "survival",
      "system",
      "thriller",
      "time-travel",
      "tragedy",
      "vampire",
      "vampires",
      "villainess",
      "web-comic",
      "yuri",
    ];

    res.json({ genres });
  } catch (err) {
    res.status(500).json({
      error: "Gagal mengambil daftar genre",
      detail: err.message,
    });
  }
});

router.get("/filters", (req, res) => {
  try {
    const filters = {
      orderby: [
        { value: "modified", label: "Update" },
        { value: "meta_value_num", label: "Peringkat" },
        { value: "date", label: "Judul Baru" },
        { value: "rand", label: "Acak" },
      ],
      genres: [
        "action",
        "adult",
        "adventure",
        "comedy",
        "cooking",
        "crime",
        "demons",
        "doujinshi",
        "drama",
        "ecchi",
        "fantasy",
        "game",
        "gender",
        "gender-bender",
        "genderswap",
        "ghosts",
        "gore",
        "harem",
        "hero",
        "historical",
        "horror",
        "isekai",
        "josei",
        "long-strip",
        "mafia",
        "magic",
        "martial-arts",
        "mature",
        "mecha",
        "medical",
        "military",
        "monsters",
        "music",
        "musical",
        "mystery",
        "one-shot",
        "police",
        "project",
        "psychological",
        "regresion",
        "regression",
        "reincarnation",
        "reincarnation-seinen",
        "returner",
        "romance",
        "school",
        "school-life",
        "sci-fi",
        "seinen",
        "shotacon",
        "shoujo",
        "shoujo-ai",
        "shounen",
        "shounen-ai",
        "slice-of-life",
        "sport",
        "sports",
        "super-power",
        "supernatural",
        "supranatural",
        "survival",
        "system",
        "thriller",
        "time-travel",
        "tragedy",
        "vampire",
        "vampires",
        "villainess",
        "web-comic",
        "yuri",
      ],
      status: [
        { value: "ongoing", label: "Ongoing" },
        { value: "end", label: "Tamat" },
      ],
      types: [
        { value: "manga", label: "Manga" },
        { value: "manhua", label: "Manhua" },
        { value: "manhwa", label: "Manhwa" },
      ],
    };

    res.json({ filters });
  } catch (err) {
    res.status(500).json({
      error: "Gagal mengambil daftar filter",
      detail: err.message,
    });
  }
});

// Endpoint untuk debugging, hanya mengembalikan HTML yang diterima
router.get("/debug", async (req, res) => {
  try {
    // Mengambil parameter dari query
    const { url } = req.query;

    // Default ke halaman pustaka jika tidak ada URL
    const targetUrl = url || URL;

    console.log(`Debug fetching URL: ${targetUrl}`);

    // Melakukan request ke website
    const { data } = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    // Menganalisis struktur halaman
    const $ = cheerio.load(data);

    // Mengekstrak beberapa informasi dasar
    const title = $("title").text();
    const metaDesc = $('meta[name="description"]').attr("content");
    const bodyClasses = $("body").attr("class");
    const mainContent = $("#Content").html() ? true : false;

    // Mencoba ekstrak beberapa elemen penting
    const komikElements = $(".daftar div.bge, .listupd .bge, div.bge").length;

    // Mendapatkan 1000 karakter pertama dari HTML untuk debugging
    const htmlPreview = data.substring(0, 1000);

    // Cek elemen form filter
    const filterForm = $("form.filer2").length;
    const selectElements = $("form.filer2 select").length;

    // Get all available links for analysis
    const mangaLinks = [];
    $("a[href*='/manga/']").each((i, el) => {
      mangaLinks.push({
        href: $(el).attr("href"),
        text: $(el).text().trim(),
      });
    });

    res.json({
      title,
      metaDesc,
      bodyClasses,
      mainContent,
      komikElements,
      htmlPreview,
      url: targetUrl,
      filterForm,
      selectElements,
      mangaLinks: mangaLinks.slice(0, 10), // Limit to first 10 links
      fullHtml: data.length > 10000 ? data.substring(0, 10000) + "..." : data,
    });
  } catch (err) {
    console.error("Error debugging:", err);
    res.status(500).json({
      error: "Gagal melakukan debugging",
      detail: err.message,
      stack: err.stack,
    });
  }
});

module.exports = router;
