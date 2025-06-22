const ToolLoader = require("./tool-loader");

class NodeExecuter {
  constructor(node) {
    this.id = node.id;
    this.node = node;
    this.result = null; // stores result after execution
    this.isExecuted = false;
    this.dependencyResults = {}; // holds results from input nodes
    this.waitingFor = new Set(this.node.inputs); // set of unresolved dependencies
    this.resolveCallback = null; // callback used to resolve promise
  }

  getParams(node) {
    const params = {};
    for (const p in node.params) {
      const param = node.params[p];
      if (param) {
        params[param.alias] = param.value ? param.value : param.default;
      }
    }
    return params;
  }

  interceptLog(baseClass, nodeId, sseEvent = undefined) {
    const originalLog = baseClass.prototype.log;

    baseClass.prototype.log = function (...args) {
      // Call original log method to get the log object
      const logEntry = originalLog.apply(this, args);

      if (sseEvent)
        sseEvent({
          id: nodeId,
          result: {},
          error: logEntry.type === "error" ? true : false,
          message: logEntry.message,
          stage: "executing",
        });

      return logEntry; // still return the object as expected
    };
  }

  // Execute the node logic
  async execute(nodesStore, pluginsFolder, sseEventCallback = undefined) {
    console.log(
      this.node.title,
      "[execute]",
      nodesStore,
      pluginsFolder,
      sseEventCallback
    );

    if (sseEventCallback)
      sseEventCallback({
        id: this.node.id,
        result: {},
        error: false,
        message: "",
        stage: "executing",
      });

    console.log(this.node.title, "[execute - isExecuted]", this.isExecuted);
    if (this.isExecuted) return this.result;

    let inputParams = { ...this.getParams(this.node), input: {} };

    // Merge in results from input nodes
    for (let nodeId of this.node.inputs) {
      const execNode = nodesStore.find((node) => node.node.id === nodeId);
      if (execNode) {
        if (execNode.isExecuted) {
          inputParams.input = {
            ...inputParams.input,
            ...execNode.result.output,
          };
        }
      }
    }
    console.log(this.node.title, "[inputParams]", inputParams);

    try {
      const toolloader = new ToolLoader();
      const classes = toolloader.load(pluginsFolder);
      const InstanceClass = classes.find((x) => x.name === this.node.className);
      if (InstanceClass) {
        console.log(this.node.title, "[InstanceClass]", InstanceClass);
        this.interceptLog(InstanceClass, this.node.id, sseEventCallback);
        const instance = new InstanceClass();
        const result = await instance.logic(inputParams);
        this.result = result;
        console.log(this.node.title, "[result]", this.result);
        this.isExecuted = true;
        if (sseEventCallback)
          sseEventCallback({
            id: this.node.id,
            result: result.output,
            error: result.status.error,
            message: result.status.message,
            stage: "executed",
          });
        // Notify dependent nodes that we've completed
        this.notifyOutputs(nodesStore, pluginsFolder, sseEventCallback);

        // Resolve any waiting promise
        if (this.resolveCallback) {
          console.log(
            this.node.title,
            "[resolveCallback]",
            this.resolveCallback
          );
          this.resolveCallback(result);
          this.resolveCallback = null;
        }

        return result;
      } else {
        if (sseEventCallback)
          sseEventCallback({
            id: this.node.id,
            result: "Plugin not found: " + this.node.className,
            error: true,
            stage: "executed",
          });
        console.error("Plugin not found", this.node.className);
      }
    } catch (err) {
      console.error(`Error executing node ${this.node.name}:`, err);
      if (sseEventCallback)
        sseEventCallback({
          id: this.node.id,
          result: `Error executing node ${this.node.name}: ${err.message}`,
          error: true,
          stage: "executed",
        });
    }

    return this.result;
  }

  // Called by input nodes when they finish execution
  notifyInputCompleted(
    nodeId,
    result,
    pluginsFolder,
    nodesStore,
    sseEventCallback = undefined
  ) {
    console.log(this.node.title, "[notifyInputCompleted]");
    if (this.waitingFor.has(nodeId)) {
      this.dependencyResults[nodeId] = result;
      this.waitingFor.delete(nodeId);
      console.log(this.node.title, "[waitingFor]", this.waitingFor.size);

      if (this.waitingFor.size === 0) {
        // All dependencies resolved, now execute
        this.execute(nodesStore, pluginsFolder, sseEventCallback);
      }
    }
  }

  // Tell output nodes that we've finished
  notifyOutputs(nodesStore, pluginsFolder, sseEventCallback = undefined) {
    console.log(this.node.title, "[notifyOutputs]");
    for (let outputId of this.node.outputs) {
      const outputNode = nodesStore.find((node) => node.node.id === outputId);
      if (outputNode) {
        console.log(
          this.node.title,
          "[notifyOutputs - outputNode]",
          outputNode
        );
        outputNode.notifyInputCompleted(
          this.node.id,
          this.result,
          pluginsFolder,
          nodesStore,
          sseEventCallback
        );
      }
    }
  }

  // Manual trigger with optional override params
  _trigger(
    nodesStore,
    pluginsFolder,
    overrideParams = {},
    sseEventCallback = undefined
  ) {
    this.params = { ...this.params, inputs: overrideParams };
    return new Promise((resolve) => {
      if (this.isExecuted) {
        resolve(this.result);
      } else {
        this.resolveCallback = resolve;
        this.execute(nodesStore, pluginsFolder, sseEventCallback);
      }
    });
  }

  // Manual trigger with optional override params
  trigger(
    nodesStore,
    pluginsFolder,
    overrideParams = {},
    sseEventCallback = undefined
  ) {
    this.params = { ...this.params, inputs: overrideParams };
    console.log(this.node.title, "[trigger]", this.params);

    // Track all promises for nodes in the chain
    const allPromises = [];
    const executeNodeAndTrack = (node) => {
      const promise = node.execute(nodesStore, pluginsFolder, sseEventCallback);
      console.log(this.node.title, "[executeNodeAndTrack]", promise);
      allPromises.push(promise);
      return promise;
    };

    // Start execution from the current node
    const startExecution = async () => {
      console.log(this.node.title, "[startExecution]");

      await executeNodeAndTrack(this);
      console.log(this.node.title, "[executeNodeAndTrack Done]", allPromises);

      // Wait for all nodes in the chain to complete
      await Promise.all(allPromises);
      console.log(this.node.title, "[allPromises Done]");

      // Final SSE callback to indicate completion of the entire chain
      if (sseEventCallback) {
        console.log(
          this.node.title,
          "[allPromises Done]",
          "[sseEventCallback]",
          sseEventCallback
        );
        sseEventCallback({
          id: "chain-complete",
          result: "All nodes executed successfully.",
          error: false,
        });
      }
    };

    return new Promise(async (resolve) => {
      console.log(this.node.title, "[IsExecuted]", this.isExecuted);
      if (this.isExecuted) {
        console.log(this.node.title, "[IsExecuted True]", this.result);
        resolve(this.result);
      } else {
        console.log(this.node.title, "[IsExecuted False]");
        this.resolveCallback = resolve;
        await startExecution();
      }
    });
  }
}

module.exports = NodeExecuter;
