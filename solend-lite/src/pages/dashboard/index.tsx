import { useMediaQuery } from '@chakra-ui/react';
import MobileDashboard from 'components/Dashboard/MobileDashboard';
import Dashboard from 'components/Dashboard/Dashboard';
import NoSSR from 'react-no-ssr';

export default function Solend() {
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return <NoSSR>{isLargerThan800 ? <Dashboard /> : <MobileDashboard />}</NoSSR>;
}
