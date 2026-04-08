export default function ProfessionalProfileLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(90deg, #021C14 0%, #021C14 50%, #021C14 100%)",
      }}
    >
      <div className="animate-pulse text-emerald-400 text-xl font-medium drop-shadow-md">
        Loading profile...
      </div>
    </div>
  );
}
