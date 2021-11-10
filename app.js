const http = require("http");
const path = require("path");
const os = require("os");

const {
  readFile,
  readdir,
  existsSync,
  createReadStream,
} = require("fs");

// const ROOT_PATH = '/Users/kanghaeseok/storage/emulated/0';
// const ANIMAL_PATH = ROOT_PATH + '/DCIM/Screenshots'
const ROOT_PATH = '/storage/emulated/0';
const ANIMAL_PATH = ROOT_PATH + '/Camera/Screenshots'
const CHARACTER_PATH = ROOT_PATH + '/Download'

const getFiles = (source) => {
  return new Promise((resolve, reject) => {
    readdir(
      decodeURIComponent(source),
      { withFileTypes: true },
      (err, files) => {
        resolve(
          files
            .filter((file) => file.isFile() && file.name !== ".DS_Store")
            .map((file) => `${file.name}`)
        );
      }
    );
  });
};

const getIndexPage = () => {
  return new Promise((resolve, reject) => {
    readFile("./index.html", (err, html) => {
      if (err) throw err;
      resolve(html);
    });
  });
};

const startServer = () => {
  http
    .createServer((request, response) => {
      if (request.url === "/") {
        getIndexPage().then((html) => {
          response.writeHead(200);
          response.write(html);
          response.end();
        });
      } else if (request.url === "/results") {
        getFiles(CHARACTER_PATH).then((characters) => {
          getFiles(ANIMAL_PATH).then((animals) => {
            response.writeHead(200);
            response.write(JSON.stringify({ animals, characters }));
            response.end();
          });
        });
      } else {
        const animalStaticPath = path.join(ANIMAL_PATH, decodeURIComponent(request.url))
        const characterStaticPath = path.join(CHARACTER_PATH, decodeURIComponent(request.url))
        if (existsSync(animalStaticPath)) {
          const s = createReadStream(animalStaticPath);
          s.on("open", () => {
            s.pipe(response);
          });
        } else if (existsSync(characterStaticPath)) {
          const s = createReadStream(characterStaticPath);
          s.on("open", () => {
            s.pipe(response);
          });
        } else {
          getIndexPage().then((html) => {
            response.writeHead(200);
            response.write(html);
            response.end();
          });
        }
      }
    })
    .listen(8888);
};

startServer();
