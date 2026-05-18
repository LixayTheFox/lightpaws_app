const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = async function applyWindowsIcon(context) {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const projectDir = context.packager.projectDir;
  const productFilename = context.packager.appInfo.productFilename;
  const exePath = path.join(context.appOutDir, `${productFilename}.exe`);
  const iconPath = path.join(projectDir, "src", "assets", "app-icon.ico");
  const rceditPath = path.join(
    projectDir,
    "node_modules",
    "electron-winstaller",
    "vendor",
    "rcedit.exe"
  );

  for (const filePath of [exePath, iconPath, rceditPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file needed to apply Windows icon: ${filePath}`);
    }
  }

  execFileSync(rceditPath, [exePath, "--set-icon", iconPath], {
    stdio: "inherit"
  });
};
