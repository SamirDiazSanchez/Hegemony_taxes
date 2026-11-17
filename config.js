// Reglas del juego: leyes, multiplicador impositivo y tablas de impuestos por clase.
window.DEFAULT_CONFIG = {
  // Símbolo de la moneda (SVG: V con dos barras) que se antepone al monto
  currency: '<svg class="cur" viewBox="0 0 20 24" aria-label="moneda"><path d="M4 3 L10 20 L16 3 M1 9 H19 M1 14 H19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="butt" stroke-linejoin="miter"/></svg>',
  policies: ["A", "B", "C"],
  // Leyes del juego.
  laws: [
    // color: color de cada ley (1 azul, 2 gris, 3 rosado, 4 rojo, 5 naranja).
    { id: "fiscal",    name: "Política Fiscal",      color: "#3b82c4" },
    { id: "labor",     name: "Mercado Laboral",      color: "#8a949e" },
    { id: "tax",       name: "Impuestos",            color: "#e86fa6" },
    { id: "health",    name: "Salud y Prestaciones", color: "#d94f4f" },
    { id: "education", name: "Educación",            color: "#f0852d" }
  ],
  // Multiplicador impositivo = base(ley 3) + factor(ley 3) × (valor(ley 4) + valor(ley 5))
  multiplier: {
    baseLaw: "tax",                    // ley 3
    sumLaws: ["health", "education"],  // leyes 4 y 5
    sumValue: { A: 2, B: 1, C: 0 },    // valor de cada una de las leyes 4 y 5 según su nivel
    base:   { A: 3, B: 2, C: 1 },      // base según nivel de la ley 3
    factor: { A: 2, B: 1, C: 0 }       // por cuánto se multiplica la suma de 4 y 5
  },
  // Datos que se piden a cada clase y cómo se calcula su impuesto.
  classes: [
    // Clase Obrera: impuesto = tabla[nivel ley 2 (Mercado Laboral)][nivel ley 3 (Impuestos)] × Población
    { id: "working", name: "Clase Obrera", color: "#c0392b", fields: [
      { id: "pop", label: "Población" } ],
      table: { rowLaw: "labor", colLaw: "tax", perField: "pop",
        values: { A: { A: 7, B: 6, C: 5 }, B: { A: 4, B: 4, C: 4 }, C: { A: 1, B: 2, C: 3 } } } },
    // Clase Media: impuesto = tabla[nivel ley 2][nivel ley 3] × empresas externas con trabajadores
    //                        + multiplicador impositivo × empresas propias
    { id: "middle", name: "Clase Media", color: "#e6a23c", note: "Esto debe ser con empresas operativas.", fields: [
      { id: "ext", label: "Empresas externas con trabajadores" },
      { id: "own", label: "Empresas propias" } ],
      table: { rowLaw: "labor", colLaw: "tax", perField: "ext", multField: "own",
        values: { A: { A: 7, B: 6, C: 5 }, B: { A: 4, B: 4, C: 4 }, C: { A: 1, B: 2, C: 3 } } } },
    // Capitalistas: base = multiplicador × empresas; renta restante = renta − base;
    // impuesto = base + tabla(renta restante, nivel ley 3)
    { id: "capitalist", name: "Capitalistas", color: "#2c6fbb", note: "Esto debe ser con empresas operativas.", fields: [
      { id: "firms", label: "Número de empresas" },
      { id: "income", label: "Ingresos" } ],
      corp: { firmsField: "firms", revenueField: "income", colLaw: "tax",
        // min = renta mínima del tramo (por debajo de 5 no se paga)
        brackets: [
          { min: 5,   A: 1,   B: 2,   C: 2 },
          { min: 10,  A: 5,   B: 5,   C: 4 },
          { min: 25,  A: 12,  B: 10,  C: 7 },
          { min: 50,  A: 24,  B: 15,  C: 10 },
          { min: 100, A: 40,  B: 30,  C: 20 },
          { min: 200, A: 100, B: 70,  C: 40 },
          { min: 300, A: 160, B: 120, C: 60 }
        ] } }
  ]
};
