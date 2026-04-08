import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────
export interface Studente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  nazionalita: string;
  data_nascita: string | null;
  lingue_parlate: string[];
  livello: string | null;
  stato_scuola: string;
  note: string;
  disponibilita: { giorno: string; oraInizio: string; oraFine: string }[];
  created_at: string;
}

export interface Insegnante {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  nazionalita: string;
  data_nascita: string | null;
  disponibilita: { giorno: string; oraInizio: string; oraFine: string }[];
  livello_preferito: string | null;
  note_metodologiche: string;
  data_scadenza_socio: string | null;
  created_at: string;
}

export interface Classe {
  id: string;
  nome: string;
  livello: string | null;
  giorno_settimana: string | null;
  orario_inizio: string | null;
  orario_fine: string | null;
  aula: string | null;
  insegnante_id: string | null;
  created_at: string;
}

export interface Iscrizione {
  id: string;
  studente_id: string;
  classe_id: string;
  data_iscrizione: string | null;
  attiva: boolean;
}

export interface TestRecord {
  id: string;
  studente_id: string;
  data_test: string | null;
  livello_assegnato: string | null;
  note: string | null;
  created_at: string;
}

export interface Presenza {
  id: string;
  studente_id: string;
  classe_id: string;
  data: string;
  presente: boolean;
  note: string | null;
}

// ── Studenti ───────────────────────────────────────────
export function useStudenti() {
  return useQuery({
    queryKey: ['studenti'],
    queryFn: async () => {
      const { data, error } = await supabase.from('studenti' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Studente[]) || [];
    },
  });
}

export function useAddStudente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Omit<Studente, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('studenti' as any).insert(s as any).select().single();
      if (error) throw error;
      return data as unknown as Studente;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studenti'] }),
  });
}

export function useUpdateStudente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Studente> & { id: string }) => {
      const { error } = await supabase.from('studenti' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studenti'] }),
  });
}

export function useDeleteStudente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('studenti' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studenti'] });
      qc.invalidateQueries({ queryKey: ['iscrizioni'] });
      qc.invalidateQueries({ queryKey: ['test'] });
      qc.invalidateQueries({ queryKey: ['presenze'] });
    },
  });
}

// ── Insegnanti ─────────────────────────────────────────
export function useInsegnanti() {
  return useQuery({
    queryKey: ['insegnanti'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insegnanti' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Insegnante[]) || [];
    },
  });
}

export function useAddInsegnante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: Omit<Insegnante, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('insegnanti' as any).insert(i as any).select().single();
      if (error) throw error;
      return data as unknown as Insegnante;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insegnanti'] }),
  });
}

export function useUpdateInsegnante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Insegnante> & { id: string }) => {
      const { error } = await supabase.from('insegnanti' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insegnanti'] }),
  });
}

export function useDeleteInsegnante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insegnanti' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insegnanti'] });
      qc.invalidateQueries({ queryKey: ['classi'] });
    },
  });
}

// ── Classi ─────────────────────────────────────────────
export function useClassi() {
  return useQuery({
    queryKey: ['classi'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classi' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Classe[]) || [];
    },
  });
}

export function useAddClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<Classe, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('classi' as any).insert(c as any).select().single();
      if (error) throw error;
      return data as unknown as Classe;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classi'] }),
  });
}

export function useUpdateClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Classe> & { id: string }) => {
      const { error } = await supabase.from('classi' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classi'] }),
  });
}

export function useDeleteClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classi' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classi'] });
      qc.invalidateQueries({ queryKey: ['iscrizioni'] });
    },
  });
}

// ── Iscrizioni ─────────────────────────────────────────
export function useIscrizioni() {
  return useQuery({
    queryKey: ['iscrizioni'],
    queryFn: async () => {
      const { data, error } = await supabase.from('iscrizioni' as any).select('*');
      if (error) throw error;
      return (data as unknown as Iscrizione[]) || [];
    },
  });
}

export function useAddIscrizione() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (i: Omit<Iscrizione, 'id'>) => {
      const { data, error } = await supabase.from('iscrizioni' as any).insert(i as any).select().single();
      if (error) throw error;
      return data as unknown as Iscrizione;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iscrizioni'] }),
  });
}

export function useDeleteIscrizione() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('iscrizioni' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iscrizioni'] }),
  });
}

export function useDeleteIscrizioniByClasse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (classeId: string) => {
      const { error } = await supabase.from('iscrizioni' as any).delete().eq('classe_id', classeId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iscrizioni'] }),
  });
}

// ── Test ───────────────────────────────────────────────
export function useTest() {
  return useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      const { data, error } = await supabase.from('test' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as TestRecord[]) || [];
    },
  });
}

export function useAddTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<TestRecord, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('test' as any).insert(t as any).select().single();
      if (error) throw error;
      return data as unknown as TestRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test'] }),
  });
}

export function useAddTestBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (records: Omit<TestRecord, 'id' | 'created_at'>[]) => {
      const { data, error } = await supabase.from('test' as any).insert(records as any).select();
      if (error) throw error;
      return (data as unknown as TestRecord[]) || [];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test'] }),
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TestRecord> & { id: string }) => {
      const { error } = await supabase.from('test' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['test'] });
      qc.invalidateQueries({ queryKey: ['studenti'] });
    },
  });
}

// ── Presenze ───────────────────────────────────────────
export function usePresenze() {
  return useQuery({
    queryKey: ['presenze'],
    queryFn: async () => {
      const { data, error } = await supabase.from('presenze' as any).select('*').order('data', { ascending: false });
      if (error) throw error;
      return (data as unknown as Presenza[]) || [];
    },
  });
}

export function useUpsertPresenze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (records: Omit<Presenza, 'id'>[]) => {
      // Delete existing presenze for same classe+data, then insert
      if (records.length === 0) return;
      const classe_id = records[0].classe_id;
      const data = records[0].data;
      await supabase.from('presenze' as any).delete().eq('classe_id', classe_id).eq('data', data);
      const { error } = await supabase.from('presenze' as any).insert(records as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presenze'] }),
  });
}
