import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { updateNode, deleteNode } from '@/features/nodes/nodesSlice';
import { clearPendingComponent } from '@/features/ui/uiSlice';
import type { KedroNode } from '@/types/kedro';
import { Button } from '../../UI/Button/Button';
import { Input } from '../../UI/Input/Input';
import { ConfirmDialog } from '../../UI/ConfirmDialog';
import { isPythonKeyword } from '@/validation';
import { toSnakeCase } from '@/infrastructure/export/helpers';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { dispatchConfigUpdated } from '@/constants';
import './NodeConfigForm.scss';

interface NodeFormData {
  name: string;
  functionCode?: string;
}

interface NodeConfigFormProps {
  node: KedroNode;
  onClose: () => void;
}

// Helper function to extract function name from Python code
const extractFunctionName = (code: string): string | null => {
  const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

export const NodeConfigForm: React.FC<NodeConfigFormProps> = ({ node, onClose }) => {
  const dispatch = useAppDispatch();
  const [functionNameWarning, setFunctionNameWarning] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Delete confirmation handler
  const handleConfirmDelete = useCallback(() => {
    dispatch(deleteNode(node.id));
    dispatch(clearPendingComponent());
    onClose();
  }, [dispatch, node.id, onClose]);

  const deleteDialog = useConfirmDialog(handleConfirmDelete);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<NodeFormData>({
    defaultValues: {
      name: node.name || '',
      functionCode: node.functionCode || '',
    },
  });

  // Reset form when switching between different nodes
  // Only depends on node.id to avoid resetting during field edits
  useEffect(() => {
    reset({
      name: node.name || '',
      functionCode: node.functionCode || '',
    });
    // Intentionally omit node.* fields - reset should only trigger on node switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, reset]);

  const watchName = watch('name');
  const watchFunctionCode = watch('functionCode');

  // Check for function name mismatch
  useEffect(() => {
    if (watchFunctionCode && watchFunctionCode.trim() && watchName) {
      const extractedFuncName = extractFunctionName(watchFunctionCode);
      const expectedFuncName = toSnakeCase(watchName);

      if (extractedFuncName && extractedFuncName !== expectedFuncName) {
        setFunctionNameWarning(
          `Function name "${extractedFuncName}" does not match node name "${expectedFuncName}". The pipeline expects the function to be named "${expectedFuncName}".`
        );
      } else {
        setFunctionNameWarning('');
      }
    } else {
      setFunctionNameWarning('');
    }
  }, [watchName, watchFunctionCode]);

  const onSubmit = (data: NodeFormData) => {
    dispatch(
      updateNode({
        id: node.id,
        changes: {
          name: data.name.trim(),
          functionCode: data.functionCode?.trim() || undefined,
        },
      })
    );

    // Don't clear pending here - ConfigPanel's handleClose will check if valid and clear it
    onClose();

    // Dispatch event to refresh validation if export wizard is open
    dispatchConfigUpdated();
  };

  // Handle Tab key in code textarea
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') {
      // Let all other keys work normally - DO NOT interfere
      return;
    }

    // Only handle Tab key
    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;

    // Insert 4 spaces
    const newValue = value.substring(0, start) + '    ' + value.substring(end);

    // Use setValue to update the form - this triggers react-hook-form properly
    setValue('functionCode', newValue, { shouldDirty: true, shouldValidate: true });

    // Update cursor position after React re-renders
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="node-config-form">
      <div className="node-config-form__section">
        <Input
          label="Node Name"
          placeholder="e.g., process_raw_data"
          error={errors.name?.message}
          helperText="Use snake_case naming (lowercase with underscores)"
          required
          {...register('name', {
            required: 'Node name is required',
            validate: (value) => {
              const trimmed = value.trim();
              if (trimmed.length === 0) return 'Node name cannot be empty';
              if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
                return 'Must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
              }
              // Check for reserved Python keywords (complete list)
              if (isPythonKeyword(trimmed)) {
                return `"${trimmed}" is a Python reserved keyword`;
              }
              return true;
            },
          })}
        />
      </div>

      <div className="node-config-form__section">
        <label className="node-config-form__label">
          Function Code <span className="node-config-form__optional">(optional)</span>
        </label>
        <textarea
          className="node-config-form__textarea node-config-form__textarea--code"
          rows={10}
          placeholder="# Python code for this node function...&#10;# def my_function(input_data):&#10;#     return processed_data"
          {...register('functionCode', {
            onChange: () => {
              // Let react-hook-form handle all changes normally
            }
          })}
          ref={(e) => {
            // Merge refs: react-hook-form's ref and our ref
            register('functionCode').ref(e);
            textareaRef.current = e;
          }}
          onKeyDown={handleCodeKeyDown}
        />
        {functionNameWarning && (
          <span className="node-config-form__warning">
            ⚠️ {functionNameWarning}
          </span>
        )}
        <span className="node-config-form__helper">
          Add custom Python code for this node (optional). The function name must match the node name.
        </span>
      </div>

      <div className="node-config-form__actions">
        <Button type="button" variant="danger" onClick={deleteDialog.open}>
          Delete
        </Button>
        <div className="node-config-form__actions-right">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={deleteDialog.confirm}
        title="Delete Node"
        message={`Are you sure you want to delete "${node.name || 'this node'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </form>
  );
};
