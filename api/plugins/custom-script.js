const Plugin = require("./../src/models/plugin");
const vm = require("vm");

class CustomScript extends Plugin {
  description() {
    return "You can write a custom NodeJs (Javascript) code and it will be executed in the local system.";
  }

  name() {
    return "Custom Script";
  }

  icon() {
    return "📜";
  }

  paramsDefinition() {
    return [
      {
        name: "Script",
        alias: "script",
        type: "big_string",
        default: "// write a javascript code",
        value: undefined,
      },
    ];
  }

  async logic(params = {}) {
    let message = "Code executed";
    let error = false;
    let result = {};
    await new Promise(async (resolve) => {
      // Define a sandboxed context for the code to run in
      const sandbox = {
        console: console, // Allow access to the console object
      };

      // Create a context from the sandbox
      vm.createContext(sandbox);

      try {
        console.log(params);
        // Run the custom code in the sandboxed context
        result = vm.runInContext(params.script, sandbox);

        // Output the result of the executed code
        console.log("Result:", result); // Outputs: Result: 52
        message = `Code executed: ${result}`;
      } catch (err) {
        console.error("Error executing custom code:", err.message);
        error = true;
        message = `Error executing custom code: ${err.message}`;
      }
      resolve();
    });

    return {
      status: {
        error: error,
        message: message,
      },
      output: result,
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
module.exports = CustomScript;
