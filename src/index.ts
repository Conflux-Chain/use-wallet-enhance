import { createUseTrackERC20Balance } from './useTrackERC20Balance';
import { createBalanceTracker as _createBalanceTracker } from './createBalanceTracker';
export * from './useTrackERC20Balance';

export const useTrackERC20Balance = createUseTrackERC20Balance('conflux');
export const createBalanceTracker = (subObject: Parameters<typeof _createBalanceTracker>[0]) => _createBalanceTracker(subObject, 'conflux');