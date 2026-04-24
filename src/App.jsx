import { useWallet } from '@solana/wallet-adapter-react';
import CoreMissionSection from './components/CoreMissionSection';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import LiveDashboardSection from './components/LiveDashboardSection';
import NftBadgeSection from './components/NftBadgeSection';
import TokenLaunchSection from './components/TokenLaunchSection';
import WalletStatus from './components/WalletStatus';
import { useMockSn1 } from './hooks/useMockSn1';

const App = () => {
  const { publicKey, connected } = useWallet();
  const sn1Balance = useMockSn1(publicKey?.toBase58());

  return (
    <div className="min-h-screen bg-transparent">
      <HeroSection />
      <WalletStatus publicKey={publicKey} sn1Balance={sn1Balance} />
      <CoreMissionSection />
      <LiveDashboardSection />
      <TokenLaunchSection walletConnected={connected} sn1Balance={sn1Balance} />
      <NftBadgeSection walletConnected={connected} sn1Balance={sn1Balance} />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default App;
