const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;

export const formatAddress = (address: string) => {
  return `${address.slice(0, ADDRESS_PREFIX_SUFFIX_LENGTH)}...${address.slice(
    -ADDRESS_PREFIX_SUFFIX_LENGTH,
  )}`;
};

export const formatPoolName = (name: string) => {
  return name.charAt(0).toUpperCase().concat(name.slice(1));
};
