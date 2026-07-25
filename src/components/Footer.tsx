const COLUMNS = [
  {
    title: 'Collection',
    links: ['Solstice 39', 'Meridian 41', 'Archive', 'Bracelets & straps'],
  },
  {
    title: 'The house',
    links: ['Atelier', 'Calibres', 'Servicing', 'Journal'],
  },
  {
    title: 'Contact',
    links: ['Rue du Rhône 62', '1204 Genève', '+41 22 000 00 00', 'atelier@slappis.ch'],
  },
]

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div>
            <div className="footer__mark">SLAPPIS</div>
            <p className="footer__blurb">
              Watchmakers, Genève. Two references a year, finished by hand, delivered in a
              walnut box that is rather nicer than it needs to be.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div className="footer__col" key={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#top">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__base">
          <span>© 2026 Slappis Watch Co.</span>
          <span>Every image on this site is generated in real time — no photography.</span>
          <span>Genève · Suisse</span>
        </div>
      </div>
    </footer>
  )
}
