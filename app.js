const http = require("http");
const path = require("path");
const os = require("os");

const {
  readFile,
  readdirSync,
  readdir,
  existsSync,
  createReadStream,
  rename,
} = require("fs");

const getAnimals = (source) => {
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const getFiles = (source) => {
  return new Promise((resolve, reject) => {
    readdir(
      decodeURIComponent(source),
      { withFileTypes: true },
      (err, files) => {
        resolve(
          files
            .filter((file) => file.isFile() && file.name !== ".DS_Store")
            .map((file) => `${source}/${file.name}`)
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
      } else if (request.url === "/animals") {
        response.writeHead(200);
        response.write(JSON.stringify(getAnimals("photo/reference/animal")));
        response.end();
      } else if (request.url.indexOf("/results") > -1) {
        let params;
        const sParams = request.url.split("?")[1];
        if (sParams) {
          const liParams = sParams.split("&").map((item) => item.split("="));
          params = Object.fromEntries(liParams);
        }
        if (params.hasOwnProperty("dir")) {
          getFiles(`photo/reference/animal/${params.dir}`).then((animals) => {
            getFiles("photo/reference/character").then((characters) => {
              response.writeHead(200);
              response.write(JSON.stringify({ animals, characters }));
              response.end();
            });
          });
        } else {
          response.writeHead(404);
          response.end();
        }
      } else if (request.url === "/create-folder" && request.method == "POST") {
        let body = "";
        request.on("data", (data) => {
          body += data;
        });
        request.on("end", () => {
          const { animalName, animalPath } = JSON.parse(body);
          const imgPath = ((splits) =>
            path.join(
              __dirname,
              decodeURIComponent(splits[splits.length - 1])
            ))(animalPath.split(`${request.headers.host}/`));
          console.log(imgPath);
          console.log(imgPath.replace("1", "2"));
          //   rename(imgPath, imgPath.replace("1", "2"));
          // rename(imgPath, imgPath.replace("1", "2"), (err) => {
          //   if (err) throw err;
          //   console.log("Rename complete!");
          // });
        });
      } else {
        const staticPath = path.join(
          __dirname,
          decodeURIComponent(request.url)
        );
        if (existsSync(staticPath)) {
          const s = createReadStream(staticPath);
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
