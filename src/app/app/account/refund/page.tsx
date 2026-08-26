import { RefundGuarantee } from "@/components/account/refund-guarantee";
export default function RefundPage() {
  return (
    <div className="account-page">
      <header>
        <p className="eyebrow">Membership support</p>
        <h1>Money-back guarantee.</h1>
        <p>
          If STHENO is not right for you, the first paid charge can be refunded
          within 30 days, subject to the Terms.
        </p>
      </header>
      <RefundGuarantee />
    </div>
  );
}
