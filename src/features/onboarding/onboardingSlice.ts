import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { OnboardingState } from '../../types/redux';
import { TUTORIAL_STEP_COUNT } from '../../constants/ui';

const initialState: OnboardingState = {
  // Tutorial state
  showTutorial: false, // Will be set based on localStorage
  tutorialStep: 1,
  tutorialCompleted: false,

  // Walkthrough state
  showWalkthrough: false,
  walkthroughStep: 1,
  walkthroughCompleted: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    // Tutorial actions
    setShowTutorial: (state, action: PayloadAction<boolean>) => {
      state.showTutorial = action.payload;
    },
    nextTutorialStep: (state) => {
      if (state.tutorialStep < TUTORIAL_STEP_COUNT) {
        state.tutorialStep += 1;
      }
    },
    prevTutorialStep: (state) => {
      if (state.tutorialStep > 1) {
        state.tutorialStep -= 1;
      }
    },
    completeTutorial: (state) => {
      state.showTutorial = false;
      state.tutorialCompleted = true;
      state.tutorialStep = 1;
      // Auto-start walkthrough after tutorial
      state.showWalkthrough = true;
      state.walkthroughStep = 1;
    },
    openTutorial: (state) => {
      state.showTutorial = true;
      state.tutorialStep = 1;
    },
    // Walkthrough actions
    startWalkthrough: (state) => {
      state.showWalkthrough = true;
      state.walkthroughStep = 1;
    },
    nextWalkthroughStep: (state) => {
      if (state.walkthroughStep < 4) {
        state.walkthroughStep += 1;
      }
    },
    prevWalkthroughStep: (state) => {
      if (state.walkthroughStep > 1) {
        state.walkthroughStep -= 1;
      }
    },
    completeWalkthrough: (state) => {
      state.showWalkthrough = false;
      state.walkthroughCompleted = true;
      state.walkthroughStep = 1;
    },
    skipWalkthrough: (state) => {
      state.showWalkthrough = false;
      state.walkthroughCompleted = true;
    },
  },
});

export const {
  setShowTutorial,
  nextTutorialStep,
  prevTutorialStep,
  completeTutorial,
  openTutorial,
  startWalkthrough,
  nextWalkthroughStep,
  prevWalkthroughStep,
  completeWalkthrough,
  skipWalkthrough,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
