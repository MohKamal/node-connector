const Plugin = require("./../src/models/plugin");

class Example extends Plugin {
  name() {
    return "Example Plugin";
  }

  description() {
    return "A simple plugin, an empty plugin, only for devs to see a plugin structure";
  }

  icon() {
    return "🌟";
  }

  paramsDefinition() {
    return [];
  }

  async logic(params = {}) {
    console.log("This is an empty plugin", params);
    return {
      status: {
        error: false,
        message: "",
      },
      output: {
        example: 0,
      },
    };
  }
}

module.exports = Example;
