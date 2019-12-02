const express = require("express");
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const bodyParser = require("body-parser");
const multer = require("multer");
const zip = require("express-easy-zip");
const fs = require("fs");
const path = require("path");
const uploadFiles = "uploadFiles";
const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, "tmp");
    },
    filename: function(req, file, cb) {
      console.log(file);
      cb(null, Date.now() + "-ts-" + file.originalname);
    }
  })
});
const app = express();
const port = 3000;
const distImags = "./static/minified";

app.use(bodyParser.json());
app.use(express.static("static"));

app.post("/file-upload", upload.single("file"), function(req, res) {
  const file = __dirname + "/" + uploadFiles + "/" + req.file.filename;
  fs.rename(req.file.path, file, async function(err) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      const minFileUrl = await minify(file);
      res.json({
        message: "File uploaded successfully",
        filename: req.file.filename,
        minFileUrl
      });
    }
  });
});

app.use(zip());
app.use("/file-download", function(req, res) {
  const files = req.body.map(item => ({
    path: path.join(__dirname, "./" + item.minFileUrl),
    name: item.minFileUrl.split("-ts-")[1]
  }));
  res
    .zip({
      files,
      filename: "zip-file-name.zip"
    })
    .then(res => {
      console.log(res);
      files.map(file =>
        searchAndDeleteFiles(
          __dirname + "/" + uploadFiles,
          __dirname + "/" + distImags
        )(file.name)
      );
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

async function minify(file) {
  const resFile = await imagemin([file], {
    destination: `./${distImags}`,
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8]
      })
    ]
  });
  return resFile[0].destinationPath;
}

function searchAndDeleteFiles(...dirs) {
  return function(originFileName) {
    dirs.map(dir =>
      fs.readdir(dir, (err, fileList) => {
        if (err) return console.log(err);
        fileList.map(file => {
          if (file.indexOf(originFileName) !== -1) {
            fs.unlink(dir + "/" + file, err => {
              if (err) return console.log(err);
            });
          }
        });
      })
    );
  };
}
