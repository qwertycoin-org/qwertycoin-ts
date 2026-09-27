"use strict"

const path = require("path");
const configBase = require("./webpack.base.js");

let configQwertycoinWebWorker = Object.assign({}, configBase, {
  name: "Qwertycoin web worker config",
  entry: "./src/main/ts/common/QwertycoinWebWorker.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "qwertycoin.worker.js"
  },
});

module.exports = configQwertycoinWebWorker;