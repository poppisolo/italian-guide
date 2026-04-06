export type StatoScuola = 'In attesa test' | 'In attesa classe' | 'Assegnato' | 'Inattivo';
export type Livello = 'Alfa' | 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2';
export type Giorno = 'Lunedì' | 'Martedì' | 'Mercoledì' | 'Giovedì' | 'Venerdì' | 'Sabato';
export type StatoPresenza = 'Presente' | 'Assente' | 'Ritardo';

export interface Utente {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  dataNascita: string;
  nazionalita: string;
  dataIscrizione: string;
  consensoPrivacy: boolean;
  isSocio: boolean;
  isVolontario: boolean;
}

export interface LinguaParlata {
  idUtente: number;
  lingua: string;
}

export interface ProfiloStudente {
  id: number;
  idUtente: number;
  statoScuola: StatoScuola;
  dataUltimoTest?: string;
  livelloRaggiunto?: Livello;
  noteDidattiche?: string;
}

export interface ProfiloVolontario {
  id: number;
  idUtente: number;
  livelloPreferito?: Livello;
  noteMetodologiche?: string;
  dataScadenzaSocio: string;
}

export interface Disponibilita {
  id: number;
  idUtente: number;
  giorno: Giorno;
  oraInizio: string;
  oraFine: string;
}

export interface Tavolo {
  id: number;
  nomeTavolo: string;
  capacitaMax: number;
}

export interface Classe {
  id: number;
  nomeClasse: string;
  idInsegnante: number;
  idTavolo: number;
  giorno: Giorno;
  oraInizio: string;
  oraFine: string;
  livelloTarget: Livello;
}

export interface IscrizioneClasse {
  idClasse: number;
  idStudente: number;
}

export interface Lezione {
  id: number;
  idClasse: number;
  dataLezione: string;
  idInsegnanteEffettivo: number;
  argomentoTrattato?: string;
  noteSegreteria?: string;
}

export interface Presenza {
  idLezione: number;
  idStudente: number;
  stato: StatoPresenza;
  minutiRitardo?: number;
}

export interface SessioneTest {
  id: number;
  data: string;
  studentiConvocati: number[];
  risultati: { idStudente: number; livello: Livello; note?: string }[];
  completata: boolean;
}
