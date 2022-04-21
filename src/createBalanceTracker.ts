import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { debounce, isEqual } from 'lodash-es';
import shallow from 'zustand/shallow';
import { store as fluentStore, provider as fluentProvider, Unit } from '@cfxjs/use-wallet';
import { store as metaMaskStore, provider as metaMaskProvider } from '@cfxjs/use-wallet/dist/ethereum';
import Decimal from 'decimal.js';

export interface SubObject {
    fetcher: (dependency: { wallet: { account?: string; chainId?: string; provider?: typeof fluentProvider }; dependency?: any; }) => Promise<string> | undefined | null | boolean | '';
}

export interface BalanceStore {
    balance?: Unit;
    dependency?: any;
}
const balanceSelector = (state: BalanceStore) => state.balance;

export function createBalanceTracker(subObjects: Array<SubObject>, type: 'conflux' | 'ethereum') {
    const walletStore = type === 'conflux' ? fluentStore : metaMaskStore;
    const provider = type === 'conflux' ? fluentProvider : metaMaskProvider;

    const subCenter = new Map<any, (tick: Decimal) => void>();
    const setSubFetcher = (
        { subObject, subObjectDriver }: { subObject: SubObject, subObjectDriver: any; },
        { wallet, dependency }: { wallet: { account?: string; chainId?: string; provider: typeof fluentProvider }; dependency: any; }
    ) => {
        subCenter.set(subObject, async (currentTick: Decimal) => {
            const fetcherRes = subObject.fetcher?.({ wallet, dependency});
            if (isPromise(fetcherRes)) {
                fetcherRes
                    .then(
                        (minUnitBalance) =>
                            typeof minUnitBalance === 'string' &&
                            subObjectDriver.handleBalanceChanged(Unit.fromMinUnit(minUnitBalance), currentTick),
                    )
                    .catch((err) => {})
                    .finally(subObjectDriver.clearSetUndefinedTimer);
            }
        });
    }
    let tick = new Decimal('0');
    let timer: number | null = null;

    const clearTimer = () => {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    };

    const tickFetchBalance = () => {
        tick = tick.add(new Decimal('1'));
        subCenter.forEach(function (fetcher) {
            fetcher(tick);
        });
    };

    const startTickFetch = () => {
        clearTimer();
        tickFetchBalance();
        timer = setInterval(tickFetchBalance, 2500);
    };

    startTickFetch();

    const subObjectsDriver = subObjects.map(() => {
        const balanceStore = create(subscribeWithSelector<BalanceStore>(() => ({ balance: undefined, dependency: undefined })));

        const handleBalanceChanged = (newBalance: Unit, currentTick: Decimal) => {
            if (!newBalance || !currentTick.equals(tick)) return;
            const preBalance = balanceStore.getState().balance;
            if (preBalance === undefined || !preBalance.equalsWith(newBalance)) {
                balanceStore.setState({ balance: newBalance });
            }
        };

        let setUndefinedTimer: number | null = null;
        const clearSetUndefinedTimer = () => {
            if (setUndefinedTimer !== null) {
                clearTimeout(setUndefinedTimer);
                setUndefinedTimer = null;
            }
        };
        const startSetUndefinedTimer = (rightNow?: boolean) => {
            clearTimeout();
            if (rightNow) {
                balanceStore.setState({ balance: undefined });
                setUndefinedTimer = null;
            } else {
                setUndefinedTimer = setTimeout(() => {
                    balanceStore.setState({ balance: undefined });
                    setUndefinedTimer = null;
                }, 50);
            }
        };

        const driver = {
            store: balanceStore,
            use: () => balanceStore(balanceSelector),
            handleBalanceChanged,
            startSetUndefinedTimer,
            clearSetUndefinedTimer,
            setDependency: (dependency: object) => {
                driver.isDependentOnOuter = true;
                balanceStore.setState({ dependency });
            },
            isDependentOnAccount: false,
            isDependentOnChainId: false,
            isDependentOnOuter: false,
            trackChangeOnce: () => {},
            createDependentObject: ({ account, chainId, provider }: { account?: string; chainId?: string; provider: typeof fluentProvider; }) => ({
                _account: account,
                _chainId: chainId,
                provider,
                get account() {
                    driver.isDependentOnAccount = true;
                    return this._account;
                },
                get chainId() {
                    driver.isDependentOnChainId = true;
                    return this._chainId;
                },
            })
        };

        return driver;
    });


    const subFunc = debounce(
        (
            [accounts, chainId]: readonly [Array<string> | undefined, string | undefined],
            [preAccounts, preChainId]: readonly [Array<string> | undefined, string | undefined],
        ) => {
            const account = accounts?.[0];
            const preAccount = preAccounts?.[0];
            const isAccountChanged = preAccount !== account;
            const isChainIdChanged = preChainId !== chainId;

            document.removeEventListener('focus', startTickFetch);
            subObjects.forEach((subObject, index) => {
                const subObjectDriver = subObjectsDriver[index];
                const isDependentOnAccount = subObjectDriver.isDependentOnAccount;
                const isDependentOnChainId = subObjectDriver.isDependentOnChainId;
                const shouldStartSetUndefinedTimer =
                    (isDependentOnAccount && isAccountChanged) || (isDependentOnChainId && isChainIdChanged);
                if (shouldStartSetUndefinedTimer) {
                    subObjectDriver.startSetUndefinedTimer((isDependentOnAccount && !account) || (isDependentOnChainId && !chainId));
                }

                subCenter.delete(subObject);
                if ((isDependentOnAccount && !account) || (isDependentOnChainId && !chainId)) return;
                setSubFetcher(
                    { subObject, subObjectDriver },
                    { 
                        wallet: subObjectDriver.createDependentObject({ account, chainId, provider }),
                        dependency: subObjectDriver.store.getState().dependency
                    }
                );
            });
            tickFetchBalance();
            document.addEventListener('focus', startTickFetch);
        },
        16,
    );

    const startTrack = () => {
        const unSubWallet = walletStore.subscribe((state) => [state.accounts, state.chainId] as const, subFunc, { equalityFn: shallow, fireImmediately: true });
        subObjects.forEach((subObject, index) => {
            const subObjectDriver = subObjectsDriver[index];
            subObjectsDriver[index].store.subscribe((state) => state.dependency, (newDependency) => {
                if (!subObjectDriver.isDependentOnOuter) return;
    
                subObjectDriver.startSetUndefinedTimer(!newDependency);
                if (!newDependency === undefined) {
                    subCenter.delete(subObject);
                    return;
                }
    
                const account = walletStore.getState().accounts?.[0];
                const chainId = walletStore.getState().chainId;
    
                setSubFetcher(
                    { subObject, subObjectDriver },
                    { 
                        wallet: subObjectDriver.createDependentObject({ account, chainId, provider }),
                        dependency: newDependency
                    }
                );
                tickFetchBalance();
            }, { equalityFn: isEqual, fireImmediately: true });
        });

        return () => {
            unSubWallet();
            subObjectsDriver.forEach(driver => {
                driver.store.destroy();
            });
        }
    }

    return [
        subObjectsDriver.map((subObjectDriver) => ({ store: subObjectDriver.store, use: subObjectDriver.use, setDependency: subObjectDriver.setDependency })),
        startTrack
    ] as const;
};

function isPromise<T>(p: any): p is Promise<T> {
    return p !== null && typeof p === 'object' && typeof p.then === 'function';
}
