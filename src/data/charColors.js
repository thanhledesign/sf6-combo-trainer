// Per-character art gradient, sampled from public/art/<id>.jpg (most saturated dominant colors, boosted) so the card container echoes the art.
export const ART_COLORS = {
  "aki": [
    "#b71b47",
    "#9a1bb7"
  ],
  "akuma": [
    "#b71b1e",
    "#b7631b"
  ],
  "alex": [
    "#b70000",
    "#f29a24"
  ],
  "arjun": [
    "#b74300",
    "#b79a00"
  ],
  "blanka": [
    "#f2a500",
    "#b70120"
  ],
  "cammy": [
    "#003db7",
    "#bc511c"
  ],
  "chunli": [
    "#248df2",
    "#242af2"
  ],
  "cviper": [
    "#b71444",
    "#1b4fb7"
  ],
  "deejay": [
    "#f0cf07",
    "#00b781"
  ],
  "dhalsim": [
    "#b72900",
    "#f2c324"
  ],
  "ed": [
    "#0c99b7",
    "#b71b85"
  ],
  "ehonda": [
    "#f28a22",
    "#76b71b"
  ],
  "elena": [
    "#d94d00",
    "#bde622"
  ],
  "guile": [
    "#b74706",
    "#1bb764"
  ],
  "ingrid": [
    "#281bb7",
    "#8a1bb7"
  ],
  "jamie": [
    "#d48309",
    "#c3d409"
  ],
  "jp": [
    "#b71b23",
    "#b75c1b"
  ],
  "juri": [
    "#d8009e",
    "#6900b7"
  ],
  "ken": [
    "#c33b00",
    "#c39800"
  ],
  "kimberly": [
    "#f22700",
    "#00b0f2"
  ],
  "lily": [
    "#b7231b",
    "#1ec8cb"
  ],
  "luke": [
    "#0600b7",
    "#f2b824"
  ],
  "mai": [
    "#e35b22",
    "#e3b822"
  ],
  "manon": [
    "#e63322",
    "#24bdf2"
  ],
  "marisa": [
    "#f10200",
    "#f28224"
  ],
  "mbison": [
    "#951bb7",
    "#1bb7b7"
  ],
  "random": [
    "#6b7280",
    "#374151"
  ],
  "rashid": [
    "#f27100",
    "#f2e400"
  ],
  "ryu": [
    "#b71500",
    "#f29824"
  ],
  "sagat": [
    "#f2b824",
    "#c9f224"
  ],
  "terry": [
    "#d90700",
    "#d96f00"
  ],
  "yasmine": [
    "#10abdd",
    "#b71b3d"
  ],
  "zangief": [
    "#b70c00",
    "#f29a24"
  ]
};

export const artGradient = (id) => {
  const [a, b] = ART_COLORS[id === 'bison' ? 'mbison' : id] || ['#4b5563', '#1f2937'];
  return `linear-gradient(135deg, ${a}, ${b})`;
};
