export type EventoTipo = 'audiencia' | 'prazo' | 'pericia' | 'documento' | 'reuniao' | 'outro';

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora: string | null;
  tipo: EventoTipo;
  clienteAssociado: string | null;
  numeroCaso: string | null;
  local?: string | null;
  observacoes?: string | null;
}