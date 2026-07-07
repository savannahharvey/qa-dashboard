export function mkPoints(
  values: number[],
  min: number,
  max: number,
  width: number,
  height: number,
  padL = 0,
  padR = 0,
  padT = 0,
  padB = 0,
) {
  const n = values.length;
  if (n === 0) return "";
  const range = max - min || 1;
  const x = (i: number) => padL + (n === 1 ? 0 : (i / (n - 1)) * (width - padL - padR));
  const y = (v: number) => padT + (1 - (v - min) / range) * (height - padT - padB);
  return values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
}

export function mkAreaPath(
  values: number[],
  min: number,
  max: number,
  width: number,
  height: number,
  padL = 0,
  padR = 0,
  padT = 0,
  padB = 0,
) {
  const n = values.length;
  if (n === 0) return "";
  const range = max - min || 1;
  const x = (i: number) => padL + (n === 1 ? 0 : (i / (n - 1)) * (width - padL - padR));
  const y = (v: number) => padT + (1 - (v - min) / range) * (height - padT - padB);
  const base = height - padB;
  let d = `M ${x(0).toFixed(1)},${base.toFixed(1)} `;
  values.forEach((v, i) => {
    d += `L ${x(i).toFixed(1)},${y(v).toFixed(1)} `;
  });
  d += `L ${x(n - 1).toFixed(1)},${base.toFixed(1)} Z`;
  return d;
}

export function yFor(v: number, min: number, max: number, height: number, padT = 0, padB = 0) {
  const range = max - min || 1;
  return padT + (1 - (v - min) / range) * (height - padT - padB);
}

export function autoRange(values: number[], pad = 1): [number, number] {
  if (!values.length) return [0, 1];
  return [Math.min(...values) - pad, Math.max(...values) + pad];
}
