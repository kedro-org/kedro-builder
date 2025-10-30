import { Sparkles, FunctionSquare, GitBranch, Database, FolderTree } from 'lucide-react';
import type { TutorialStep } from '../../types/tutorial';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to Kedro's Pipeline Builder",
    content: "This tool helps you build Kedro pipelines following Kedro concepts and core principles. If you are new to Kedro, we'll explain the basics in the following steps.",
    buttonText: "Start introduction to Kedro",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "1. Node",
    content: "A node is a wrapper for a pure Python function that names the inputs and outputs of that function. Nodes are the building block of a pipeline, and the output of one node can be the input of another.",
    buttonText: "Next",
    icon: FunctionSquare,
  },
  {
    id: 3,
    title: "2. Pipeline",
    content: "A pipeline organises the dependencies and execution order of a collection of nodes and connects inputs and outputs while keeping your code modular.",
    buttonText: "Next",
    icon: GitBranch,
  },
  {
    id: 4,
    title: "3. Data Catalog",
    content: "Kedro has a registry of all data sources the project can use called the Data Catalog. There is inbuilt support for various file types and file systems.",
    buttonText: "Next",
    icon: Database,
  },
  {
    id: 5,
    title: "4. Kedro project structure",
    content: "Kedro projects follow a default template that uses specific folders to store datasets, notebooks, configuration and source code.",
    buttonText: "Finish",
    icon: FolderTree,
  },
];
