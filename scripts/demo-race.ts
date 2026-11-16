// Demonstra o cenário 1 contra a API rodando: 10 reservas simultâneas do mesmo horário.
// Uso: pnpm demo:race   (API em API_URL, padrão http://localhost:3333, com o seed carregado)

const API = process.env.API_URL ?? 'http://localhost:3333';
const ATTEMPTS = 10;
const out = (line = '') => process.stdout.write(`${line}\n`);

async function call<T = { id: string; code: string }>(
  path: string,
  init: RequestInit = {},
  cookie = '',
) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', cookie, ...init.headers },
  });
  return { res, body: (await res.json()) as T };
}

const login = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'clinica@demo.local', password: 'Demo@1234' }),
});
const cookie = login.res.headers
  .getSetCookie()
  .find((c) => c.startsWith('token='))
  ?.split(';')[0];
if (!cookie)
  throw new Error(`login da clínica falhou (${login.res.status}). A API está no ar e com o seed?`);

type Named = { id: string; name: string };
const [patient] = (await call<Named[]>('/clinic/patients', {}, cookie)).body;
const [examType] = (await call<Named[]>('/clinic/exam-types', {}, cookie)).body;
if (!patient || !examType) throw new Error('seed sem pacientes ou tipos de exame');

// Primeiro horário livre a partir de amanhã, no dia da clínica.
const clinicDay = (offset: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(Date.now() + offset * 86_400_000),
  );
let slot: string | undefined;
for (let offset = 1; offset <= 14 && !slot; offset++) {
  const { body: slots } = await call<{ startsAt: string; available: boolean }[]>(
    `/clinic/slots?date=${clinicDay(offset)}`,
    {},
    cookie,
  );
  slot = slots.find((s) => s.available)?.startsAt;
}
if (!slot) throw new Error('nenhum horário livre nos próximos 14 dias');

out(`Horário disputado: ${slot} · paciente: ${patient.name} · exame: ${examType.name}`);
out(`Disparando ${ATTEMPTS} reservas ao mesmo tempo…\n`);

const payload = JSON.stringify({
  patientId: patient.id,
  examTypeId: examType.id,
  scheduledAt: slot,
});
const results = await Promise.all(
  Array.from({ length: ATTEMPTS }, () =>
    call('/clinic/appointments', { method: 'POST', body: payload }, cookie),
  ),
);

results.forEach(({ res, body }, i) => {
  out(`#${String(i + 1).padStart(2)}  ${res.status}  ${res.ok ? `criado ${body.id}` : body.code}`);
});
const created = results.filter((r) => r.res.status === 201).length;
const conflicts = results.filter((r) => r.res.status === 409).length;
out(`\nResultado: ${created} aceita, ${conflicts} recusadas com 409 SLOT_UNAVAILABLE.`);
out('Quem decide é o índice único parcial uq_active_slot no Postgres (ADR-003).');
process.exitCode = created === 1 && conflicts === ATTEMPTS - 1 ? 0 : 1;
