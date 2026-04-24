import { useEffect, useState } from 'react';
import { randomSn1Balance } from '../utils/format';

export const useMockSn1 = (walletAddress) => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(0);
      return;
    }

    const timeout = setTimeout(() => {
      setBalance(randomSn1Balance());
    }, 500);

    return () => clearTimeout(timeout);
  }, [walletAddress]);

  return balance;
};
