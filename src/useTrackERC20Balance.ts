import { useEffect, useState, useRef, useCallback } from 'react';
import { provider as fluentProvider, useAccount as useFluentAccount, Unit } from '@cfxjs/use-wallet';
import { provider as metaMaskProvider, useAccount as useMetaMaskAccount } from '@cfxjs/use-wallet/dist/ethereum';
import { validateBase32Address } from '@fluent-wallet/base32-address';
import { isHexAddress } from '@fluent-wallet/account';
import { format } from 'js-conflux-sdk';

export const createUseTrackERC20Balance = (type: 'conflux' | 'ethereum') => {
    const rpcPrefix = type === 'conflux' ? 'cfx' : 'eth';
    const useAccount = type === 'conflux' ? useFluentAccount : useMetaMaskAccount;
    const provider = type === 'conflux' ? fluentProvider : metaMaskProvider;

    const useTrackERC20Balance = (tokenAddress: string) => {
        const account = useAccount();
        const balanceTick = useRef(0);
        const [balance, setBalance] = useState<Unit | undefined>(undefined);

        // same balance should not reset obj state causes duplicate render.
        const handleBalanceChanged = useCallback((newBalance: Unit, currentBalanceTick: number) => {
            if (!newBalance || currentBalanceTick !== balanceTick.current - 1) return;
            setBalance((preBalance) => {
                if (preBalance === undefined || !preBalance.equalsWith(newBalance)) {
                    return newBalance;
                }
                return preBalance;
            });
        }, []);

        const balanceTimer = useRef<number | null>(null);
        const setUndefinedTimer = useRef<number | null>(null);
        const clearBalanceTimer = useCallback(() => {
            if (balanceTimer.current !== null) {
                clearInterval(balanceTimer.current);
                balanceTimer.current = null;
            }
        }, []);

        const clearSetUndefinedTimer = useCallback(() => {
            if (setUndefinedTimer.current !== null) {
                clearTimeout(setUndefinedTimer.current);
                setUndefinedTimer.current = null;
            }
        }, []);

        // track token balance and approvedBalance
        useEffect(() => {
            if (!provider) return;
            if (!account || (type === 'conflux' && !validateBase32Address(tokenAddress)) || (type === 'ethereum' && !isHexAddress(tokenAddress))) {
                setBalance(undefined);
                return;
            }

            const getBalance = (callback?: () => void) => {
                const currentBalanceTick = balanceTick.current;
                balanceTick.current += 1;

                provider!
                    .request({
                        method: `${rpcPrefix}_call`,
                        params: [
                            {
                                data: '0x70a08231000000000000000000000000' + format.hexAddress(account!).slice(2),
                                to: tokenAddress,
                            },
                            type === 'conflux' ? 'latest_state' : 'latest',
                        ],
                    })
                    .then((minUnitBalance) => handleBalanceChanged(Unit.fromMinUnit(minUnitBalance), currentBalanceTick))
                    .catch((err) => {})
                    .finally(callback);
            };
            
            // Prevent interface jitter from having a value to undefined to having a value again in a short time when switching tokens.
            // Shortly fail to get the value and then turn to undefined
            setUndefinedTimer.current = setTimeout(() => {
                setBalance(undefined)
                setUndefinedTimer.current = null;
            }, 50) as unknown as number;

            // Clear the setUndefinedTimer after first fetch balance, if this timer is not already in effect.
            setTimeout(() => getBalance(clearSetUndefinedTimer), 10);
            
            clearBalanceTimer();
            balanceTimer.current = setInterval(getBalance, 1500) as unknown as number;

            return () => {
                clearBalanceTimer();
                clearSetUndefinedTimer();
            }
        }, [tokenAddress, account]);



        return balance;
    };

    return useTrackERC20Balance;
}