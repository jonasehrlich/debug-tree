import { describe } from "vitest";
import type { File, FileTreeData } from "../types";
import { optimizeFileTree } from "../utils";

const f = (n: string): File => ({ name: n, type: "unknown" });

describe("optimizeGroupedTree", () => {
  it("groups directories with only one child", () => {
    const groupedTree: FileTreeData = {
      children: {
        src: {
          children: {
            foo: {
              children: {
                bar: {
                  files: [f("main.ts"), f("utils.ts")],
                },
              },
            },
            components: {
              children: {
                Button: {
                  files: [f("Button.tsx"), f("Button.module.css")],
                },
                Icon: {
                  files: [f("Icon.tsx")],
                },
              },
            },
          },
        },
        public: {
          children: {
            assets: {
              children: {
                images: {
                  files: [f("logo.png")],
                },
              },
            },
          },
        },
        docs: {
          children: {
            gettingStarted: {
              children: {
                introduction: {
                  files: [f("index.md")],
                },
                dev: {
                  files: [f("index.md")],
                },
              },
            },
          },
        },
        config: {
          files: [f("config.json")],
        },
      },
      files: [f("README.md")],
    };

    const optimizedTree = optimizeFileTree(groupedTree);

    const expectedOptimizedTree = {
      children: {
        src: {
          children: {
            "foo/bar": {
              files: [f("main.ts"), f("utils.ts")],
            },
            components: {
              children: {
                Button: {
                  files: [f("Button.tsx"), f("Button.module.css")],
                },
                Icon: {
                  files: [f("Icon.tsx")],
                },
              },
            },
          },
        },
        "public/assets/images": {
          files: [f("logo.png")],
        },
        "docs/gettingStarted": {
          children: {
            introduction: {
              files: [f("index.md")],
            },
            dev: {
              files: [f("index.md")],
            },
          },
        },
        config: {
          files: [f("config.json")],
        },
      },
      files: [f("README.md")],
    };

    expect(optimizedTree).toEqual(expectedOptimizedTree);
  });
});
