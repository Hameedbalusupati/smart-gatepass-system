import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!email || !token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications/${email}`);
        if (!res.ok) return;

        const data = await res.json();
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.log("Notification error:", err);
      }
    };

    fetchNotifications();
  }, [email, token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logoLink}>
        <h3 style={styles.logo}>Smart Gate Pass</h3>
      </Link>

      <div style={styles.links}>
        <Link style={styles.link} to="/">Home</Link>

        {!token && (
          <>
            <Link style={styles.link} to="/login">Login</Link>
            <Link style={styles.link} to="/register">Register</Link>
          </>
        )}

        {token && role === "student" && (
          <>
            <Link style={styles.link} to="/student">Dashboard</Link>
            <Link style={styles.link} to="/status">Status</Link>
          </>
        )}

        {token && role === "faculty" && (
          <Link style={styles.link} to="/faculty">Faculty</Link>
        )}

        {token && role === "hod" && (
          <Link style={styles.link} to="/hod">HOD</Link>
        )}

        {token && role === "security" && (
          <Link style={styles.link} to="/security">Security</Link>
        )}

        {token && (
          <Link to="/notifications" style={styles.notificationIcon}>
            🔔
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </Link>
        )}

        {token && (
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#1e293b",
    color: "white",
  },
  logoLink: { textDecoration: "none", color: "white" },
  logo: { margin: 0, cursor: "pointer" },
  links: { display: "flex", gap: "18px", alignItems: "center" },
  link: { color: "white", textDecoration: "none", fontWeight: "500" },
  notificationIcon: {
    position: "relative",
    fontSize: "18px",
    textDecoration: "none",
    color: "white",
  },
  badge: {
    position: "absolute",
    top: "-8px",
    right: "-10px",
    background: "red",
    color: "white",
    fontSize: "12px",
    padding: "2px 6px",
    borderRadius: "50%",
  },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: "4px",
  },
};