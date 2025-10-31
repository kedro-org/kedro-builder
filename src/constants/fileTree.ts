/**
 * File tree constants for indentation and spacing
 */

export const FILE_TREE = {
  INDENT_SIZE: 16,
  BASE_PADDING: 12,
} as const;

/**
 * Calculate tree indentation based on nesting level
 * @param level - The nesting level (0 = root)
 * @param isFile - Whether the item is a file (files get one extra level of indent)
 * @returns CSS padding-left value as string
 */
export const calculateTreeIndent = (level: number, isFile: boolean = false): string => {
  const actualLevel = isFile ? level + 1 : level;
  return `${actualLevel * FILE_TREE.INDENT_SIZE + FILE_TREE.BASE_PADDING}px`;
};
