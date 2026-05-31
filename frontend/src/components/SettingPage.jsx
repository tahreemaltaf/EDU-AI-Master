export default function SettingsPage() {
  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617, #0b1220, #020617)",
      color: "white",
      padding: "40px",
      fontFamily: "Arial, sans-serif",
    },

    container: {
      maxWidth: "800px",
      margin: "0 auto",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "24px",
      padding: "30px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    },

    title: {
      fontSize: "32px",
      fontWeight: "bold",
      marginBottom: "30px",
    },

    section: {
      background: "#0f172a",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "20px",
      borderRadius: "18px",
      marginBottom: "20px",
    },

    sectionTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "8px",
    },

    text: {
      color: "#94a3b8",
      fontSize: "14px",
      marginBottom: "15px",
    },

    btnYellow: {
      background: "#facc15",
      color: "#000",
      padding: "10px 16px",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "bold",
      transition: "0.2s",
    },

    btnRed: {
      background: "#ef4444",
      color: "white",
      padding: "10px 16px",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "bold",
      transition: "0.2s",
    },
  };

  const handleDeactivate = () => {
    alert("Account deactivated (demo)");
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account?"
    );

    if (confirmDelete) {
      alert("Account deleted (demo)");
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        <h1 style={styles.title}>
          Account Settings
        </h1>

        {/* DEACTIVATE */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            Deactivate Account
          </div>

          <div style={styles.text}>
            Temporarily disable your account. You can reactivate anytime.
          </div>

          <button
            style={styles.btnYellow}
            onClick={handleDeactivate}
            onMouseOver={(e) =>
              (e.target.style.opacity = 0.85)
            }
            onMouseOut={(e) =>
              (e.target.style.opacity = 1)
            }
          >
            Deactivate
          </button>
        </div>

        {/* DELETE */}
        <div style={styles.section}>
          <div style={{ ...styles.sectionTitle, color: "#f87171" }}>
            Delete Account
          </div>

          <div style={styles.text}>
            Permanently remove your account and all data. This cannot be undone.
          </div>

          <button
            style={styles.btnRed}
            onClick={handleDelete}
            onMouseOver={(e) =>
              (e.target.style.opacity = 0.85)
            }
            onMouseOut={(e) =>
              (e.target.style.opacity = 1)
            }
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  );
}