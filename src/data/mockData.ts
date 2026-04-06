import type { Utente, LinguaParlata, ProfiloStudente, ProfiloVolontario, Disponibilita, Tavolo, Classe, IscrizioneClasse, Lezione, Presenza, SessioneTest } from './types';

export const utenti: Utente[] = [
  { id: 1, nome: 'Amina', cognome: 'Hassan', email: 'amina.h@mail.com', telefono: '3331234567', dataNascita: '1995-03-12', nazionalita: 'Somalia', dataIscrizione: '2025-09-01', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 2, nome: 'Chen', cognome: 'Wei', email: 'chen.w@mail.com', telefono: '3339876543', dataNascita: '1988-07-22', nazionalita: 'Cina', dataIscrizione: '2025-09-05', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 3, nome: 'Fatima', cognome: 'Al-Rashid', email: 'fatima.r@mail.com', telefono: '3335551234', dataNascita: '2001-11-30', nazionalita: 'Marocco', dataIscrizione: '2025-09-10', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 4, nome: 'Oleksandr', cognome: 'Kovalenko', email: 'olek.k@mail.com', telefono: '3341112233', dataNascita: '1992-01-15', nazionalita: 'Ucraina', dataIscrizione: '2025-10-01', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 5, nome: 'Maria', cognome: 'Santos', email: 'maria.s@mail.com', telefono: '3356667788', dataNascita: '1999-06-08', nazionalita: 'Brasile', dataIscrizione: '2025-10-15', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 6, nome: 'Abdul', cognome: 'Rahman', email: 'abdul.r@mail.com', telefono: '3367778899', dataNascita: '1985-04-20', nazionalita: 'Pakistan', dataIscrizione: '2025-11-01', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 7, nome: 'Yuki', cognome: 'Tanaka', email: 'yuki.t@mail.com', telefono: '3378889900', dataNascita: '1997-09-25', nazionalita: 'Giappone', dataIscrizione: '2025-11-10', consensoPrivacy: true, isSocio: false, isVolontario: false },
  { id: 8, nome: 'Elena', cognome: 'Popescu', email: 'elena.p@mail.com', telefono: '3389990011', dataNascita: '1990-12-03', nazionalita: 'Romania', dataIscrizione: '2025-11-20', consensoPrivacy: false, isSocio: false, isVolontario: false },
  // Volontari
  { id: 101, nome: 'Marco', cognome: 'Rossi', email: 'marco.r@semi.org', telefono: '3401112233', dataNascita: '1978-05-14', nazionalita: 'Italia', dataIscrizione: '2024-01-10', consensoPrivacy: true, isSocio: true, isVolontario: true },
  { id: 102, nome: 'Giulia', cognome: 'Bianchi', email: 'giulia.b@semi.org', telefono: '3412223344', dataNascita: '1985-08-22', nazionalita: 'Italia', dataIscrizione: '2024-03-15', consensoPrivacy: true, isSocio: true, isVolontario: true },
  { id: 103, nome: 'Luca', cognome: 'Verdi', email: 'luca.v@semi.org', telefono: '3423334455', dataNascita: '1990-11-01', nazionalita: 'Italia', dataIscrizione: '2024-06-01', consensoPrivacy: true, isSocio: true, isVolontario: true },
  { id: 104, nome: 'Anna', cognome: 'Moretti', email: 'anna.m@semi.org', telefono: '3434445566', dataNascita: '1982-02-28', nazionalita: 'Italia', dataIscrizione: '2025-01-10', consensoPrivacy: true, isSocio: true, isVolontario: true },
];

export const lingueParlate: LinguaParlata[] = [
  { idUtente: 1, lingua: 'Somalo' }, { idUtente: 1, lingua: 'Arabo' },
  { idUtente: 2, lingua: 'Cinese' }, { idUtente: 2, lingua: 'Inglese' },
  { idUtente: 3, lingua: 'Arabo' }, { idUtente: 3, lingua: 'Francese' },
  { idUtente: 4, lingua: 'Ucraino' }, { idUtente: 4, lingua: 'Russo' },
  { idUtente: 5, lingua: 'Portoghese' }, { idUtente: 5, lingua: 'Spagnolo' },
  { idUtente: 6, lingua: 'Urdu' }, { idUtente: 6, lingua: 'Inglese' },
  { idUtente: 7, lingua: 'Giapponese' }, { idUtente: 7, lingua: 'Inglese' },
  { idUtente: 8, lingua: 'Rumeno' },
];

export const profiliStudenti: ProfiloStudente[] = [
  { id: 1, idUtente: 1, statoScuola: 'In attesa test' },
  { id: 2, idUtente: 2, statoScuola: 'In attesa test' },
  { id: 3, idUtente: 3, statoScuola: 'In attesa classe', dataUltimoTest: '2025-10-20', livelloRaggiunto: 'A1' },
  { id: 4, idUtente: 4, statoScuola: 'In attesa classe', dataUltimoTest: '2025-10-20', livelloRaggiunto: 'Pre-A1' },
  { id: 5, idUtente: 5, statoScuola: 'Assegnato', dataUltimoTest: '2025-09-15', livelloRaggiunto: 'A2', noteDidattiche: 'Ottimi progressi, motivata' },
  { id: 6, idUtente: 6, statoScuola: 'In attesa test' },
  { id: 7, idUtente: 7, statoScuola: 'Assegnato', dataUltimoTest: '2025-09-15', livelloRaggiunto: 'B1', noteDidattiche: 'Buona produzione orale' },
  { id: 8, idUtente: 8, statoScuola: 'In attesa test' },
];

