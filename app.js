const http = require("http");
const path = require("path");
const {
  readFile,
  readdirSync,
  readdir,
  existsSync,
  createReadStream,
} = require("fs");

const getAnimals = (source) => {
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const getFiles = (source) => {
  return new Promise((resolve, reject) => {
    readdir(source, { withFileTypes: true }, (err, files) => {
      resolve(
        files
          .filter((file) => file.isFile() && file.name !== ".DS_Store")
          .map((file) => `${source}/${file.name}`)
      );
    });
  });
};

const getIndexPage = () => {
  return new Promise((resolve, reject) => {
    readFile("./index2.html", (err, html) => {
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
      } else if (request.url === "/animals") {
        response.writeHead(200);
        response.write(JSON.stringify(getAnimals("/photo/reference/animal")));
        response.end();
      } else if (request.url === "/test") {
        getFiles("photo/reference/animal").then((result) => {
          response.writeHead(200);
          response.write(JSON.stringify(result));
          response.end();
        });
      } else {
        const staticPath = path.join(__dirname, request.url);
        if (existsSync(staticPath)) {
          const s = createReadStream(staticPath);
          s.on("open", () => {
            s.pipe(response);
          });
        } else {
          response.writeHead(404);
          response.end();
        }
      }
    })
    .listen(8888);
};

startServer();
