import { Avatar, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { ReserveWithMetadataType, SelectedReserveType } from 'stores/pools';

export default function Token({
  reserve,
  size,
}: {
  reserve: ReserveWithMetadataType | SelectedReserveType;
  size: number;
}) {
  return reserve.logo ? (
    <Image
      src={reserve.logo ?? ''}
      alt={`logo for ${reserve.symbol}`}
      width={size}
      height={size}
      style={{
        borderRadius: '100%',
        height: `${size}px`,
        background: 'var(--chakra-colors-line)',
      }}
    />
  ) : (
    <Avatar
      icon={
        <Avatar
          width={`${size}px`}
          height={`${size}px`}
          bg='var(--chakra-colors-brandAlt)'
          icon={<Text>{reserve.mintAddress[0]}</Text>}
          borderRadius={100}
        />
      }
      w={`${size}px`}
      h={`${size}px`}
      borderRadius={100}
      name={reserve.symbol ?? ''}
    />
  );
}
