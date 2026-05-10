import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen flex flex-col items-center justify-center px-6 pb-24 text-center">
      <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
        <span className="text-5xl">🔍</span>
      </div>
      <h1 className="text-6xl font-black text-primary-600 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Página no encontrada</h2>
      <p className="text-gray-400 mb-8">Esta página no existe o fue movida.</p>
      <Link href="/" className="btn-primary">Volver al inicio</Link>
    </div>
  );
}
