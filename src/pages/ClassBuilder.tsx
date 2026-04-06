import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import type { Livello, Giorno, Classe } from '@/data/types';

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

  // Step 2: compatible students
  const compatibleStudents = (() => {
    if (!selectedSlot || !selectedVolontario) return [];
    const studentiAttesa = profiliStudenti.filter(p => p.statoScuola === 'In attesa classe');
    return studentiAttesa.filter(p => {
      const stuSlots = disponibilita.filter(d => d.idUtente === p.idUtente);
      const matchesSlot = stuSlots.some(s => s.giorno === selectedSlot.giorno && s.oraInizio === selectedSlot.oraInizio);
      const matchesLevel = !selectedVolontario.livelloPreferito || p.livelloRaggiunto === selectedVolontario.livelloPreferito;
      return matchesSlot && matchesLevel;
    }).sort((a, b) => {
      const uA = getUtente(a.idUtente);
      const uB = getUtente(b.idUtente);
      return (uA?.dataIscrizione || '').localeCompare(uB?.dataIscrizione || '');
    });
  })();

  const handleAiSuggest = () => {
    setAiLoading(true);
    setTimeout(() => {
      setSelectedStudents(compatibleStudents.map(s => s.idUtente));
      setAiLoading(false);
      toast.success('IA suggerisce di includere tutti gli studenti compatibili, ordinati per priorità di iscrizione.');
    }, 1500);
  };

  const handleConfirm = () => {
    if (!selectedTeacher || !selectedSlot || !selectedTavolo || selectedStudents.length === 0) return;
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
    // Reset
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
                <CardDescription>Livello preferito: {v.livelloPreferito || 'Nessuno'}</CardDescription>
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
              {teacherSlots.map(slot => (
                <Button key={slot.id} variant={selectedSlot?.giorno === slot.giorno && selectedSlot?.oraInizio === slot.oraInizio ? 'default' : 'outline'}
                  onClick={() => setSelectedSlot({ giorno: slot.giorno, oraInizio: slot.oraInizio, oraFine: slot.oraFine })} size="sm">
                  {slot.giorno} {slot.oraInizio}–{slot.oraFine}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Smart Filter */}
      {step === 1 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Studenti Compatibili</CardTitle>
              <CardDescription>{compatibleStudents.length} studenti trovati per {selectedSlot?.giorno} {selectedSlot?.oraInizio}–{selectedSlot?.oraFine}, livello {selectedVolontario?.livelloPreferito}</CardDescription>
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
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox checked={selectedStudents.includes(p.idUtente)} onCheckedChange={v => setSelectedStudents(prev => v ? [...prev, p.idUtente] : prev.filter(id => id !== p.idUtente))} />
                      <div className="flex-1">
                        <span className="font-medium">{u?.nome} {u?.cognome}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {u?.nazionalita} — Livello: {p.livelloRaggiunto}</span>
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
              <Select value={selectedTavolo?.toString() || ''} onValueChange={v => setSelectedTavolo(parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Seleziona tavolo..." /></SelectTrigger>
                <SelectContent>
                  {tavoli.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.nomeTavolo} (max {t.capacitaMax})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTavolo && selectedStudents.length > (tavoli.find(t => t.id === selectedTavolo)?.capacitaMax || 0) && (
              <p className="text-sm text-destructive">⚠ Il numero di studenti ({selectedStudents.length}) supera la capacità del tavolo!</p>
            )}
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
            (step === 0 && (!selectedTeacher || !selectedSlot)) ||
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
