import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function NotificationsPage() {
  const email = localStorage.getItem("email");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!email) return;

    fetch(`${API_BASE_URL}/notifications/${email}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.log(err));
  }, [email]);

  return (
    <div style={{ padding: "30px" }}>
      <h2>Notifications</h2>

      {notifications.length === 0 && <p>No notifications</p>}

      {notifications.map(n => (
        <div
          key={n.id}
          style={{
            background: n.is_read ? "#f1f5f9" : "#dbeafe",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "6px"
          }}
        >
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}