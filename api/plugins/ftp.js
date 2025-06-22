const fs = require("fs");
const path = require("path");
const { Client } = require("basic-ftp");
const Plugin = require("./../src/models/plugin");

class FTPTool extends Plugin {
  description() {
    return "FTP";
  }

  name() {
    return "FTP";
  }

  icon() {
    return "📤";
  }

  paramsDefinition() {
    return [
      {
        name: "Host IP",
        alias: "host",
        type: "string",
        default: undefined,
        value: undefined,
      },
      {
        name: "Username",
        alias: "username",
        type: "string",
        default: undefined,
        value: undefined,
      },
      {
        name: "Password",
        alias: "password",
        type: "string",
        default: undefined,
        value: undefined,
      },
      {
        name: "Local file path",
        alias: "local_file_path",
        type: "string",
        default: undefined,
        value: undefined,
      },
      {
        name: "Remote folder path",
        alias: "remote_folder_path",
        type: "string",
        default: "/",
        value: undefined,
      },
    ];
  }

  getFileNameAndExtension(path) {
    // Get everything after the last slash (in case of a full path)
    const fileName = path.split("\\").pop().split("/").pop();

    // Split into name and extension
    const lastDotIndex = fileName.lastIndexOf(".");
    const name =
      lastDotIndex === -1 ? fileName : fileName.slice(0, lastDotIndex);
    const ext = lastDotIndex === -1 ? "" : fileName.slice(lastDotIndex + 1);

    return `${name}.${ext}`;
  }

  async logic(params = {}) {
    let message = "";
    let size = 0;
    let error = false;
    await new Promise(async (resolve) => {
      const client = new Client();
      client.ftp.verbose = true; // Optional: enable verbose logging

      try {
        this.log("connecting to host: " + params.host);
        // Connect to the FTP server
        await client.access({
          host: params.host,
          user: params.username,
          password: params.password,
          port: 21, // default FTP port
          secure: false, // set to true if using FTPS
        });

        // Local file to upload
        const localFilePath = path.resolve(__dirname, params.local_file_path);

        // Remote path where the file will be uploaded
        const remoteFilePath = `${
          params.remote_folder_path
        }/${this.getFileNameAndExtension(params.local_file_path)}`;

        this.log(
          `Prepering file: LOCAL: ${localFilePath}, REMOTE: ${remoteFilePath}`
        );

        const fileStream = fs.createReadStream(localFilePath);

        // Track progress
        let transferred = 0;
        const stat = fs.statSync(localFilePath);
        const totalSize = stat.size;
        size = stat.size;
        fileStream.on("data", (chunk) => {
          transferred += chunk.length;

          const percent = ((transferred / totalSize) * 100).toFixed(2);
          // this.log(`⬆️ Uploading: ${percent}% complete\r`);
        });

        fileStream.on("end", () => {
          this.log("✅ File upload completed.");
          resolve();
        });

        // Upload the file
        await client.uploadFrom(fileStream, remoteFilePath);
      } catch (err) {
        this.log("❌ Error uploading file: " + err.message, "error");
        console.error("❌ Error uploading file:", err.message);
        message = err.message;
        error = true;
        resolve();
      } finally {
        // Close connection
        await client.close();
      }
    });

    return {
      status: {
        error: error,
        message: message,
      },
      output: { size: this.formatBytes(size) },
    };
  }

  formatBytes(bytes) {
    // If the input is less than 1 KB, return in bytes
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    // If the input is between 1 KB and 1 MB, return in KB
    else if (bytes >= 1024 && bytes < 1024 * 1024) {
      const kb = (bytes / 1024).toFixed(2); // Convert to KB with 2 decimal places
      return `${kb} KB`;
    }
    // If the input is 1 MB or more, return in MB
    else {
      const mb = (bytes / (1024 * 1024)).toFixed(2); // Convert to MB with 2 decimal places
      return `${mb} MB`;
    }
  }
}
module.exports = FTPTool;
