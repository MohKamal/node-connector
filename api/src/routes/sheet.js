const express = require("express");
const router = express.Router();
const ToolLoader = require("./../tool-loader");
const SQLiteManager = require("./../sqlite-manager");
const SheetManager = require("../sheet-manager");
const Node = require("../node");
const Executer = require("../executer");

// Protected route example
router.get(
  "/plugins/list",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const toolloader = new ToolLoader();
    const classes = toolloader.load("../plugins");

    const list = [];
    for (const Class of classes) {
      const instance = new Class();
      list.push({
        id: Class.name,
        name: instance.name(),
        description: instance.description(),
        icon: instance.icon(),
        default_params: instance.paramsDefinition(),
      });
      // You could call methods here or check for specific ones
    }
    res.json(list);
  }
);

router.get(
  "/list",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    let sheets = [];
    await new SQLiteManager().select("sheets").then((_sheets) => {
      sheets = _sheets;
    });
    res.json(sheets);
  }
);

router.get(
  "/get",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const sheet = await new SheetManager().load(req.query.id);
    res.json(sheet);
  }
);

router.post(
  "/create",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const sheet = await new SheetManager().create(req.body.name);
    res.json(sheet);
  }
);

router.put(
  "/update",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const sheet = await new SheetManager().load(req.body.sheet.uid);
    if (sheet) {
      sheet.name = req.body.sheet.name;
      sheet.data.nodes = req.body.sheet.data.nodes;
      res.json({ message: "sheet updated" });
      return;
    }
    res.statusCode = 500;
    res.json({ message: "sheet no found" });
  }
);

router.post(
  "/node",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const sheetUid = req.body.sheetId;
    const sheet = await new SheetManager().load(sheetUid);
    if (sheet) {
      const node = new Node(
        req.body.title,
        req.body.pluginId,
        req.body.position,
        req.body.params
      );
      await new SheetManager().addNode(sheet, node);
      res.json({ id: node.id, message: "created" });
      return;
    }
    res.statusCode = 500;
    res.json({ message: "sheet no found" });
  }
);

router.get(
  "/node/execute",
  require("../middleware/authenticateTokenFromQuery"),
  async (req, res) => {
    const sheetUid = req.query.sheetId;
    const sheets = new SheetManager();
    const sheet = await sheets.load(sheetUid);
    if (sheet) {
      const node = sheet.data.nodes.find((x) => x.id === req.query.nodeId);
      if (node) {
        const store = sheets.getNodeStore(sheet);
        const exec = store.find((x) => x.node.id === node.id);
        // Set headers for SSE
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let done = false;
        const debug = async (data) => {
          if (data) {
            if (data.id) {
              if (data.id === "chain-complete") {
                res.end();
                done = true;
                return;
              }
            }
            const eventData = `data: ${JSON.stringify(data)}\n\n`;
            res.write(eventData); // Send data to the client
          }
        };
        try {
          await Executer.executeNodes(
            store,
            node.id,
            "./../plugins",
            debug,
            () => {
              res.end();
            }
          );
          // await exec.trigger(store, "./../plugins", {}, debug);
        } catch (err) {
          debug({
            id: node.id,
            result: {},
            error: true,
            message: `Error while executing: ${err.message}`,
            stage: "executing",
          });
        }
        // Handle client disconnect
        req.on("close", () => {
          res.end(); // End the response
        });
        return;
      }
      res.json({ message: "node not found" });
      return;
    }
    res.statusCode = 500;
    res.json({ message: "sheet no found" });
  }
);

router.put(
  "/node",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const sheetUid = req.body.sheetId;
    const sheet = await new SheetManager().load(sheetUid);
    const _node = req.body.node;
    if (sheet) {
      const node = sheet.data.nodes.find((x) => x.id === _node.id);
      if (node) {
        node.title = _node.title;
        node.inputs = _node.inputs;
        node.outputs = _node.outputs;
        node.position = _node.position;
        node.params = _node.params;
        await new SheetManager().save(sheet);
        res.json({ message: "updated" });
        return;
      }
      res.statusCode = 500;
      res.json({ message: "node no found" });
      return;
    }
    res.statusCode = 500;
    res.json({ message: "sheet no found" });
  }
);

router.put(
  "/node/delete",
  require("../middleware/authenticateToken"),
  async (req, res) => {
    const sheet = await new SheetManager().load(req.body.sheetId);
    const _node = req.body.node;
    if (sheet) {
      sheet.data.nodes.forEach((node) => {
        node.inputs = node.inputs.filter((x) => x !== _node.id);
        node.outputs = node.outputs.filter((x) => x !== _node.id);
      });
      sheet.data.nodes = sheet.data.nodes.filter((x) => x.id !== _node.id);
      await new SheetManager().save(sheet);
      res.json({ message: "node deleted" });
      return;
    }
    res.statusCode = 500;
    res.json({ message: "sheet no found" });
  }
);

module.exports = router;
