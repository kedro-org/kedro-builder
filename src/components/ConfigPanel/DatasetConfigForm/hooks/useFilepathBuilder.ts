import { useState, useEffect } from 'react';
import { parseFilepath, buildFilepath } from '../../../../utils/filepath';

interface UseFilepathBuilderProps {
  initialFilepath: string;
  setValue: (name: 'filepath', value: string, options?: { shouldDirty: boolean }) => void;
}

/**
 * Custom hook to manage filepath building from component parts
 * Automatically syncs changes to the form's filepath field
 */
export const useFilepathBuilder = ({ initialFilepath, setValue }: UseFilepathBuilderProps) => {
  // Parse initial filepath into parts
  const initialParts = parseFilepath(initialFilepath);
  const [baseLocation, setBaseLocation] = useState(initialParts.baseLocation);
  const [dataLayer, setDataLayer] = useState(initialParts.dataLayer);
  const [fileName, setFileName] = useState(initialParts.fileName);

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
    setFileName,
  };
};
