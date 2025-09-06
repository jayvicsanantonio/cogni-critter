/**
 * Critter Animation and State Types
 */

import { CritterState } from './coreTypes';

export interface AnimatedCritterProps {
  state: CritterState;
  critterColor: string;
  animationDuration?: number;
}
