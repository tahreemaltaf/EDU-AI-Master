export default function PrivacyPolicy() {
  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617, #0b1220, #020617)",
      color: "white",
      padding: "40px",
      fontFamily: "Arial, sans-serif",
    },

    container: {
      maxWidth: "900px",
      margin: "0 auto",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "24px",
      padding: "40px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    },

    title: {
      fontSize: "38px",
      fontWeight: "bold",
      marginBottom: "20px",
      background: "linear-gradient(90deg, #22d3ee, #3b82f6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    text: {
      fontSize: "16px",
      lineHeight: "1.8",
      color: "#cbd5e1",
      whiteSpace: "pre-line",
    },

    badge: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "999px",
      background: "rgba(34, 211, 238, 0.1)",
      border: "1px solid rgba(34, 211, 238, 0.3)",
      color: "#22d3ee",
      fontSize: "12px",
      marginBottom: "20px",
    },
  };

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        {/* BADGE */}
        <div style={styles.badge}>
          🔒 Secure & Transparent
        </div>

        {/* TITLE */}
        <h1 style={styles.title}>
          Privacy Policy
        </h1>

        {/* CONTENT */}
        <p style={styles.text}>
          Your data is securely stored and never shared with third parties without your consent.

          {"\n\n"}

          EduAI Master may collect educational data, uploaded PDFs, quiz history, and study analytics to improve your learning experience.

          {"\n\n"}

          We use this data only to:
          {"\n"}• Personalize learning experience
          {"\n"}• Improve AI recommendations
          {"\n"}• Track progress and performance

          {"\n\n"}

          We do NOT sell your data to advertisers or third parties.

          {"\n\n"}

          You can request data deletion anytime through account settings.
        </p>

      </div>
    </div>
  );
}