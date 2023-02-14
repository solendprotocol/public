const ADDRESS_PREFIX_SUFFIX_LENGTH = 6;

export const formatAddress = (address: string, length?: number) => {
  return `${address.slice(
    0,
    length ?? ADDRESS_PREFIX_SUFFIX_LENGTH,
  )}...${address.slice(-(length ?? ADDRESS_PREFIX_SUFFIX_LENGTH))}`;
};

export const formatPoolName = (name: string) => {
  return name.charAt(0).toUpperCase().concat(name.slice(1));
};
