export default function Home() {
  return (
    <>
      <style>{`
        body {
          margin: 0;
        }

        .hero {
          margin-top: 60px; /* navbar height */
          width: 100%;
          height: calc(100vh - 60px);
          overflow: hidden;
          background-color: #111827;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* prevents distortion */
        }

        @media (max-width: 768px) {
          .hero {
            height: auto;
          }

          .hero img {
            height: auto;
            object-fit: contain; /* show full image on mobile */
          }
        }
      `}</style>

      <div className="hero">
        <img src="/college1.jpg" alt="College" />
      </div>
    </>
  );
}