const files = require.context("./modules", true, /\.js$/);
files.keys().forEach((key) => {
  routes = routes.concat(files(key)); // 读取出文件中的default模块
});
