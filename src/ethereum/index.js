import { createUseTrackERC20Balance } from '../index';
import { createBalanceTracker as _createBalanceTracker } from '../createBalanceTracker';

const useTrackERC20Balance = createUseTrackERC20Balance('ethereum');
const createBalanceTracker = (subObject) => _createBalanceTracker(subObject, 'ethereum');

export {
    useTrackERC20Balance,
    createBalanceTracker
}
