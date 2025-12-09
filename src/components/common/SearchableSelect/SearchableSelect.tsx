import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import './SearchableSelect.scss';

export interface SearchableSelectOption {
  value: string;
  label: string;
  category?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  grouped?: boolean;
}

/**
 * Searchable select dropdown component with filtering and keyboard navigation
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  grouped = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || '';

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;

    const term = searchTerm.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term) ||
        option.category?.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Group options by category
  const groupedOptions = useMemo(() => {
    if (!grouped) return { '': filteredOptions };

    const groups: Record<string, SearchableSelectOption[]> = {};
    filteredOptions.forEach((option) => {
      const category = option.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(option);
    });
    return groups;
  }, [filteredOptions, grouped]);

  // Flatten grouped options for keyboard navigation
  const flattenedOptions = useMemo(() => {
    return filteredOptions;
  }, [filteredOptions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      ) as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flattenedOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (flattenedOptions[highlightedIndex]) {
          handleSelect(flattenedOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`searchable-select ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`searchable-select__trigger ${isOpen ? 'searchable-select__trigger--open' : ''}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="searchable-select__trigger-text">
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`searchable-select__trigger-icon ${isOpen ? 'searchable-select__trigger-icon--open' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="searchable-select__dropdown" ref={dropdownRef} role="listbox">
          {/* Search Input */}
          <div className="searchable-select__search">
            <Search size={16} className="searchable-select__search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="searchable-select__search-input"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="searchable-select__options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select__no-results">No results found</div>
            ) : grouped ? (
              // Grouped options
              Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                <div key={category} className="searchable-select__group">
                  {category && (
                    <div className="searchable-select__group-label">{category}</div>
                  )}
                  {categoryOptions.map((option) => {
                    const globalIndex = flattenedOptions.indexOf(option);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`searchable-select__option ${
                          option.value === value ? 'searchable-select__option--selected' : ''
                        } ${
                          globalIndex === highlightedIndex
                            ? 'searchable-select__option--highlighted'
                            : ''
                        }`}
                        onClick={() => handleSelect(option.value)}
                        data-index={globalIndex}
                        role="option"
                        aria-selected={option.value === value}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              // Flat options
              flattenedOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`searchable-select__option ${
                    option.value === value ? 'searchable-select__option--selected' : ''
                  } ${
                    index === highlightedIndex ? 'searchable-select__option--highlighted' : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                  data-index={index}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
