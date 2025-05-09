const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Middleware for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const rekomendasiRoute = require("./routes/rekomendasi");
const trendingRoute = require("./routes/trending");
const terbaruRoute = require("./routes/terbaru");
const pustakaRoute = require("./routes/pustaka");
const komikPopulerRoute = require("./routes/komik-populer");
const detailKomikRoute = require("./routes/detail-komik");
const bacaChapterRoute = require("./routes/baca-chapter");

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Mangaverse API",
    version: "1.0.0",
    endpoints: [
      "/rekomendasi",
      "/trending",
      "/terbaru",
      "/pustaka",
      "/komik-populer",
      "/detail-komik/:slug",
      "/baca-chapter/:slug/:chapter",
    ],
  });
});

app.use("/rekomendasi", rekomendasiRoute);
app.use("/trending", trendingRoute);
app.use("/terbaru", terbaruRoute);
app.use("/pustaka", pustakaRoute);
app.use("/komik-populer", komikPopulerRoute);
app.use("/detail-komik", detailKomikRoute);
app.use("/baca-chapter", bacaChapterRoute);

app.listen(port, () => {
  console.log(`Server jalan di http://localhost:${port}`);
});

module.exports = app;
