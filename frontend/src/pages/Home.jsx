export default function Home() {
  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
        }

        .hero-section {
          background-image: url("/college.jpg");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          width: 100%;
          height: 100vh;
        }
      `}</style>

      <div className="hero-section"></div>
    </>
  );
}