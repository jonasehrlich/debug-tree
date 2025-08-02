import { describe } from "vitest";
import type { FileTreeData } from "../types";
import { optimizeFileTree } from "../utils";

describe("optimizeGroupedTree", () => {
  it("groups directories with only one child", () => {
    const groupedTree: FileTreeData = {
      children: {
        src: {
          children: {
            foo: {
              children: {
                bar: {
                  files: ["main.ts", "utils.ts"],
                },
              },
            },
            components: {
              children: {
                Button: {
                  files: ["Button.tsx", "Button.module.css"],
                },
                Icon: {
                  files: ["Icon.tsx"],
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
                  files: ["logo.png"],
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
                  files: ["index.md"],
                },
              },
            },
          },
        },
        config: {
          files: ["config.json"],
        },
      },
      files: ["README.md"],
    };

    const optimizedTree = optimizeFileTree(groupedTree);

    const expectedOptimizedTree = {
      children: {
        src: {
          children: {
            "foo/bar": {
              files: ["main.ts", "utils.ts"],
            },
            components: {
              children: {
                Button: {
                  files: ["Button.tsx", "Button.module.css"],
                },
                Icon: {
                  files: ["Icon.tsx"],
                },
              },
            },
          },
        },
        "public/assets/images": {
          files: ["logo.png"],
        },
        "docs/gettingStarted/introduction": {
          files: ["index.md"],
        },
        config: {
          files: ["config.json"],
        },
      },
      files: ["README.md"],
    };

    expect(optimizedTree).toEqual(expectedOptimizedTree);
  });
});
