import type { File, FileTreeData } from "./types";

export const groupPaths = (files: File[]): FileTreeData => {
  const tree: FileTreeData = {};

  files.forEach((file) => {
    const parts = file.name.split("/").filter((part) => part !== "");

    let currentLevel: FileTreeData = tree;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        currentLevel.files ??= [];
        currentLevel.files.push({ name: part, type: file.type });
      } else {
        // It's a directory
        currentLevel.children ??= {};
        currentLevel.children[part] ??= {};
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        currentLevel = currentLevel.children[part]!; // Non-null assertion as we just ensured it exists
      }
    });
  });
  return tree;
};

/**
 * Optimizes a FileTreeData structure by combining nested directories that
 * only have a single directory as a child into one.
 *
 * @param tree The FileTreeData to optimize.
 * @returns The optimized FileTreeData.
 */
export const optimizeFileTree = (tree: FileTreeData): FileTreeData => {
  if (!tree.children) {
    return tree; // No children to optimize
  }

  const optimizedChildren: Record<string, FileTreeData> = {};

  for (const key in tree.children) {
    if (Object.prototype.hasOwnProperty.call(tree.children, key)) {
      let currentChild: FileTreeData = tree.children[key];

      // Recursively optimize the current child first
      currentChild = optimizeFileTree(currentChild);

      // Check if this child can be flattened
      if (
        currentChild.children &&
        Object.keys(currentChild.children).length === 1 &&
        !currentChild.files // Ensure it doesn't have files directly in it
      ) {
        const nestedChildKey = Object.keys(currentChild.children)[0];
        const nestedChild = currentChild.children[nestedChildKey];

        // Combine the current key with the nested key
        const newKey = `${key}/${nestedChildKey}`;

        // Assign the nested child's content to the new combined key
        optimizedChildren[newKey] = nestedChild;
      } else {
        // If it can't be flattened, keep it as is
        optimizedChildren[key] = currentChild;
      }
    }
  }

  return {
    ...tree,
    children: optimizedChildren,
  };
};
