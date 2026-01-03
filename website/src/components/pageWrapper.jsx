import pyramid from "../assets/pyramid.png"

export default function PageWrapper({ children }) {
  return (
    <div className="relative min-h-screen bg-green-600 overflow-hidden">
      <img
        src={pyramid}
        alt=""
        className="pointer-events-none absolute inset-0 m-auto w-[1200px] max-w-[140vw] blur-[1px] opacity-25  z-0"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}