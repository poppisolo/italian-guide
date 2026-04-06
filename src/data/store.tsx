import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Utente, ProfiloStudente, ProfiloVolontario, Disponibilita, Classe, IscrizioneClasse, Lezione, Presenza, SessioneTest, LinguaParlata, Tavolo } from './types';
import * as mock from './mockData';

interface StoreContextType {
  utenti: Utente[];
  setUtenti: React.Dispatch<React.SetStateAction<Utente[]>>;
  profiliStudenti: ProfiloStudente[];
  setProfiliStudenti: React.Dispatch<React.SetStateAction<ProfiloStudente[]>>;
  profiliVolontari: ProfiloVolontario[];
  setProfiliVolontari: React.Dispatch<React.SetStateAction<ProfiloVolontario[]>>;
  disponibilita: Disponibilita[];
  setDisponibilita: React.Dispatch<React.SetStateAction<Disponibilita[]>>;
  lingueParlate: LinguaParlata[];
  setLingueParlate: React.Dispatch<React.SetStateAction<LinguaParlata[]>>;
  tavoli: Tavolo[];
  classi: Classe[];
  setClassi: React.Dispatch<React.SetStateAction<Classe[]>>;
  iscrizioniClassi: IscrizioneClasse[];
  setIscrizioniClassi: React.Dispatch<React.SetStateAction<IscrizioneClasse[]>>;
  lezioni: Lezione[];
  setLezioni: React.Dispatch<React.SetStateAction<Lezione[]>>;
  presenze: Presenza[];
  setPresenze: React.Dispatch<React.SetStateAction<Presenza[]>>;
  sessioniTest: SessioneTest[];
  setSessioniTest: React.Dispatch<React.SetStateAction<SessioneTest[]>>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [utenti, setUtenti] = useState<Utente[]>(mock.utenti);
  const [profiliStudenti, setProfiliStudenti] = useState<ProfiloStudente[]>(mock.profiliStudenti);
  const [profiliVolontari, setProfiliVolontari] = useState<ProfiloVolontario[]>(mock.profiliVolontari);
  const [disponibilita, setDisponibilita] = useState<Disponibilita[]>(mock.disponibilita);
  const [lingueParlate, setLingueParlate] = useState<LinguaParlata[]>(mock.lingueParlate);
  const [classi, setClassi] = useState<Classe[]>(mock.classi);
  const [iscrizioniClassi, setIscrizioniClassi] = useState<IscrizioneClasse[]>(mock.iscrizioniClassi);
  const [lezioni, setLezioni] = useState<Lezione[]>(mock.lezioni);
  const [presenze, setPresenze] = useState<Presenza[]>(mock.presenze);
  const [sessioniTest, setSessioniTest] = useState<SessioneTest[]>(mock.sessioniTest);

  return (
    <StoreContext.Provider value={{
      utenti, setUtenti,
      profiliStudenti, setProfiliStudenti,
      profiliVolontari, setProfiliVolontari,
      disponibilita, setDisponibilita,
      lingueParlate, setLingueParlate,
      tavoli: mock.tavoli,
      classi, setClassi,
      iscrizioniClassi, setIscrizioniClassi,
      lezioni, setLezioni,
      presenze, setPresenze,
      sessioniTest, setSessioniTest,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
