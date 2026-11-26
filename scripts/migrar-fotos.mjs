#!/usr/bin/env node
/**
 * Leva as fotos que a API servia ("/media/products/<id>/<arquivo>") para o
 * novo modelo e reescreve os endereços em content/catalog.json.
 *
 *   # 1) copia as fotos para public/media/products (vão junto no Git; o site
 *   #    deixa de depender da API). Sem --origem, usa ../../PerfumariaApi/instance/product_images
 *   node scripts/migrar-fotos.mjs --local
 *
 *   # 2) produção: envia para o Vercel Blob (pegue o token em Vercel → Storage → Blob → .env.local)
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/migrar-fotos.mjs --origem ../../PerfumariaApi/instance/product_images --blob
 *
 * Pode rodar de novo: o que já foi enviado é reaproveitado (registro em
 * scripts/.fotos-migradas.json). Depois do --blob, faça commit do
 * content/catalog.json e publique.
 */
import { copyFile, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const origin = get("--origem") ?? resolve(dirname(new URL(import.meta.url).pathname), "..", "..", "..", "PerfumariaApi", "instance", "product_images");
const toBlob = args.includes("--blob");
const toLocal = args.includes("--local");

if (toBlob === toLocal) {
  console.error("Uso: node scripts/migrar-fotos.mjs --origem <pasta product_images da API> (--local | --blob)");
  process.exit(1);
}
if (toBlob && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Defina BLOB_READ_WRITE_TOKEN (Vercel → Storage → seu Blob → .env.local).");
  process.exit(1);
}

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const catalogPath = join(root, "content", "catalog.json");
const logPath = join(root, "scripts", ".fotos-migradas.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const done = JSON.parse(await readFile(logPath, "utf8").catch(() => "{}"));

const PREFIX = "/media/products/";
const urls = new Set();
for (const p of catalog.products) {
  for (const url of [p.coverImage, p.hoverImage, ...(p.images ?? [])]) {
    if (url && url.startsWith(PREFIX)) urls.add(url);
  }
}
console.log(`${urls.size} fotos para migrar (${toBlob ? "Vercel Blob" : "public/media"}).`);

const put = toBlob ? (await import("@vercel/blob")).put : null;
let count = 0;
let missing = 0;
for (const url of urls) {
  const relative = url.slice(PREFIX.length); // <id>/<arquivo>
  const source = join(resolve(origin), relative);
  try {
    await access(source);
  } catch {
    missing += 1;
    console.warn(`  ! não encontrada: ${source}`);
    continue;
  }
  if (toLocal) {
    const target = join(root, "public", "media", "products", relative);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    done[url] = url; // mesmo endereço, agora servido pelo próprio Next
  } else if (!done[url] || done[url].startsWith("/")) {
    const body = await readFile(source);
    const result = await put(`produtos/${relative}`, body, {
      access: "public",
      contentType: relative.endsWith(".png") ? "image/png" : relative.endsWith(".webp") ? "image/webp" : "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    done[url] = result.url;
  }
  count += 1;
  if (count % 50 === 0) {
    console.log(`  ${count}/${urls.size}`);
    await writeFile(logPath, JSON.stringify(done, null, 1));
  }
}
await writeFile(logPath, JSON.stringify(done, null, 1));

if (toBlob) {
  const swap = (url) => (url && done[url] && !done[url].startsWith("/") ? done[url] : url);
  for (const p of catalog.products) {
    p.coverImage = swap(p.coverImage);
    p.hoverImage = swap(p.hoverImage);
    p.images = (p.images ?? []).map(swap);
  }
  catalog.updatedAt = new Date().toISOString();
  await writeFile(catalogPath, JSON.stringify(catalog, null, 1) + "\n");
  console.log(`OK: ${count} fotos no Blob e endereços trocados em content/catalog.json. Faça commit e push.`);
} else {
  console.log(`OK: ${count} fotos copiadas para public/media/products. Agora: git add public/media content && git commit && git push.`);
}
if (missing) console.log(`${missing} fotos não foram encontradas na pasta de origem.`);
