const ITEMS = [
  'Swiss made',
  'In-house calibres',
  '316L steel & 5N gold',
  'Sapphire, both sides',
  '72-hour reserve',
  'Hand-bevelled bridges',
  '250 pieces a year',
  'Genève',
]

export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {[0, 1].map((copy) => (
          <div className="ticker__group" key={copy}>
            {ITEMS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
