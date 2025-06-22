const fs = require("fs");

class IO {
  write(data, filename) {
    // Convert object to JSON string
    const jsonData = JSON.stringify(data, null, 2);
    if (!filename.endsWith(".json")) filename += ".json";
    // Write JSON string to file
    fs.writeFileSync(filename, jsonData, "utf8", (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("Data written to data.json");
      }
    });
  }

  read(filename) {
    if (!filename.endsWith(".json")) filename += ".json";

    // Read JSON file
    const data = fs.readFileSync(filename, "utf8");
    return JSON.parse(data);
  }
}

module.exports = IO;
