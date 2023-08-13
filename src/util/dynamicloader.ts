import { promises as fs } from "fs";

type Class = {
  default: new (...params: unknown[]) => object;
};

export default class DynamicLoader {
  public static async loadClasses(
    path: string,
    constructorArgs: unknown[] = []
  ) {
    // Add trailing slash
    path = path.endsWith("/") ? path : path + "/";

    let res: object[] = [];
    const files = await fs.readdir(path);
    files.forEach((file) => {
      // Skip non-js files, such as map files.
      if (!file.endsWith(".js")) return;

      // Load interaction
      const obj: Class = require(path + file);
      res.push(new obj.default(...constructorArgs));
    });
    return res;
  }

  public static async loadFunctions(path: string, args: unknown[] = []) {
    // Add trailing slash
    path = path.endsWith("/") ? path : path + "/";

    const files = await fs.readdir(path);
    files.forEach((file) => {
      // Skip non-js files, such as map files.
      if (!file.endsWith(".js")) return;

      // Load and run function
      require(path + file)(...args);
    });
  }
}
