import { EventoTipo } from '../types/calendario';

export const TIPO_OPTIONS = [
  { value: 'audiencia', label: 'Audiência', icon: 'gavel', class: 'cal-evento--audiencia' },
  { value: 'prazo', label: 'Prazo', icon: 'timer', class: 'cal-evento--prazo' },
  { value: 'pericia', label: 'Perícia Médica', icon: 'medical_services', class: 'cal-evento--pericia' },
  { value: 'documento', label: 'Entrega de Documentos', icon: 'description', class: 'cal-evento--documento' },
  { value: 'reuniao', label: 'Reunião com Cliente', icon: 'groups', class: 'cal-evento--reuniao' }, // Corrigido
  { value: 'outro', label: 'Outro', icon: 'event_note', class: 'cal-evento--outro' }, // Corrigido
];

export const tipoSafe = (t: string): EventoTipo => {
  const validos: EventoTipo[] = ['audiencia', 'prazo', 'pericia', 'documento', 'reuniao', 'outro'];
  return validos.includes(t as EventoTipo) ? (t as EventoTipo) : 'outro';
};

export const toDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};