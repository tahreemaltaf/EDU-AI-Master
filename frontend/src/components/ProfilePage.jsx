import { useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    institute: "",
    bio: "",
    photo: "",
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    alert("Profile saved successfully!");
  };

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "40px",
      background: "linear-gradient(135deg, #020617, #0b1220, #020617)",
      color: "white",
      fontFamily: "Arial, sans-serif",
    },

    header: {
      textAlign: "center",
      marginBottom: "40px",
    },

    title: {
      fontSize: "36px",
      fontWeight: "bold",
    },

    subtitle: {
      color: "#94a3b8",
      marginTop: "8px",
    },

    container: {
      maxWidth: "1100px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
    },

    card: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "24px",
      padding: "30px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    },

    input: {
      width: "100%",
      padding: "14px",
      marginTop: "8px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.1)",
      background: "#0f172a",
      color: "white",
      outline: "none",
    },

    label: {
      fontSize: "12px",
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },

    button: {
      width: "100%",
      padding: "14px",
      marginTop: "10px",
      borderRadius: "14px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
      color: "white",
      background: "linear-gradient(90deg, #06b6d4, #2563eb)",
    },

    previewAvatarWrap: {
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      margin: "0 auto",
      border: "3px solid #06b6d4",
      overflow: "hidden",
      background: "#0f172a",
    },

    previewAvatar: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },

    previewName: {
      fontSize: "22px",
      fontWeight: "bold",
      marginTop: "20px",
    },

    previewText: {
      color: "#94a3b8",
      marginTop: "6px",
    },

    bioBox: {
      marginTop: "20px",
      background: "#0f172a",
      padding: "14px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.1)",
      fontSize: "14px",
      color: "#cbd5e1",
    },
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>Profile Settings</div>
        <div style={styles.subtitle}>Manage your personal information</div>
      </div>

      <div style={styles.container}>

        {/* FORM */}
        <div style={styles.card}>
          <h2 style={{ color: "#67e8f9", marginBottom: "20px" }}>
            Edit Profile
          </h2>

          <div>
            <div style={styles.label}>Name</div>
            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your name"
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <div style={styles.label}>Institute</div>
            <input
              name="institute"
              value={profile.institute}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your institute"
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <div style={styles.label}>Profile Photo URL</div>
            <input
              name="photo"
              value={profile.photo}
              onChange={handleChange}
              style={styles.input}
              placeholder="Image URL"
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <div style={styles.label}>Bio</div>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows="5"
              style={{ ...styles.input, resize: "none" }}
              placeholder="Write something about yourself"
            />
          </div>

          <button onClick={handleSave} style={styles.button}>
            Save Profile
          </button>
        </div>

        {/* PREVIEW */}
        <div style={styles.card}>
          <h2 style={{ color: "#94a3b8", textAlign: "center" }}>
            Live Preview
          </h2>

          <div style={styles.previewAvatarWrap}>
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="profile"
                style={styles.previewAvatar}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#64748b",
                fontSize: "12px"
              }}>
                No Image
              </div>
            )}
          </div>

          <div style={styles.previewName}>
            {profile.name || "Your Name"}
          </div>

          <div style={styles.previewText}>
            {profile.institute || "Your Institute"}
          </div>

          <div style={styles.bioBox}>
            {profile.bio || "Your bio will appear here..."}
          </div>

          <div style={{
            marginTop: "30px",
            fontSize: "12px",
            color: "#64748b",
            textAlign: "center"
          }}>
            Updates instantly in preview
          </div>
        </div>

      </div>
    </div>
  );
}