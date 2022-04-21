import type { Unit } from '@cfxjs/use-wallet'
import { createBalanceTracker as _createBalanceTracker } from '../createBalanceTracker';

export declare const useTrackERC20Balance: (tokenAddress: string) => Unit | undefined;
export declare const createBalanceTracker: (subObject: Parameters<typeof _createBalanceTracker>[0]) => readonly [{
    store: import("zustand").UseBoundStore<import("../createBalanceTracker").BalanceStore, Omit<import("zustand").StoreApi<import("../createBalanceTracker").BalanceStore>, "subscribe"> & {
        subscribe: {
            (listener: import("zustand").StateListener<import("./createBalanceTracker").BalanceStore>): () => void;
            <StateSlice>(selector: import("zustand").StateSelector<import("./createBalanceTracker").BalanceStore, StateSlice>, listener: import("zustand").StateSliceListener<StateSlice>, options?: {
                equalityFn?: import("zustand").EqualityChecker<StateSlice> | undefined;
                fireImmediately?: boolean | undefined;
            } | undefined): () => void;
        };
    }>;
    use: () => import("@cfxjs/use-wallet/dist/Unit").default | undefined;
    setDependency: (dependency: object) => void;
}[], () => () => void];
