export default function Home() {
  return (
    <div style={styles.container}>
      <img
        src="/college.jpg"
        alt="PACE College"
        style={styles.image}
      />
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "calc(100vh - 64px)", // matches navbar height better
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#111827",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain", // show full image without crop
  },
};