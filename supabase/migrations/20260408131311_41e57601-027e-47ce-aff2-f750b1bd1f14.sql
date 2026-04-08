
-- Studenti
CREATE TABLE public.studenti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cognome text NOT NULL,
  email text DEFAULT '',
  telefono text DEFAULT '',
  nazionalita text DEFAULT '',
  data_nascita date,
  lingue_parlate text[] DEFAULT '{}',
  livello text,
  stato_scuola text NOT NULL DEFAULT 'In attesa test',
  note text DEFAULT '',
  disponibilita jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insegnanti
CREATE TABLE public.insegnanti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cognome text NOT NULL,
  email text DEFAULT '',
  telefono text DEFAULT '',
  nazionalita text DEFAULT '',
  data_nascita date,
  disponibilita jsonb DEFAULT '[]'::jsonb,
  livello_preferito text,
  note_metodologiche text DEFAULT '',
  data_scadenza_socio date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Classi
CREATE TABLE public.classi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  livello text,
  giorno_settimana text,
  orario_inizio text,
  orario_fine text,
  aula text,
  insegnante_id uuid REFERENCES public.insegnanti(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Iscrizioni
CREATE TABLE public.iscrizioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studente_id uuid NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
  classe_id uuid NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
  data_iscrizione date DEFAULT current_date,
  attiva boolean DEFAULT true
);

-- Test
CREATE TABLE public.test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studente_id uuid NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
  data_test date,
  livello_assegnato text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Presenze
CREATE TABLE public.presenze (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studente_id uuid NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
  classe_id uuid NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
  data date NOT NULL,
  presente boolean DEFAULT true,
  note text
);

-- RLS with public access (no auth yet)
ALTER TABLE public.studenti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.studenti FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.insegnanti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.insegnanti FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.classi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.classi FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.iscrizioni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.iscrizioni FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.test FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.presenze ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON public.presenze FOR ALL USING (true) WITH CHECK (true);
