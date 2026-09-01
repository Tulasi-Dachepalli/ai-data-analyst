import React, { useState } from "react";

export default function PaymentCheckoutModal({ isOpen, onClose, selectedPlan = "pro", onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("upi"); // "card" | "upi"
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");

  if (!isOpen) return null;

  const planDetails = selectedPlan === "max" ? {
    name: "Max Enterprise Plan",
    price: "₹11,999",
    billing: "Billed Monthly (Includes GST)",
    tier: "max"
  } : {
    name: "Pro Plan",
    price: "₹2,000",
    billing: "Billed Monthly (Includes GST)",
    tier: "pro"
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const generatedInvoice = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      setInvoiceId(generatedInvoice);
      setIsProcessing(false);
      setPaymentDone(true);

      if (onPaymentSuccess) {
        onPaymentSuccess(planDetails.tier);
      }
    }, 1500);
  };

  const handleDownloadReceipt = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${invoiceId}</title>
        <style>
          body { font-family: sans-serif; background: #F9FAFB; padding: 40px; }
          .receipt { max-width: 600px; margin: 0 auto; background: #FFF; padding: 30px; border-radius: 12px; border: 1px solid #E5E7EB; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #8B5CF6; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; color: #1F2937; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
          .total { font-size: 18px; font-weight: 800; color: #10B981; margin-top: 16px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div>
              <div class="title">OFFICIAL PAYMENT RECEIPT</div>
              <div style="font-size:12px;color:#6B7280;">Invoice: ${invoiceId}</div>
            </div>
            <div style="text-align:right;color:#8B5CF6;font-weight:700;">AI Data Copilot</div>
          </div>
          <div class="row"><span>Date:</span><span>${dateStr}</span></div>
          <div class="row"><span>Plan Subscribed:</span><span><strong>${planDetails.name}</strong></span></div>
          <div class="row"><span>Payment Method:</span><span>${paymentMethod === "upi" ? "UPI / Razorpay" : "Card / Stripe"}</span></div>
          <div class="row"><span>Status:</span><span style="color:#10B981;font-weight:700;">PAID ✅</span></div>
          <div class="total">Total Amount: ${planDetails.price} INR</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${invoiceId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      fontFamily: "var(--font-sans, sans-serif)"
    }}>
      <div style={{
        backgroundColor: "#18181B", color: "#F4F4F5", borderRadius: 20,
        maxWidth: 520, width: "100%", padding: 28, boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        border: "1px solid #27272A", position: "relative"
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 20, background: "none", border: "none", fontSize: 20, color: "#A1A1AA", cursor: "pointer" }}>✕</button>

        {!paymentDone ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.05em" }}>Secure Checkout</div>
              <h3 style={{ margin: "4px 0 0 0", fontSize: 22, fontWeight: 800, color: "#FFF" }}>
                Upgrade to {planDetails.name}
              </h3>
            </div>

            {/* Plan Summary Box */}
            <div style={{ backgroundColor: "#27272A", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #3F3F46", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#FFF" }}>{planDetails.name}</div>
                <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>{planDetails.billing}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>
                {planDetails.price} <span style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 400 }}>/ mo</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#A1A1AA", display: "block", marginBottom: 8 }}>
                Select Payment Method:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  style={{
                    padding: "10px", borderRadius: 10, border: paymentMethod === "upi" ? "2px solid #10B981" : "1px solid #3F3F46",
                    background: paymentMethod === "upi" ? "#064E3B" : "#27272A", color: "#FFF",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}
                >
                  📱 UPI / QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  style={{
                    padding: "10px", borderRadius: 10, border: paymentMethod === "card" ? "2px solid #8B5CF6" : "1px solid #3F3F46",
                    background: paymentMethod === "card" ? "#4C1D95" : "#27272A", color: "#FFF",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}
                >
                  💳 Credit/Debit Card
                </button>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              {paymentMethod === "upi" ? (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#D4D4D8", display: "block", marginBottom: 6 }}>
                    Enter UPI ID (Google Pay, PhonePe, Paytm):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="username@okaxis or 9876543210@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #3F3F46", background: "#09090B", color: "#FFF", fontSize: 13, boxSizing: "border-box", outline: "none" }}
                  />
                  <div style={{ fontSize: 11, color: "#71717A", marginTop: 6, textAlign: "center" }}>
                    🔒 Protected by Razorpay 256-Bit SSL Encrypted Payment Gateway
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#D4D4D8", display: "block", marginBottom: 4 }}>Card Number:</label>
                    <input
                      type="text"
                      required
                      placeholder="4532 •••• •••• 8901"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #3F3F46", background: "#09090B", color: "#FFF", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#D4D4D8", display: "block", marginBottom: 4 }}>Expiry:</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #3F3F46", background: "#09090B", color: "#FFF", fontSize: 13, boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#D4D4D8", display: "block", marginBottom: 4 }}>CVC:</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #3F3F46", background: "#09090B", color: "#FFF", fontSize: 13, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#71717A", marginTop: 4, textAlign: "center" }}>
                    🔒 Protected by Stripe PCI-DSS Level 1 Encryption
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: isProcessing ? "#52525B" : "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFF", fontSize: 15, fontWeight: 800, cursor: isProcessing ? "default" : "pointer",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                }}
              >
                {isProcessing ? "Processing Payment..." : `Pay ${planDetails.price} & Activate ${planDetails.name}`}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#10B981" }}>Payment Successful!</h3>
            <p style={{ fontSize: 14, color: "#A1A1AA", margin: "8px 0 20px 0" }}>
              Your account has been upgraded to <strong>{planDetails.name}</strong>.
            </p>

            <div style={{ backgroundColor: "#27272A", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: "#D4D4D8" }}>
              <div>Invoice Reference: <strong>{invoiceId}</strong></div>
              <div style={{ fontSize: 11, color: "#71717A", marginTop: 4 }}>Receipt sent to your email address.</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleDownloadReceipt}
                style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #3F3F46", background: "#27272A", color: "#FFF", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                📄 Download Official Receipt (.html)
              </button>
              <button
                onClick={onClose}
                style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "#8B5CF6", color: "#FFF", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                🚀 Continue to Pro Analytics Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
