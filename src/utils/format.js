export const shortenAddress = (address) => {
  if (!address) return 'Not Connected';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const randomSn1Balance = () => Number((Math.random() * 1500 + 120).toFixed(2));
