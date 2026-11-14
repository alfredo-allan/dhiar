const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return currency.format(value);
}

const CONCENTRATION_LABELS: Record<string, string> = {
  parfum: "Parfum",
  extrait: "Extrait de Parfum",
  edp: "Eau de Parfum",
  edt: "Eau de Toilette",
  edc: "Eau de Cologne",
  body_splash: "Body Splash",
  outro: "",
};

export function concentrationLabel(value?: string | null): string {
  return value ? CONCENTRATION_LABELS[value] ?? value : "";
}

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  unissex: "Unissex",
};

export function genderLabel(value?: string | null): string {
  return value ? GENDER_LABELS[value] ?? value : "";
}
