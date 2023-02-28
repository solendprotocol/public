import packageJson from "./package.json";
const fs = require("fs");

const newPackageJson = Object.assign({}, packageJson);

newPackageJson["main"] = "./index.js";
newPackageJson["module"] = "./index.js";
newPackageJson["types"] = "./index.js";
newPackageJson["files"] = ["."];
newPackageJson["private"] = false;

fs.writeFile(
  "./dist/package.json",
  JSON.stringify(newPackageJson),
  "utf8",
  (err: any) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("package.json has been created for publish in ./dist");
  }
);
