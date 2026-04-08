import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// ✅ API BASE URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://smart-gatepass-system.onrender.com/api";

export default function Navbar() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [token, setToken] = useState(
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  );

  const [role, setRole] = useState(
    typeof window !== "undefined" ? localStorage.getItem("role") : null
  );

  const [email, setEmail] = useState(
    typeof window !== "undefined" ? localStorage.getItem("email") : null
  );

  const [unreadCount, setUnreadCount] = useState(0);

  // ================= AUTH LISTENER =================
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem("access_token"));
      setRole(localStorage.getItem("role"));
      setEmail(localStorage.getItem("email"));
    };

    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  // ================= FETCH NOTIFICATIONS =================
  useEffect(() => {
    if (!email || !token) return;

    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/notifications/${email}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        // ✅ Prevent crash if API fails
        if (!res.ok) {
          console.log("Notification API failed:", res.status);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          const unread = data.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("Notification error:", err.message);
        }
      }
    };

    fetchNotifications();

    // ✅ Cleanup
    return () => controller.abort();

  }, [email, token]);

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChanged"));
    navigate("/login");
  };

  // ================= UI =================
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logoLink}>
        <h3 style={styles.logo}>Smart Gate Pass</h3>
      </Link>

      <div style={styles.links}>
        <Link style={styles.link} to="/">Home</Link>

        {/* ===== NOT LOGGED IN ===== */}
        {!token && (
          <>
            <Link style={styles.link} to="/login">Login</Link>
            <Link style={styles.link} to="/register">Register</Link>
          </>
        )}

        {/* ===== STUDENT ===== */}
        {token && role === "student" && (
          <>
            <Link style={styles.link} to="/student">Dashboard</Link>
            <Link style={styles.link} to="/status">Status</Link>
          </>
        )}

        {/* ===== FACULTY ===== */}
        {token && role === "faculty" && (
          <Link style={styles.link} to="/faculty">Faculty</Link>
        )}

        {/* ===== HOD ===== */}
        {token && role === "hod" && (
          <Link style={styles.link} to="/hod">HOD</Link>
        )}

        {/* ===== SECURITY ===== */}
        {token && role === "security" && (
          <Link style={styles.link} to="/security">Security</Link>
        )}

        {/* ===== NOTIFICATIONS ===== */}
        {token && (
          <Link to="/notifications" style={styles.notificationIcon}>
            🔔
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </Link>
        )}

        {/* ===== LOGOUT ===== */}
        {token && (
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

/* ================= STYLES ================= */

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#1e293b",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  logoLink: {
    textDecoration: "none",
    color: "white",
  },

  logo: {
    margin: 0,
    cursor: "pointer",
  },

  links: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
  },

  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
  },

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