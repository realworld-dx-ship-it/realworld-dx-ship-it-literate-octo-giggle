const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildReply } = require("../src/handler");

describe("buildReply", () => {
  it("echoes the received text", () => {
    const reply = buildReply("hello");
    assert.deepStrictEqual(reply, {
      type: "text",
      text: "Received: hello",
    });
  });

  it("handles empty string", () => {
    const reply = buildReply("");
    assert.deepStrictEqual(reply, {
      type: "text",
      text: "Received: ",
    });
  });
});
