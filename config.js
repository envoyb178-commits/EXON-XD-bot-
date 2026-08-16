// config.js
const config = {
  ACR_HOST: process.env.ACR_HOST || "identify-ap-southeast-1.acrcloud.com",
  ACR_KEY: process.env.ACR_KEY || "DzRElyh7ShMMF7zllzD2R7kaXc3WINHI90GhD25s",
  ACR_SECRET: process.env.ACR_SECRET || "34c01d849adb3d8cc6e852ebe51bc2e2",
  SHAZAM_API_KEY: process.env.SHAZAM_API_KEY || "LOfGXeSeIPxVAUgi1nQL5Tv6ELkNDZH1fjIeW24A13BLnnRz3bHMlxYg1KECase6",
  AUDD_API_KEY: process.env.AUDD_API_KEY || "test"
};

export default config;