export const profiliVolontari: ProfiloVolontario[] = [
  { id: 1, idUtente: 101, livelloPreferito: 'Alfa', noteMetodologiche: 'Specializzato in alfabetizzazione, usa molto materiale visivo.', dataScadenzaSocio: '2026-01-10' },
  { id: 2, idUtente: 102, livelloPreferito: 'A1', noteMetodologiche: 'Approccio comunicativo, focus sulla conversazione.', dataScadenzaSocio: '2026-03-15' },
  { id: 3, idUtente: 103, livelloPreferito: 'A2', noteMetodologiche: 'Attento alla grammatica e alla scrittura.', dataScadenzaSocio: '2026-06-01' },
  { id: 4, idUtente: 104, livelloPreferito: 'Pre-A1', noteMetodologiche: 'Grande pazienza, ottima con principianti assoluti.', dataScadenzaSocio: '2026-01-10' },
];

export const disponibilita: Disponibilita[] = [
  // Marco
  { id: 1, idUtente: 101, giorno: 'Lunedì', oraInizio: '09:00', oraFine: '11:00' },
  { id: 2, idUtente: 101, giorno: 'Mercoledì', oraInizio: '09:00', oraFine: '11:00' },
  // Giulia
  { id: 3, idUtente: 102, giorno: 'Martedì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 4, idUtente: 102, giorno: 'Giovedì', oraInizio: '14:00', oraFine: '16:00' },
  // Luca
  { id: 5, idUtente: 103, giorno: 'Lunedì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 6, idUtente: 103, giorno: 'Venerdì', oraInizio: '10:00', oraFine: '12:00' },
  // Anna
  { id: 7, idUtente: 104, giorno: 'Mercoledì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 8, idUtente: 104, giorno: 'Sabato', oraInizio: '09:00', oraFine: '11:00' },
  // Studenti
  { id: 9, idUtente: 1, giorno: 'Lunedì', oraInizio: '09:00', oraFine: '11:00' },
  { id: 10, idUtente: 1, giorno: 'Mercoledì', oraInizio: '09:00', oraFine: '11:00' },
  { id: 11, idUtente: 2, giorno: 'Martedì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 12, idUtente: 3, giorno: 'Lunedì', oraInizio: '09:00', oraFine: '11:00' },
  { id: 13, idUtente: 3, giorno: 'Martedì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 14, idUtente: 4, giorno: 'Mercoledì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 15, idUtente: 4, giorno: 'Sabato', oraInizio: '09:00', oraFine: '11:00' },
  { id: 16, idUtente: 5, giorno: 'Martedì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 17, idUtente: 6, giorno: 'Lunedì', oraInizio: '09:00', oraFine: '11:00' },
  { id: 18, idUtente: 7, giorno: 'Lunedì', oraInizio: '14:00', oraFine: '16:00' },
  { id: 19, idUtente: 7, giorno: 'Venerdì', oraInizio: '10:00', oraFine: '12:00' },
];

export const tavoli: Tavolo[] = [
  { id: 1, nomeTavolo: 'Aula 1 - Tavolo A', capacitaMax: 6 },
  { id: 2, nomeTavolo: 'Aula 1 - Tavolo B', capacitaMax: 8 },
  { id: 3, nomeTavolo: 'Aula 2 - Tavolo A', capacitaMax: 5 },
  { id: 4, nomeTavolo: 'Aula 2 - Tavolo B', capacitaMax: 6 },
  { id: 5, nomeTavolo: 'Sala Grande', capacitaMax: 12 },
];

export const classi: Classe[] = [
  { id: 1, nomeClasse: 'A2 Martedì Pomeriggio', idInsegnante: 102, idTavolo: 2, giorno: 'Martedì', oraInizio: '14:00', oraFine: '16:00', livelloTarget: 'A2' },
  { id: 2, nomeClasse: 'B1 Lunedì Pomeriggio', idInsegnante: 103, idTavolo: 1, giorno: 'Lunedì', oraInizio: '14:00', oraFine: '16:00', livelloTarget: 'B1' },
];

export const iscrizioniClassi: IscrizioneClasse[] = [
  { idClasse: 1, idStudente: 5 },
  { idClasse: 2, idStudente: 7 },
];

export const lezioni: Lezione[] = [
  { id: 1, idClasse: 1, dataLezione: '2026-04-01', idInsegnanteEffettivo: 102, argomentoTrattato: 'Il passato prossimo: verbi regolari', noteSegreteria: '' },
  { id: 2, idClasse: 2, dataLezione: '2026-04-01', idInsegnanteEffettivo: 103, argomentoTrattato: 'Lettura e comprensione: articolo di giornale' },
  { id: 3, idClasse: 1, dataLezione: '2026-04-08', idInsegnanteEffettivo: 102 },
  { id: 4, idClasse: 2, dataLezione: '2026-04-07', idInsegnanteEffettivo: 103 },
];

export const presenze: Presenza[] = [
  { idLezione: 1, idStudente: 5, stato: 'Presente' },
  { idLezione: 2, idStudente: 7, stato: 'Ritardo', minutiRitardo: 10 },
];

export const sessioniTest: SessioneTest[] = [
  {
    id: 1, data: '2025-10-20', studentiConvocati: [3, 4],
    risultati: [
      { idStudente: 3, livello: 'A1', note: 'Buona comprensione orale' },
      { idStudente: 4, livello: 'Pre-A1', note: 'Necessita supporto alfabetizzazione' },
    ],
    completata: true,
  },
  {
    id: 2, data: '2025-09-15', studentiConvocati: [5, 7],
    risultati: [
      { idStudente: 5, livello: 'A2' },
      { idStudente: 7, livello: 'B1' },
    ],
    completata: true,
  },
];
