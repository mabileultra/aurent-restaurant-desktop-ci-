import { Banknote, CreditCard, Coins, Smartphone, Wallet } from 'lucide-react';

export default function PaymentIcon({ method }) {
  const Icon =
    method === 'ADVANCE'
      ? Coins
      : method === 'CREDIT'
        ? Wallet
        : method === 'CARD'
          ? CreditCard
          : method === 'CASHLESS'
            ? Smartphone
            : method === 'MPESA'
              ? Smartphone
              : method === 'MIXED'
                ? Wallet
                : Banknote;
  return <Icon size={15} strokeWidth={1.75} className="shrink-0 text-ink-muted" />;
}
