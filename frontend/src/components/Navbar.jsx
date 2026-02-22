import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <h3 style={styles.logo}>Smart Gate Pass</h3>

      <div style={styles.links}>
        {!token && (
          <>
            <Link style={styles.link} to="/">Login</Link>
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
    padding: "15px 30px",
    backgroundColor: "#1e293b",
    color: "white",
  },
  logo: { margin: 0 },
  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  link: {
    color: "white",
    textDecoration: "none",
  },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    cursor: "pointer",
  },
};  