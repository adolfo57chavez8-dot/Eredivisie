export default function Footer() {
  return (
    <footer className="bg-tinta text-crema/60 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm flex flex-col md:flex-row justify-between gap-2">
        <p>© {new Date().getFullYear()} Fútbol Holanda &amp; Europa — Historia, resultados y rankings.</p>
        <p>Datos administrados manualmente · Cálculo automático de puntos</p>
      </div>
    </footer>
  );
}
