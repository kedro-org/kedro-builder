/**
 * LLM Context Node Constants
 *
 * Default values and options for LLM Context Node configuration.
 */

import type { LLMProvider, DatasetType } from '../types/kedro';

export interface LLMProviderOption {
  value: LLMProvider;
  label: string;
  models: string[];
  catalogType: string;
}

export const LLM_PROVIDERS: LLMProviderOption[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    catalogType: 'langchain.ChatOpenAIDataset',
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-opus-4-20250514'],
    catalogType: 'langchain.ChatAnthropicDataset',
  },
  {
    value: 'cohere',
    label: 'Cohere',
    models: ['command-r-plus', 'command-r', 'command'],
    catalogType: 'langchain.ChatCohereDataset',
  },
];

/** Dataset types that can serve as prompt inputs to LLM context nodes */
export const PROMPT_DATASET_TYPES: ReadonlySet<DatasetType> = new Set<DatasetType>(['text', 'yaml']);

export const DEFAULT_LLM_PROVIDER: LLMProvider = 'openai';
export const DEFAULT_MODEL = 'gpt-4o';
export const DEFAULT_TEMPERATURE = 0.0;

/**
 * Get provider config by value
 */
export function getProviderConfig(provider: LLMProvider): LLMProviderOption | undefined {
  return LLM_PROVIDERS.find((p) => p.value === provider);
}

/**
 * Get available models for a provider
 */
export function getModelsForProvider(provider: LLMProvider): string[] {
  return getProviderConfig(provider)?.models ?? [];
}

/**
 * Get the catalog dataset type string for a provider
 */
export function getCatalogType(provider: LLMProvider): string {
  return getProviderConfig(provider)?.catalogType ?? '';
}
