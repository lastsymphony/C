const express = require("express");
const app = express();
const port = 3000;

const rekomendasiRoute = require("./routes/rekomendasi");
const trendingRoute = require("./routes/trending");
const terbaruRoute = require("./routes/terbaru");
const pustakaRoute = require("./routes/pustaka");
const komikPopulerRoute = require("./routes/komik-populer");
const detailKomikRoute = require("./routes/detail-komik");
const bacaChapterRoute = require("./routes/baca-chapter");

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
