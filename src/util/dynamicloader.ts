import fs from "fs";
export default class DynamicLoader {
  public static loadClasses(path: string, constructorArgs: any[] = []) {
    // Add trailing slash
    path = path.endsWith("/") ? path : path + "/";

    let res: any[] = [];
    fs.readdirSync(path).forEach((file) => {
      // Skip non-js files, such as map files.
      if (!file.endsWith(".js")) return;

      // Load interaction
      const obj = require(path + file);

      res.push(new obj.default(...constructorArgs));
    });
    return res;
  }

  public static loadFunctions(path: string, args: any[] = []) {
    // Add trailing slash
    path = path.endsWith("/") ? path : path + "/";

    fs.readdirSync(path).forEach((file) => {
      // Skip non-js files, such as map files.
      if (!file.endsWith(".js")) return;

      // Load and run function
      require(path + file)(...args);
    });
  }
}
