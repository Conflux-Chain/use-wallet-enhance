import React from 'react';
import Code from '@components/Code';
import useI18n from '@hooks/useI18n';

const transitions = {
    en: {
        step1: `useChainId return current networkId in the wallet. If the status is 'not-active' for unauthorized connection, the return value is undefined.`,
    },
    zh: {
        step1: `useChainId 返回当前钱包中的网络。如果是 status 为 'not-active' 的未授权连接状态，返回值为 undefined。`,
    },
} as const;

const UseChainId: React.FC = () => {
    const i18n = useI18n(transitions);

    return (
        <section>
            <h3>useChainId</h3>

            <h4>declare:</h4>
            <Code language='ts'>
                {code}
            </Code>

            <h4 className='mt-[16px]'>Description:</h4>
            <p>{i18n.step1}</p>
        </section>
    );
}

const code = `declare const useChainId: () => string | undefined;`

export default UseChainId;