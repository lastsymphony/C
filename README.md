<p align="center">
  <a href="https://github.com/LuckyIndraEfendi">
    <img src="https://avatars.githubusercontent.com/u/68459009?v=4" alt="Logo" width="150" >
  </a>

  <h3 align="center">Komiku-Rest-API</h3>

  <p align="center">
    <samp>A RESTful API for scraping and serving manga/manhwa/manhua data from <a href="http://komiku.id/">Komiku.id.</a></samp>
    <br />
    <a href="#table-of-contents"><strong>Explore the api »</strong></a>
    <br />

## Table of Contents

- [Introduction](#introduction)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Recommendations](#recommendations)
  - [Trending](#trending)
  - [Latest Updates](#latest-updates)
  - [Library](#library)
  - [Popular Comics](#popular-comics)
  - [Search](#search)
  - [Comic Details](#comic-details)
  - [Read Chapter](#read-chapter)
- [Response Structure](#response-structure)
- [Status Codes](#status-codes)
- [Error Handling](#error-handling)
- [Deployment](#deployment)

## Introduction

Komiku API provides access to manga, manhwa, and manhua data scraped from Komiku.id. This API allows developers to build applications that can display comics, their details, and chapters for reading.

## Base URL

```
http://localhost:3000
```

Jika menggunakan Vercel deployment:

```
https://your-project-name.vercel.app
```

## Endpoints

### Recommendations

Get recommended comics from the homepage.

```
GET /rekomendasi
```

#### Response Example

```json
[
  {
    "title": "The Beginning After The End",
    "originalLink": "https://komiku.id/manga/the-beginning-after-the-end/",
    "apiDetailLink": "/detail-komik/the-beginning-after-the-end",
    "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2019/03/Komik-The-Beginning-After-The-E.jpg?quality=60"
  },
  ...
]
```

### Trending

Get trending comics from the homepage.

```
GET /trending
```

#### Response Example

```json
[
  {
    "title": "Solo Leveling",
    "originalLink": "https://komiku.id/manga/solo-leveling/",
    "apiDetailLink": "/detail-komik/solo-leveling",
    "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2018/12/Komik-Solo-Leveling.png?quality=60"
  },
  ...
]
```

### Latest Updates

Get the latest comic updates from the homepage. This endpoint returns both latest manga updates and latest chapter updates.

```
GET /terbaru
```

#### Response Example

```json
[
  {
    "title": "Tomb Raider King",
    "originalLink": "https://komiku.id/tomb-raider-king-chapter-400/",
    "apiLink": "/baca-chapter/tomb-raider-king/400",
    "isChapter": true,
    "type": "chapter",
    "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2020/03/Komik-Tomb-Raider-King.jpg?quality=60",
    "chapterNumber": "400",
    "mangaSlug": "tomb-raider-king",
    "detailLink": "/detail-komik/tomb-raider-king"
  },
  ...
]
```

### Library (Beta)

Access the comic library with various filtering options.
**Note:** This endpoint is still in development and may have bugs or inconsistent results.

```
GET /pustaka
```

#### Query Parameters

| Parameter     | Description                          | Example Values                       | Default Value   |
| ------------- | ------------------------------------ | ------------------------------------ | --------------- |
| page          | Page number                          | 1, 2, 3, etc.                        | 1               |
| limit         | Number of items per page             | 10, 20, 50, etc.                     | 10              |
| offset        | Starting position of items to return | 0, 10, 20, etc.                      | (page-1)\*limit |
| orderby       | Order results by                     | modified, meta_value_num, date, rand | modified        |
| genre         | Filter by genre                      | action, romance, comedy              | -               |
| status        | Filter by status                     | ongoing, end                         | -               |
| category_name | Filter by category/type              | manga, manhwa, manhua                | -               |

#### Response Example

```json
{
  "page": 1,
  "limit": 10,
  "offset": 0,
  "hasNextPage": true,
  "nextPage": 2,
  "nextPageUrl": "https://komiku.id/page/2/",
  "nextPageApiUrl": "/manga/page/2/",
  "totalItems": 56,
  "komik": [
    {
      "title": "One Piece",
      "originalLink": "https://komiku.id/manga/one-piece/",
      "apiLink": "/detail-komik/one-piece",
      "type": "Manga",
      "genre": "Action, Adventure, Comedy",
      "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2018/09/Komik-One-Piece.jpg?quality=60",
      "updateCount": "5",
      "readers": "12.5jt",
      "lastUpdate": "3 jam lalu",
      "colorStatus": "Berwarna",
      "description": "Gol D. Roger dikenal sebagai Raja Bajak Laut, Orang terkuat dan paling terkenal yang...",
      "chapters": {
        "first": {
          "title": "Chapter 1",
          "link": "https://komiku.id/one-piece-chapter-1/"
        },
        "latest": {
          "title": "Chapter 1089",
          "link": "https://komiku.id/one-piece-chapter-1089/"
        }
      }
    },
    ...
  ]
}
```

#### Pagination Examples

Get first 10 comics (default behavior):

```
GET /pustaka
```

Get 20 comics per page:

```
GET /pustaka?limit=20
```

Get second page with 10 comics per page:

```
GET /pustaka?page=2&limit=10
```

Get comics starting from position 30, with 20 items:

```
GET /pustaka?offset=30&limit=20
```

#### API-Specific Pagination

You can also use the internal pagination API directly:

```
GET /pustaka/api-page/:page?limit=10&offset=0
```

#### Available Filters

Get available genre filters:

```
GET /pustaka/genres
```

Get all available filters:

```
GET /pustaka/filters
```

### Popular Comics

Get popular manga, manhwa, and manhua listings.

```
GET /komik-populer
```

#### Response Example

```json
{
  "manga": {
    "title": "Manga Terpopuler",
    "items": [
      {
        "title": "One Piece",
        "originalLink": "https://komiku.id/manga/one-piece/",
        "apiDetailLink": "/detail-komik/one-piece",
        "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2018/09/Komik-One-Piece.jpg?quality=60",
        "genre": "Action",
        "readers": "12.5jt pembaca",
        "latestChapter": "Chapter 1089",
        "originalChapterLink": "https://komiku.id/one-piece-chapter-1089/",
        "apiChapterLink": "/baca-chapter/one-piece/1089",
        "mangaSlug": "one-piece",
        "chapterNumber": "1089"
      },
      ...
    ]
  },
  "manhwa": {
    "title": "Manhwa Terpopuler",
    "items": [...]
  },
  "manhua": {
    "title": "Manhua Terpopuler",
    "items": [...]
  }
}
```

#### Get Specific Comic Type

Get only popular manga:

```
GET /komik-populer/manga
```

Get only popular manhwa:

```
GET /komik-populer/manhwa
```

Get only popular manhua:

```
GET /komik-populer/manhua
```

### Search

Search for comics by keyword.

```
GET /search?q=keyword
```

#### Query Parameters

| Parameter | Description                  | Example Values          | Required |
| --------- | ---------------------------- | ----------------------- | -------- |
| q         | Keyword to search for comics | one piece, naruto, etc. | Yes      |

#### Response Example

```json
{
  "status": true,
  "message": "Berhasil mendapatkan hasil pencarian",
  "keyword": "one piece",
  "url": "https://komiku.id/?s=one%20piece&post_type=manga",
  "total": 7,
  "data": [
    {
      "title": "One Piece: Ace Story",
      "altTitle": "One Piece: Cerita Ace",
      "slug": "one-piece-ace-story",
      "href": "/detail-komik/one-piece-ace-story/",
      "thumbnail": "https://cover.komiku.id/wp-content/uploads/2020/09/Komik-One-Piece-Ace-Story.png?resize=450,235&quality=60",
      "type": "Manga",
      "genre": "Aksi",
      "description": "Update 3 tahun lalu. Spin-Off dari serial One Piece yang menceritakan awal karir Portgas D. Ace menjadi bajak laut.",
      "chapter": {
        "awal": {
          "number": "Chapter 01",
          "link": "/baca-chapter/one-piece-ace-story-chapter-01/"
        },
        "terbaru": {
          "number": "Chapter 04",
          "link": "/baca-chapter/one-piece-ace-story-chapter-04/"
        }
      }
    },
    ...
  ]
}
```

#### Search Examples

Search for "naruto":

```
GET /search?q=naruto
```

Search for "one piece":

```
GET /search?q=one%20piece
```

### Comic Details

Get detailed information about a specific comic.

```
GET /detail-komik/:slug
```

Example:

```
GET /detail-komik/solo-leveling
```

#### Response Example

```json
{
  "title": "Solo Leveling",
  "alternativeTitle": "Na Honjaman Lebel-eob",
  "description": "10 years ago, after "the Gate" that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate...",
  "sinopsis": "10 years ago, after "the Gate" that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate...",
  "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2018/12/Komik-Solo-Leveling.png?quality=60",
  "info": {
    "Judul Komik": "Solo Leveling",
    "Judul Indonesia": "Berburu Sendirian",
    "Jenis Komik": "Manhwa",
    "Konsep Cerita": "Action",
    "Pengarang": "Chugong",
    "Status": "Completed",
    "Umur Pembaca": "17 Tahun (minimal)",
    "Cara Baca": "Kiri ke kanan"
  },
  "genres": ["Action", "Adventure", "Fantasy", "Shounen"],
  "slug": "solo-leveling",
  "firstChapter": {
    "title": "Chapter 1",
    "originalLink": "https://komiku.id/solo-leveling-chapter-1/",
    "apiLink": "/baca-chapter/solo-leveling/1",
    "chapterNumber": "1"
  },
  "latestChapter": {
    "title": "Chapter 179",
    "originalLink": "https://komiku.id/solo-leveling-chapter-179/",
    "apiLink": "/baca-chapter/solo-leveling/179",
    "chapterNumber": "179"
  },
  "chapters": [
    {
      "title": "Chapter 179",
      "originalLink": "https://komiku.id/solo-leveling-chapter-179/",
      "apiLink": "/baca-chapter/solo-leveling/179",
      "views": "1.2jt",
      "date": "22/01/2021",
      "chapterNumber": "179"
    },
    ...
  ],
  "similarKomik": [
    {
      "title": "The Beginning After The End",
      "originalLink": "https://komiku.id/manga/the-beginning-after-the-end/",
      "apiLink": "/detail-komik/the-beginning-after-the-end",
      "thumbnail": "https://thumbnail.komiku.id/wp-content/uploads/2019/03/Komik-The-Beginning-After-The-E.jpg?quality=60",
      "type": "Manhwa",
      "genres": "Fantasy",
      "synopsis": "King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability...",
      "views": "9.8jt",
      "slug": "the-beginning-after-the-end"
    },
    ...
  ]
}
```

#### Get Comic Details from URL

You can also fetch comic details using the full URL:

```
GET /detail-komik/url?url=https://komiku.id/manga/solo-leveling/
```

### Read Chapter

Read a specific chapter of a comic.

```
GET /baca-chapter/:slug/:chapter
```

Example:

```
GET /baca-chapter/solo-leveling/179
```

#### Response Example

```json
{
  "title": "Chapter 179",
  "mangaInfo": {
    "title": "Komik Solo Leveling",
    "originalLink": "https://komiku.id/manga/solo-leveling/",
    "apiLink": "/detail-komik/solo-leveling",
    "slug": "solo-leveling"
  },
  "description": "Chapter 179 dari Komik Solo Leveling.",
  "chapterInfo": {
    "Judul": "Solo Leveling Chapter 179",
    "Tanggal Rilis": "2021-01-22",
    "Arah Baca": "Kiri ke kanan"
  },
  "images": [
    {
      "src": "https://cdn.komiku.id/uploads2/28288-1.jpg",
      "alt": "Baca Komik Solo Leveling Chapter 179 Gambar 1",
      "id": "1",
      "fallbackSrc": "https://img.komiku.id/uploads2/28288-1.jpg"
    },
    ...
  ],
  "meta": {
    "chapterNumber": "179",
    "totalImages": 35,
    "publishDate": "2021-01-22T20:11:00+07:00",
    "viewAnalyticsUrl": "https://analytics.komiku.id/?idChapter=12345",
    "slug": "solo-leveling"
  },
  "navigation": {
    "prevChapter": {
      "originalLink": "https://komiku.id/solo-leveling-chapter-178/",
      "apiLink": "/baca-chapter/solo-leveling/178",
      "slug": "solo-leveling",
      "chapter": "178"
    },
    "nextChapter": null,
    "allChapters": "/detail-komik/solo-leveling"
  },
  "additionalDescription": "Kamu baru saja selesai membaca Solo Leveling Ch 179 bahasa Indo. Baca komik menarik lainnya dengan kualitas gambar HD dan gratis hanya di website Komiku."
}
```

#### Read Chapter from URL

You can also read a chapter using the full URL:

```
GET /baca-chapter/url?url=https://komiku.id/solo-leveling-chapter-179/
```

This endpoint will redirect to the standard chapter endpoint after extracting the slug and chapter number.

## Response Structure

All responses are in JSON format and generally follow these structures:

- **List endpoints** (`/rekomendasi`, `/trending`, `/terbaru`): Array of comic items
- **Detail endpoints** (`/detail-komik/:slug`): Single object with comprehensive information
- **Chapter endpoints** (`/baca-chapter/:slug/:chapter`): Single object with chapter data and images
- **Search endpoint** (`/search?q=keyword`): Object with search results and metadata

Most responses include these links:

- `originalLink`: Direct link to the source on Komiku.id
- `apiLink` or `apiDetailLink`: Internal API link for navigation between endpoints
- For search results, `href` provides the link to the comic detail page

## Status Codes

| Code | Description                      |
| ---- | -------------------------------- |
| 200  | Success                          |
| 400  | Bad request (invalid parameters) |
| 404  | Not found                        |
| 500  | Server error                     |

## Error Handling

Error responses follow this format:

```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

In development mode, error responses may also include a `stack` property.

## Deployment

### Deploy to Vercel

Project ini telah dikonfigurasi untuk deployment ke Vercel. Berikut langkah-langkah untuk men-deploy:

1. Buat akun di [Vercel](https://vercel.com) jika belum memiliki.
2. Install Vercel CLI (opsional):
   ```
   npm i -g vercel
   ```
3. Login ke Vercel:
   ```
   vercel login
   ```
4. Deploy project:

   ```
   vercel
   ```

   Atau deploy langsung dari dashboard Vercel dengan menghubungkan repository GitHub.

5. Untuk environment production:
   ```
   vercel --prod
   ```

Konfigurasi Vercel terdapat dalam file `vercel.json`, yang mengatur routing dan build settings untuk aplikasi Express.

### Fitur yang Dikonfigurasi:

- **CORS** - memungkinkan akses dari domain manapun.
- **Runtime Scaling** - otomatis menyesuaikan berdasarkan traffic.
- **Cron Jobs** - terjadwal setiap 2 jam untuk menjaga instance tetap aktif.

---

## Disclaimer

This API scrapes data from Komiku.id and is intended for educational purposes only. The creators of this API are not responsible for any misuse or violation of Komiku.id's terms of service.
