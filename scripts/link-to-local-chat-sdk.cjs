/* eslint-disable @typescript-eslint/no-var-requires */
const { program } = require("commander");
const {
  symlinkSync,
  existsSync,
  rmSync,
  cpSync,
  readFileSync,
  chmodSync,
  mkdirSync,
} = require("fs");
const { resolve, join, dirname } = require("path");

program
  .description(
    "Link local Chat-sdk build directory to the current node_modules tree",
  )
  .argument("<CHAT_REPO>", "Chat sdk local repository")
  .option("--link", "Use symbolic links instead of hard copy")
  .parse(process.argv);

const [chatRepo] = program.args;
const opts = program.opts();
const mode = opts.link ? "link" : "copy";
const folders = ["src", "dist"];
const files = ["package.json"]; // Add package.json as a required file

const packages = [{ path: ".", mode, folders, files }];

function createBinLinks(chatRepo, targetNodeModules) {
  try {
    // Read package.json from the chat repo
    const packageJsonPath = resolve(chatRepo, "package.json");
    if (!existsSync(packageJsonPath)) {
      console.log("No package.json found, skipping bin links");
      return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    if (!packageJson.bin) {
      console.log("No bin field in package.json, skipping bin links");
      return;
    }

    const binDir = resolve(targetNodeModules, ".bin");
    const packageDir = resolve(targetNodeModules, "@bosonprotocol/chat-sdk");

    // Ensure .bin directory exists
    if (!existsSync(binDir)) {
      mkdirSync(binDir, { recursive: true });
    }

    // Handle both string and object bin formats
    const binEntries =
      typeof packageJson.bin === "string"
        ? [[packageJson.name.split("/").pop(), packageJson.bin]]
        : Object.entries(packageJson.bin);

    for (const [binName, binPath] of binEntries) {
      const sourceBin = resolve(packageDir, binPath);
      const targetBin = resolve(binDir, binName);

      // Remove existing bin link if it exists
      if (existsSync(targetBin)) {
        rmSync(targetBin, { recursive: true });
      }

      if (existsSync(sourceBin)) {
        console.log(`Creating bin link: ${binName} --> ${binPath}`);

        // Create symlink to the actual binary
        symlinkSync(
          sourceBin,
          targetBin,
          process.platform === "win32" ? "junction" : "file",
        );

        // Make sure the binary is executable (Unix-like systems)
        if (process.platform !== "win32") {
          try {
            chmodSync(sourceBin, 0o755);
          } catch (e) {
            console.warn(
              `Warning: Could not make ${sourceBin} executable:`,
              e.message,
            );
          }
        }
      } else {
        console.warn(`Warning: Binary source ${sourceBin} does not exist`);
      }
    }
  } catch (error) {
    console.error("Error creating bin links:", error.message);
  }
}

async function main() {
  const targetNodeModules = resolve(__dirname, "..", "node_modules");
  const packageDir = resolve(targetNodeModules, "@bosonprotocol/chat-sdk");

  // Ensure the target package directory exists
  if (!existsSync(packageDir)) {
    console.log(`Creating package directory: ${packageDir}`);
    mkdirSync(packageDir, { recursive: true });
  }

  for (const pkg of packages) {
    // Handle folders
    for (const folder of pkg.folders) {
      const target = `${resolve(chatRepo, pkg.path, folder)}`;
      if (!existsSync(target)) {
        console.error(`Target ${target} does not exist.`);
        continue;
      }
      const linkPath = `${resolve(packageDir, pkg.path, folder)}`;

      while (existsSync(linkPath)) {
        // remove linkPath first
        rmSync(linkPath, { recursive: true });
        await new Promise((r) => setTimeout(r, 200));
      }
      if (pkg.mode === "link") {
        console.log(`Create link ${linkPath} --> ${target}`);
        symlinkSync(target, linkPath, "junction");
      }
      if (pkg.mode === "copy") {
        console.log(`Copy ${target} into ${linkPath}`);
        cpSync(target, linkPath, {
          recursive: true,
          force: true,
          preserveTimestamps: true,
        });
      }
    }

    // Handle individual files (like package.json)
    if (pkg.files) {
      for (const file of pkg.files) {
        const target = `${resolve(chatRepo, pkg.path, file)}`;
        if (!existsSync(target)) {
          console.error(`Target file ${target} does not exist.`);
          continue;
        }
        const linkPath = `${resolve(packageDir, pkg.path, file)}`;

        // Remove existing file/link if it exists
        if (existsSync(linkPath)) {
          rmSync(linkPath, { recursive: true });
          await new Promise((r) => setTimeout(r, 50));
        }

        if (pkg.mode === "link") {
          console.log(`Create file link ${linkPath} --> ${target}`);
          symlinkSync(target, linkPath, "file");
        }
        if (pkg.mode === "copy") {
          console.log(`Copy file ${target} to ${linkPath}`);
          cpSync(target, linkPath, {
            force: true,
            preserveTimestamps: true,
          });
        }
      }
    }
  }

  // Create bin links after copying/linking the main package
  createBinLinks(chatRepo, targetNodeModules);
}

main()
  .then(() => console.log("success"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
