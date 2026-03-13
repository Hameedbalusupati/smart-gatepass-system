import { useState } from "react";
import API_BASE_URL from "../config";

export default function ApplyGatepass() {

  const [form, setForm] = useState({
    reason: "",
    out_time: "",
    return_time: "",
    parent_mobile: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("access_token");


  const handleChange = (e) => {

    const { name, value } = e.target;

    if (name === "parent_mobile") {

      // allow only digits and max 10 numbers
      if (!/^\d{0,10}$/.test(value)) return;

    }

    setForm({
      ...form,
      [name]: value
    });
  };


  const validateMobile = (number) => {

    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(number);

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");

    if (!validateMobile(form.parent_mobile)) {
      setMessage("Parent mobile number must be a valid 10-digit Indian number");
      return;
    }

    try {

      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/gatepass/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {

        setMessage(data.message || "Failed to apply gatepass");

      } else {

        setMessage("Gatepass applied successfully!");

        setForm({
          reason: "",
          out_time: "",
          return_time: "",
          parent_mobile: ""
        });

      }

    } catch (error) {

      console.error("Gatepass submit error:", error);
      setMessage("Cannot reach server");

    } finally {

      setLoading(false);

    }

  };


  return (

    <div style={styles.page}>

      <div style={styles.container}>

        <h2 style={styles.title}>Apply Gatepass</h2>

        <form onSubmit={handleSubmit} style={styles.form}>

          <textarea
            name="reason"
            placeholder="Reason for leaving"
            value={form.reason}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="datetime-local"
            name="out_time"
            value={form.out_time}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="datetime-local"
            name="return_time"
            value={form.return_time}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="tel"
            name="parent_mobile"
            placeholder="Parent Mobile Number"
            value={form.parent_mobile}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Submitting..." : "Apply Gatepass"}
          </button>

        </form>

        {message && <p style={styles.message}>{message}</p>}

      </div>

    </div>

  );
}


const styles = {

  page: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  container: {
    background: "#111827",
    padding: "25px",
    borderRadius: "10px",
    width: "95%",
    maxWidth: "400px",
    color: "white"
  },

  title: {
    textAlign: "center",
    marginBottom: "20px"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white"
  },

  button: {
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer"
  },

  message: {
    marginTop: "10px",
    textAlign: "center",
    color: "#22c55e"
  }

};