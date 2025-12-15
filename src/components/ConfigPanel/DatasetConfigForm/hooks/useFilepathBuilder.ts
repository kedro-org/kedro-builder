import { useState, useEffect, useRef } from 'react';
import { parseFilepath, buildFilepath } from '../../../../utils/filepath';

interface UseFilepathBuilderProps {
  initialFilepath: string;
  datasetName?: string;
  datasetType?: string;
  datasetId?: string; // Used to detect when switching between datasets
  setValue: (name: 'filepath', value: string, options?: { shouldDirty: boolean }) => void;
}

// Map dataset types to file extensions
const getExtensionForType = (type: string): string => {
  const extensionMap: Record<string, string> = {
    csv: 'csv',
    excel: 'xlsx',
    parquet: 'parquet',
    json: 'json',
    yaml: 'yml',
    pickle: 'pkl',
    text: 'txt',
    feather: 'feather',
    orc: 'orc',
    xml: 'xml',
  };
  return extensionMap[type.toLowerCase()] || 'csv';
};

/**
 * Custom hook to manage filepath building from component parts
 * Automatically syncs changes to the form's filepath field
 * Auto-populates filename in real-time based on dataset name and type
 */
export const useFilepathBuilder = ({ initialFilepath, datasetName, datasetType, datasetId, setValue }: UseFilepathBuilderProps) => {
  // Parse initial filepath into parts
  const initialParts = parseFilepath(initialFilepath);

  // Track if user has manually edited the filename
  const userEditedFileName = useRef(!!initialFilepath);

  // Auto-populate filename on first load if no filepath exists
  const getInitialFileName = () => {
    // Only auto-populate if there's no existing filepath and we have a dataset name
    if (!initialFilepath && datasetName) {
      const extension = getExtensionForType(datasetType || 'csv');
      return `${datasetName}.${extension}`;
    }
    return initialParts.fileName;
  };

  const [baseLocation, setBaseLocation] = useState(initialParts.baseLocation);
  const [dataLayer, setDataLayer] = useState(initialParts.dataLayer);
  const [fileName, setFileName] = useState(getInitialFileName);

  // Reset filepath builder state when dataset changes (switching between different datasets)
  useEffect(() => {
    const newParts = parseFilepath(initialFilepath);
    setBaseLocation(newParts.baseLocation);
    setDataLayer(newParts.dataLayer);

    // Reset filename based on the new dataset
    if (!initialFilepath && datasetName) {
      const extension = getExtensionForType(datasetType || 'csv');
      setFileName(`${datasetName}.${extension}`);
    } else {
      setFileName(newParts.fileName);
    }

    // Reset the user edited flag
    userEditedFileName.current = !!initialFilepath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]); // Only reset when dataset ID changes

  // Update filename when dataset name or type changes (only if user hasn't manually edited)
  useEffect(() => {
    if (!userEditedFileName.current && datasetName) {
      const extension = getExtensionForType(datasetType || 'csv');
      setFileName(`${datasetName}.${extension}`);
    }
  }, [datasetName, datasetType]);

  // Custom setFileName that marks as user-edited
  const handleSetFileName = (newFileName: string) => {
    userEditedFileName.current = true;
    setFileName(newFileName);
  };

  // Update form filepath when parts change
  useEffect(() => {
    const fullPath = buildFilepath(baseLocation, dataLayer, fileName);
    setValue('filepath', fullPath, { shouldDirty: true });
  }, [baseLocation, dataLayer, fileName, setValue]);

  return {
    baseLocation,
    dataLayer,
    fileName,
    setBaseLocation,
    setDataLayer,
    setFileName: handleSetFileName,
  };
};
