import { createBalanceTracker } from '../src';
import { format } from 'js-conflux-sdk';

const [[{ store, use: use20Balance, setDependency  }], startTrack] = createBalanceTracker([{
    // fetcher: ({ wallet: { provider } }) => 
    //         provider!.request({
    //             method: `cfx_call`,
    //             params: [{
    //                 data:  '0x70a08231000000000000000000000000' + format.hexAddress('cfxtest:aarvh6msgpzj7vv60xtrd3kskm244takfe6vwanvub').slice(2),
    //                 to: 'cfxtest:acgcj0h8xp3ydgtmf39e5kh8ab6f3ynnajafp2y04f'
    //             }, 
    //             'latest_state']
    //         })
    fetcher: ({ wallet: { provider, account }, dependency: { tokenAddress} }) => 
        account &&
            new Promise((resolve) => 
                setTimeout(() =>  
                    resolve(provider!.request({
                            method: `cfx_call`,
                            params: [{
                                data:  '0x70a08231000000000000000000000000' + format.hexAddress(account).slice(2),
                                to: tokenAddress
                            }, 
                            'latest_state']
                        })
                    )
                , 1000)

            )
}], 'conflux');

setDependency({ tokenAddress: 'cfxtest:acgcj0h8xp3ydgtmf39e5kh8ab6f3ynnajafp2y04f' });

setTimeout(() => {
    setDependency({ tokenAddress: 'cfxtest:acgcj0h8xp3ydgtmf39e5kh8ab6f3ynnajafp2y04f'});
}, 5000);

export {
    use20Balance,
    startTrack
}