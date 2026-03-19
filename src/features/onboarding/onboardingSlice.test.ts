/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import onboardingReducer, {
  completeTutorial,
  nextTutorialStep,
} from './onboardingSlice';
import type { OnboardingState } from '../../types/redux';

describe('onboardingSlice', () => {
  const initialState: OnboardingState = {
    showTutorial: false,
    tutorialStep: 1,
    tutorialCompleted: false,
    showWalkthrough: false,
    walkthroughStep: 1,
    walkthroughCompleted: false,
  };

  it('completeTutorial should close tutorial AND auto-start walkthrough', () => {
    const tutorialActive: OnboardingState = {
      ...initialState,
      showTutorial: true,
      tutorialStep: 5,
    };

    const state = onboardingReducer(tutorialActive, completeTutorial());

    // Tutorial finished
    expect(state.showTutorial).toBe(false);
    expect(state.tutorialCompleted).toBe(true);
    expect(state.tutorialStep).toBe(1); // reset

    // Walkthrough auto-started
    expect(state.showWalkthrough).toBe(true);
    expect(state.walkthroughStep).toBe(1);
  });

  it('nextTutorialStep should cap at step 7', () => {
    const atStep7: OnboardingState = { ...initialState, tutorialStep: 7 };

    const state = onboardingReducer(atStep7, nextTutorialStep());

    expect(state.tutorialStep).toBe(7); // does not exceed 7
  });
});
