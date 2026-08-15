// Editable lens config — update throw ranges, widths, or models here without touching layout code.
const LENS_CONFIG = {
  wings: {
    label: 'Wings',
    width: 26, // ft
    color: '#d97706', // amber
    quantity: '4 in use (2 SR + 2 SL)',
    spare: '1 spare per lens type',
    lenses: [
      { min: 70,   max: 72.8, model: 'Barco TLD+ 2.0–2.8:1' },
      { min: 72.8, max: 117,  model: 'Barco TLD+ 2.8–4.5:1' },
      { min: 117,  max: 130,  model: 'Barco TLD+ 4.5–7.5:1' },
    ]
  },
  center: {
    label: 'Center',
    width: 57, // ft
    color: '#3b82f6', // blue
    quantity: '2 in use',
    spare: '1 spare per lens type',
    lenses: [
      { min: 70,   max: 84.9, model: 'Barco TLD Ultra 1.16–1.49:1' },
      { min: 84.9, max: 114,  model: 'Barco TLD+ 1.5–2.0:1'        },
      { min: 114,  max: 130,  model: 'Barco TLD+ 2.0–2.8:1'        },
    ]
  }
};

const THROW_MIN = 70;
const THROW_MAX = 130;

function getLens(position, throwFt) {
  const cfg = LENS_CONFIG[position];
  for (const l of cfg.lenses) {
    if (throwFt >= l.min && throwFt <= l.max) return l.model;
  }
  return cfg.lenses[cfg.lenses.length - 1].model;
}

function getRatio(position, throwFt) {
  return throwFt / LENS_CONFIG[position].width;
}
