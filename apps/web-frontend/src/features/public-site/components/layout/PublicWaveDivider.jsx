export default function PublicWaveDivider() {
  return (
    <div className="public-wave-divider" aria-hidden>
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0 24 C240 4 480 44 720 24 C960 4 1200 44 1440 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M0 32 C360 12 720 40 1080 28 C1260 22 1380 34 1440 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
