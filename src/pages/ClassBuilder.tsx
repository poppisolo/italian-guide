import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import type { Livello, Giorno, Classe } from '@/data/types';

const SAFETY_MARGIN = 2;

export default function ClassBuilder() {
  const { utenti, profiliStudenti, setProfiliStudenti, profiliVolontari, disponibilita, tavoli, classi, setClassi, iscrizioniClassi, setIscrizioniClassi } = useStore();

  const [step, setStep] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ giorno: Giorno; oraInizio: string; oraFine: string } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTavolo, setSelectedTavolo] = useState<number | null>(null);
  const [className, setClassName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const teacherVolontari = profiliVolontari.map(v => ({ ...v, utente: getUtente(v.idUtente)! }));
  const selectedVolontario = profiliVolontari.find(v => v.idUtente === selectedTeacher);
  const teacherSlots = selectedTeacher ? disponibilita.filter(d => d.idUtente === selectedTeacher) : [];

  // Check if teacher already has a class in the same slot
  const teacherConflict = (() => {
    if (!selectedTeacher || !selectedSlot) return null;
    const conflict = classi.find(c =>
      c.idInsegnante === selectedTeacher &&
      c.giorno === selectedSlot.giorno &&
      c.oraInizio === selectedSlot.oraInizio &&
      c.oraFine === selectedSlot.oraFine
    );
    return conflict || null;
  })();

  // Table availability analysis for the selected slot
  const getTableStatus = (tavoloId: number) => {
    if (!selectedSlot) return { usedSeats: 0, available: true, sharedWith: null as Classe | null };
    const classesOnTable = classi.filter(c =>
      c.idTavolo === tavoloId &&
      c.giorno === selectedSlot.giorno &&
      c.oraInizio === selectedSlot.oraInizio
    );
    const usedSeats = classesOnTable.reduce((sum, c) =>
      sum + iscrizioniClassi.filter(ic => ic.idClasse === c.id).length, 0);
    return {
      usedSeats,
      available: classesOnTable.length === 0,
      sharedWith: classesOnTable[0] || null,
    };
  };

  // Check if all tables are occupied in this slot
  const allTablesOccupied = selectedSlot ? tavoli.every(t => {
    const status = getTableStatus(t.id);
    return !status.available;
  }) : false;

  // Step 1: compatible students — level is preference, not constraint
  const compatibleStudents = (() => {
    if (!selectedSlot) return [];
    const studentiAttesa = profiliStudenti.filter(p => p.statoScuola === 'In attesa classe');
    return studentiAttesa.filter(p => {
      const stuSlots = disponibilita.filter(d => d.idUtente === p.idUtente);
      return stuSlots.some(s => s.giorno === selectedSlot.giorno && s.oraInizio === selectedSlot.oraInizio);
    }).sort((a, b) => {
      // Preferred level students first, then by enrollment date
      const prefLevel = selectedVolontario?.livelloPreferito;
      const aMatch = prefLevel && a.livelloRaggiunto === prefLevel ? 0 : 1;
      const bMatch = prefLevel && b.livelloRaggiunto === prefLevel ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const uA = getUtente(a.idUtente);
      const uB = getUtente(b.idUtente);
      return (uA?.dataIscrizione || '').localeCompare(uB?.dataIscrizione || '');
    });
  })();

  const handleAiSuggest = () => {
    setAiLoading(true);
    setTimeout(() => {
      // AI suggests: prefer matching level, then pick best table
      const prefLevel = selectedVolontario?.livelloPreferito;
      const suggested = compatibleStudents.filter(s =>
        !prefLevel || s.livelloRaggiunto === prefLevel
      ).map(s => s.idUtente);
      setSelectedStudents(suggested.length > 0 ? suggested : compatibleStudents.map(s => s.idUtente));

      // AI also suggests best table
      const freeTables = tavoli.filter(t => getTableStatus(t.id).available);
      if (freeTables.length > 0) {
        const best = freeTables.sort((a, b) => {
          const needed = suggested.length || compatibleStudents.length;
          return Math.abs(a.capacitaMax - needed) - Math.abs(b.capacitaMax - needed);
        })[0];
        setSelectedTavolo(best.id);
        toast.success(`IA suggerisce ${suggested.length || compatibleStudents.length} studenti e il tavolo "${best.nomeTavolo}" (capienza ottimale).`);
      } else if (allTablesOccupied) {
        // Find table with most remaining capacity
        const bestShared = tavoli.sort((a, b) => {
          const statusA = getTableStatus(a.id);
          const statusB = getTableStatus(b.id);
          return (b.capacitaMax - statusB.usedSeats) - (a.capacitaMax - statusA.usedSeats);
        })[0];
        const status = getTableStatus(bestShared.id);
        const remaining = bestShared.capacitaMax - status.usedSeats - SAFETY_MARGIN;
        if (remaining > 0) {
          setSelectedTavolo(bestShared.id);
          toast.info(`IA: tutti i tavoli sono occupati. Suggerito "${bestShared.nomeTavolo}" in condivisione (${remaining} posti disponibili con margine di sicurezza).`);
        } else {
          toast.error('IA: nessun tavolo disponibile con capienza sufficiente in questa fascia oraria.');
        }
      } else {
        toast.success(`IA suggerisce ${suggested.length || compatibleStudents.length} studenti compatibili.`);
      }

      setAiLoading(false);
    }, 1500);
  };

  const handleConfirm = () => {
    if (!selectedTeacher || !selectedSlot || !selectedTavolo || selectedStudents.length === 0) return;

    // Final validation: teacher conflict
    if (teacherConflict) {
      toast.error(`L'insegnante è già impegnato in "${teacherConflict.nomeClasse}" in questa fascia oraria.`);
      return;
    }

    // Table capacity validation
    const tableStatus = getTableStatus(selectedTavolo);
    const tavolo = tavoli.find(t => t.id === selectedTavolo)!;
    const totalStudents = tableStatus.usedSeats + selectedStudents.length;

    if (!tableStatus.available && !allTablesOccupied) {
      toast.error('Questo tavolo è già occupato e ci sono altri tavoli liberi. Seleziona un tavolo libero.');
      return;
    }

    if (!tableStatus.available && totalStudents > tavolo.capacitaMax - SAFETY_MARGIN) {
      toast.error(`Capienza insufficiente: ${totalStudents} studenti totali superano il limite di ${tavolo.capacitaMax - SAFETY_MARGIN} (con margine di sicurezza).`);
      return;
    }

    const newClass: Classe = {
      id: Math.max(...classi.map(c => c.id), 0) + 1,
      nomeClasse: className || `${selectedVolontario?.livelloPreferito || ''} ${selectedSlot.giorno}`,
      idInsegnante: selectedTeacher,
      idTavolo: selectedTavolo,
      giorno: selectedSlot.giorno,
      oraInizio: selectedSlot.oraInizio,
      oraFine: selectedSlot.oraFine,
      livelloTarget: selectedVolontario?.livelloPreferito || 'A1',
    };
    setClassi(prev => [...prev, newClass]);
    selectedStudents.forEach(idStu => {
      setIscrizioniClassi(prev => [...prev, { idClasse: newClass.id, idStudente: idStu }]);
    });
    setProfiliStudenti(prev => prev.map(p => selectedStudents.includes(p.idUtente) ? { ...p, statoScuola: 'Assegnato' as const } : p));
    toast.success(`Classe "${newClass.nomeClasse}" creata con ${selectedStudents.length} studenti`);
    setStep(0); setSelectedTeacher(null); setSelectedSlot(null); setSelectedStudents([]); setSelectedTavolo(null); setClassName('');
  };

  const steps = ['Insegnante', 'Smart Filter', 'Tavolo', 'Conferma'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Class Builder</h1>
        <p className="text-muted-foreground">Crea classi intelligenti in pochi passaggi</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${i <= step ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select Teacher */}
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {teacherVolontari.map(v => (
            <Card key={v.id} className={`cursor-pointer transition-all ${selectedTeacher === v.idUtente ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => { setSelectedTeacher(v.idUtente); setSelectedSlot(null); }}>
              <CardHeader>
                <CardTitle>{v.utente.nome} {v.utente.cognome}</CardTitle>
                <CardDescription>
                  Livello preferito: <Badge variant="secondary">{v.livelloPreferito || 'Nessuno'}</Badge>
                  <span className="text-xs ml-1">(preferenza, non vincolo)</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{v.noteMetodologiche}</p>
                <p className="text-xs text-muted-foreground">Scadenza socio: {v.dataScadenzaSocio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === 0 && selectedTeacher && (
        <Card>
          <CardHeader><CardTitle className="text-base">Disponibilità</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teacherSlots.map(slot => {
                const conflict = classi.find(c =>
                  c.idInsegnante === selectedTeacher &&
                  c.giorno === slot.giorno &&
                  c.oraInizio === slot.oraInizio
                );
                return (
                  <div key={slot.id} className="relative">
                    <Button
                      variant={selectedSlot?.giorno === slot.giorno && selectedSlot?.oraInizio === slot.oraInizio ? 'default' : conflict ? 'outline' : 'outline'}
                      onClick={() => {
                        if (conflict) {
                          toast.error(`⚠ ${getUtente(selectedTeacher)?.nome} è già impegnato/a in "${conflict.nomeClasse}" — ${slot.giorno} ${slot.oraInizio}–${slot.oraFine}`);
                          return;
                        }
                        setSelectedSlot({ giorno: slot.giorno, oraInizio: slot.oraInizio, oraFine: slot.oraFine });
                      }}
                      size="sm"
                      className={conflict ? 'opacity-50 line-through' : ''}
                    >
                      {slot.giorno} {slot.oraInizio}–{slot.oraFine}
                      {conflict && <AlertTriangle className="h-3 w-3 ml-1 text-destructive" />}
                    </Button>
                  </div>
                );
              })}
            </div>
            {teacherConflict && (
              <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Questa fascia oraria è già occupata dalla classe "{teacherConflict.nomeClasse}"
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Smart Filter */}
      {step === 1 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Studenti Compatibili</CardTitle>
              <CardDescription>
                {compatibleStudents.length} studenti trovati per {selectedSlot?.giorno} {selectedSlot?.oraInizio}–{selectedSlot?.oraFine}
                {selectedVolontario?.livelloPreferito && (
                  <span className="ml-1">(preferenza livello: {selectedVolontario.livelloPreferito})</span>
                )}
              </CardDescription>
            </div>
            <Button onClick={handleAiSuggest} disabled={aiLoading} className="gap-2 bg-[hsl(33,76%,51%)] hover:bg-[hsl(33,76%,45%)] text-primary-foreground">
              <Sparkles className="h-4 w-4" />{aiLoading ? 'Analisi...' : 'Suggerisci con IA'}
            </Button>
          </CardHeader>
          <CardContent>
            {compatibleStudents.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">Nessuno studente compatibile trovato</p>
            ) : (
              <div className="space-y-2">
                {compatibleStudents.map(p => {
                  const u = getUtente(p.idUtente);
                  const isPreferred = selectedVolontario?.livelloPreferito && p.livelloRaggiunto === selectedVolontario.livelloPreferito;
                  return (
                    <div key={p.id} className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 ${isPreferred ? 'bg-accent/30' : ''}`}>
                      <Checkbox checked={selectedStudents.includes(p.idUtente)} onCheckedChange={v => setSelectedStudents(prev => v ? [...prev, p.idUtente] : prev.filter(id => id !== p.idUtente))} />
                      <div className="flex-1">
                        <span className="font-medium">{u?.nome} {u?.cognome}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {u?.nazionalita} — Livello: {p.livelloRaggiunto}</span>
                        {isPreferred && <Badge variant="outline" className="ml-2 text-xs">Livello preferito</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">Iscritto: {u?.dataIscrizione}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Assign Table */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Assegna Tavolo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome Classe</Label>
              <Input value={className} onChange={e => setClassName(e.target.value)} placeholder={`es. ${selectedVolontario?.livelloPreferito || ''} ${selectedSlot?.giorno || ''}`} />
            </div>
            <div>
              <Label>Tavolo / Aula</Label>
              <div className="grid gap-2 mt-2">
                {tavoli.map(t => {
                  const status = getTableStatus(t.id);
                  const remaining = t.capacitaMax - status.usedSeats;
                  const canShare = !status.available && allTablesOccupied && (remaining - SAFETY_MARGIN) >= selectedStudents.length;
                  const canUse = status.available || canShare;

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTavolo === t.id ? 'ring-2 ring-primary bg-accent/20' :
                        !canUse ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => canUse && setSelectedTavolo(t.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.nomeTavolo}</span>
                        <div className="flex items-center gap-2">
                          {status.available ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">Libero</Badge>
                          ) : canShare ? (
                            <Badge variant="outline" className="text-[hsl(33,76%,51%)]">Condivisibile</Badge>
                          ) : (
                            <Badge variant="destructive">Occupato</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {status.usedSeats}/{t.capacitaMax} posti
                          </span>
                        </div>
                      </div>
                      {status.sharedWith && (
                        <p className="text-xs text-muted-foreground mt-1">
                          In uso da: {status.sharedWith.nomeClasse} ({getUtente(status.sharedWith.idInsegnante)?.nome})
                        </p>
                      )}
                      {canShare && (
                        <p className="text-xs text-[hsl(33,76%,51%)] mt-1">
                          ⚠ Condivisione: {remaining - SAFETY_MARGIN} posti disponibili (margine sicurezza: {SAFETY_MARGIN})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedTavolo && (() => {
              const status = getTableStatus(selectedTavolo);
              const tavolo = tavoli.find(t => t.id === selectedTavolo)!;
              const total = status.usedSeats + selectedStudents.length;
              if (!status.available && total > tavolo.capacitaMax - SAFETY_MARGIN) {
                return <p className="text-sm text-destructive">⚠ Il numero totale di studenti ({total}) supera la capienza sicura del tavolo ({tavolo.capacitaMax - SAFETY_MARGIN})!</p>;
              }
              return null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Riepilogo Classe</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p><strong>Insegnante:</strong> {getUtente(selectedTeacher!)?.nome} {getUtente(selectedTeacher!)?.cognome}</p>
            <p><strong>Orario:</strong> {selectedSlot?.giorno} {selectedSlot?.oraInizio}–{selectedSlot?.oraFine}</p>
            <p><strong>Livello:</strong> {selectedVolontario?.livelloPreferito}</p>
            <p><strong>Tavolo:</strong> {tavoli.find(t => t.id === selectedTavolo)?.nomeTavolo}</p>
            {(() => {
              const status = getTableStatus(selectedTavolo!);
              if (!status.available) {
                return (
                  <p className="text-sm text-[hsl(33,76%,51%)] flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Tavolo condiviso con "{status.sharedWith?.nomeClasse}"
                  </p>
                );
              }
              return null;
            })()}
            <p><strong>Studenti ({selectedStudents.length}):</strong></p>
            <ul className="list-disc list-inside text-sm">
              {selectedStudents.map(id => { const u = getUtente(id); return <li key={id}>{u?.nome} {u?.cognome}</li>; })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Indietro
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={
            (step === 0 && (!selectedTeacher || !selectedSlot || !!teacherConflict)) ||
            (step === 1 && selectedStudents.length === 0) ||
            (step === 2 && !selectedTavolo)
          } className="gap-2">
            Avanti<ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConfirm} className="gap-2 bg-primary"><Check className="h-4 w-4" />Crea Classe</Button>
        )}
      </div>
    </div>
  );
}
