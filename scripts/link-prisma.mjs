import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const linkPath = path.join(projectRoot, "node_modules", "@prisma", "client", ".prisma");
const targetPath = path.join("..", "..", ".prisma");

function ensureSymlink() {
  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      return;
    }

    fs.rmSync(linkPath, { recursive: true, force: true });
  } catch {
    // does not exist
  }

  fs.symlinkSync(targetPath, linkPath);
}

ensureSymlink();
