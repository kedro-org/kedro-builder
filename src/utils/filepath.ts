/**
 * Parsed filepath components
 */
export interface FilepathParts {
  baseLocation: string;
  dataLayer: string;
  fileName: string;
}

/**
 * Parse a Kedro filepath into its component parts
 *
 * @param filepath - Full filepath (e.g., "data/01_raw/companies.csv")
 * @returns Parsed components with defaults
 *
 * @example
 * parseFilepath("data/01_raw/companies.csv")
 * // Returns: { baseLocation: "data", dataLayer: "01_raw", fileName: "companies.csv" }
 *
 * parseFilepath("01_raw/companies.csv")
 * // Returns: { baseLocation: "data", dataLayer: "01_raw", fileName: "companies.csv" }
 *
 * parseFilepath("companies.csv")
 * // Returns: { baseLocation: "data", dataLayer: "01_raw", fileName: "companies.csv" }
 */
export const parseFilepath = (filepath: string): FilepathParts => {
  if (!filepath || filepath.trim() === '') {
    return { baseLocation: 'data', dataLayer: '01_raw', fileName: '' };
  }

  const parts = filepath.split('/').filter(Boolean);

  if (parts.length >= 3) {
    return {
      baseLocation: parts[0],
      dataLayer: parts[1],
      fileName: parts.slice(2).join('/'),
    };
  } else if (parts.length === 2) {
    return {
      baseLocation: 'data',
      dataLayer: parts[0],
      fileName: parts[1],
    };
  } else if (parts.length === 1) {
    return {
      baseLocation: 'data',
      dataLayer: '01_raw',
      fileName: parts[0],
    };
  }

  return { baseLocation: 'data', dataLayer: '01_raw', fileName: '' };
};

/**
 * Build a full filepath from its component parts
 *
 * @param baseLocation - Base directory (default: "data")
 * @param dataLayer - Data layer (e.g., "01_raw", "02_intermediate")
 * @param fileName - File name with extension
 * @returns Full filepath or empty string if no fileName
 *
 * @example
 * buildFilepath("data", "01_raw", "companies.csv")
 * // Returns: "data/01_raw/companies.csv"
 */
export const buildFilepath = (
  baseLocation: string,
  dataLayer: string,
  fileName: string
): string => {
  const base = baseLocation.trim() || 'data';
  const layer = dataLayer.trim();
  const file = fileName.trim();

  if (file) {
    return `${base}/${layer}/${file}`;
  }

  return '';
};
