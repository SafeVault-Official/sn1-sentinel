import { shortenAddress } from '../utils/format';

const WalletStatus = ({ publicKey, sn1Balance }) => (
  <div className="section-shell pb-0 pt-8">
    <div className="glass flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        Wallet: <span className="font-semibold text-cyan-200">{shortenAddress(publicKey?.toBase58())}</span>
      </p>
      <p>
        SN1 Balance: <span className="font-semibold text-green-300">{sn1Balance.toFixed(2)} SN1</span>
      </p>
    </div>
  </div>
);

export default WalletStatus;
