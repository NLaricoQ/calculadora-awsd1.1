export default function Header({ t, lang, setLang }) {
  return (
    <header className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b-4 border-blue-600">
      <div className="flex items-center gap-4">
        {/* Contenedor del Logo: Fondo blanco para hacer resaltar el PNG transparente azul marino */}
        <div className="w-14 h-14 bg-white rounded shadow-inner flex items-center justify-center overflow-hidden border border-slate-300">
          <img 
            src="/logo.png" 
            alt="Logo Empresa" 
            className="w-full h-full object-contain p-1.5"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span class="text-slate-400 text-[10px] font-bold">LOGO</span>';
            }}
          />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">{t.title}</h1>
          <p className="text-slate-400 text-sm hidden sm:block">{t.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select 
          className="bg-slate-800 text-white text-sm rounded border border-slate-700 px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <span className="hidden md:inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{t.norm}</span>
      </div>
    </header>
  );
}