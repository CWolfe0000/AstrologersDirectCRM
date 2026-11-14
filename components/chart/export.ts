"use client";

/** Client-side export of a rendered chart wheel. */
function serialize(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1200");
  clone.setAttribute("height", "1200");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `.glyph{font-family:"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols","DejaVu Sans",sans-serif}`;
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chart";
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function findChartSvg(chartId: string) {
  return document.querySelector<SVGSVGElement>(`[data-chart-id="${chartId}"] svg`);
}

export function downloadSvg(svg: SVGSVGElement | null, name: string) {
  if (!svg) return false;
  const blob = new Blob([serialize(svg)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  download(url, `${slug(name)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export function downloadPng(svg: SVGSVGElement | null, name: string) {
  if (!svg) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    const data = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialize(svg));
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 1200;
      c.height = 1200;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 1200, 1200);
      ctx.drawImage(img, 0, 0, 1200, 1200);
      download(c.toDataURL("image/png"), `${slug(name)}.png`);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = data;
  });
}
