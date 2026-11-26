/**
 * Publicação pelo GitHub (API Git Data). Usa GITHUB_TOKEN, GITHUB_REPO
 * ("dono/repositorio") e GITHUB_BRANCH (padrão: main). A Vercel percebe o
 * commit novo e publica uma versão nova do site sozinha.
 */

export interface RepoFile {
  path: string;
  content: string; // texto UTF-8
}

const branch = () => process.env.GITHUB_BRANCH || "main";

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status} em ${path}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/** Commit com vários arquivos de uma vez. Falha (sem sobrescrever) se a branch andou no meio. */
export async function commitFiles(
  files: RepoFile[],
  message: string,
  expectedParent?: string | null,
): Promise<{ sha: string; url: string; parent: string }> {
  const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(branch())}`);
  const parentSha = ref.object.sha;
  if (expectedParent && expectedParent !== parentSha) {
    throw new ConflictError(parentSha);
  }
  const parent = await gh<{ tree: { sha: string } }>(`/git/commits/${parentSha}`);

  const tree = [];
  for (const file of files) {
    const blob = await gh<{ sha: string }>(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
    });
    tree.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh<{ sha: string }>(`/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
  });
  const commit = await gh<{ sha: string; html_url: string }>(`/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parentSha] }),
  });
  await gh(`/git/refs/heads/${encodeURIComponent(branch())}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { sha: commit.sha, url: commit.html_url, parent: parentSha };
}

export class ConflictError extends Error {
  constructor(public headSha: string) {
    super("O catálogo mudou no GitHub desde que você abriu o painel.");
  }
}

/** Conteúdo atual de um arquivo na branch + o commit em que ele está. */
export async function readFileAtHead(path: string): Promise<{ content: string; headSha: string }> {
  const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(branch())}`);
  const headSha = ref.object.sha;
  const res = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${path}?ref=${headSha}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status} ao ler ${path}`);
  return { content: await res.text(), headSha };
}

export type DeployState = "pending" | "success" | "failure" | "unknown";

/** Estado do deploy de um commit, pelos "status checks" que a Vercel publica no GitHub. */
export async function commitDeployState(sha: string): Promise<{ state: DeployState; url: string | null }> {
  const data = await gh<{ state: string; statuses: Array<{ context: string; state: string; target_url: string | null }> }>(
    `/commits/${sha}/status`,
  );
  const vercel = data.statuses.find((status) => /vercel/i.test(status.context));
  if (!vercel) return { state: data.statuses.length ? (data.state as DeployState) : "unknown", url: null };
  const state: DeployState =
    vercel.state === "success" ? "success" : vercel.state === "pending" ? "pending" : vercel.state === "failure" || vercel.state === "error" ? "failure" : "unknown";
  return { state, url: vercel.target_url };
}
