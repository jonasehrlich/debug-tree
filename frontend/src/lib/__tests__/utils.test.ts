import { copyToClipboard, getNodeId } from "@/lib/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("getNodeId", () => {
  it("should return a unique ID for each node type", () => {
    const nodeIds = new Set();
    const numIterations = 100;
    for (let i = 0; i < numIterations; i++) {
      nodeIds.add(getNodeId("actionNode"));
      nodeIds.add(getNodeId("statusNode"));
    }
    expect(nodeIds.size).toBe(2 * numIterations);
  });

  it("node ID prefixes", () => {
    expect(getNodeId("actionNode").startsWith("action-node-")).toBe(true);
    expect(getNodeId("statusNode").startsWith("status-node-")).toBe(true);
  });
});

describe("copyToClipboard", () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    // Use arrow function to avoid scoping issues with `this`
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });
    writeTextMock.mockReset();
  });

  it("should call navigator.clipboard.writeText with the correct text", async () => {
    const testText = "Hello, Clipboard!";
    await copyToClipboard(testText);
    expect(writeTextMock).toHaveBeenCalledWith(testText);
  });

  it("should throw if navigator.clipboard.writeText fails", async () => {
    navigator.clipboard.writeText = vi
      .fn()
      .mockRejectedValue(new Error("Clipboard error"));

    await expect(copyToClipboard("fail")).rejects.toThrow("Clipboard error");
  });
});
