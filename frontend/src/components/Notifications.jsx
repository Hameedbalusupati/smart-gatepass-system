import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) return;

    fetch(`${API_BASE_URL}/notifications/${email}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
  }, [email]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read/${id}`, {
        method: "PUT",
      });

      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={styles.container}>
      <h3>Notifications</h3>

      {notifications.length === 0 && <p>No notifications</p>}

      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            ...styles.notification,
            backgroundColor: n.is_read ? "#f1f5f9" : "#dbeafe"
          }}
          onClick={() => markAsRead(n.id)}
        >
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    width: "350px",
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  notification: {
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};