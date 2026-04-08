import { useState } from 'react';
import { useStudenti, useUpdateStudente, useInsegnanti, useClassi, useAddClasse, useIscrizioni, useAddIscrizione, type Classe } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, ArrowLeft, Check, AlertTriangle, Loader2 } from 'lucide-react';

export default function ClassBuilder() {
  const { data: studenti = [], isLoading: loadingS } = useStudenti();
  const { data: insegnanti = [], isLoading: loadingI } = useInsegnanti();
  const { data: classi = [] } = useClassi();
  const { data: iscrizioni = [] } = useIscrizioni();
  const addClasse = useAddClasse();
  const addIscrizione = useAddIscrizione();
  const updateStudente = useUpdateStudente();

  const [step, setStep] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ giorno: string; oraInizio: string; oraFine: string } | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedAula, setSelectedAula] = useState('');
  const [className, setClassName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const teacher = insegnanti.find(i => i.id === selectedTeacher);
  const teacherSlots = teacher ? (teacher.disponibilita || []) as { giorno: string; oraInizio: string; oraFine: string }[] : [];

  // Check teacher conflict
  const teacherConflict = (() => {
    if (!selectedTeacher || !selectedSlot) return null;
    return classi.find(c =>
      c.insegnante_id === selectedTeacher &&
      c.giorno_settimana === selectedSlot.giorno &&
      c.orario_inizio === selectedSlot.oraInizio &&
      c.orario_fine === selectedSlot.oraFine
    ) || null;
  })();

  // Compatible students
  const compatibleStudents = (() => {
    if (!selectedSlot) return [];
    return studenti
      .filter(s => s.stato_scuola === 'In attesa classe')
      .filter(s => {
        const slots = (s.disponibilita || []) as { giorno: string; oraInizio: string; oraFine: string }[];
        return slots.some(sl => sl.giorno === selectedSlot.giorno && sl.oraInizio === selectedSlot.oraInizio);
      })
      .sort((a, b) => {
        const pref = teacher?.livello_preferito;
        const aMatch = pref && a.livello === pref ? 0 : 1;
        const bMatch = pref && b.livello === pref ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return (a.created_at || '').localeCompare(b.created_at || '');
      });
  })();

  const handleAiSuggest = () => {
    setAiLoading(true);
    setTimeout(() => {
      const pref = teacher?.livello_preferito;
      const suggested = compatibleStudents.filter(s => !pref || s.livello === pref).map(s => s.id);
      setSelectedStudents(suggested.length > 0 ? suggested : compatibleStudents.map(s => s.id));
      toast.success(`IA suggerisce ${suggested.length || compatibleStudents.length} studenti compatibili.`);
      setAiLoading(false);
    }, 1500);
  };

  const handleConfirm = async () => {
    if (!selectedTeacher || !selectedSlot || selectedStudents.length === 0) return;
    if (teacherConflict) {
      toast.error(`L'insegnante è già impegnato in "${teacherConflict.nome}" in questa fascia oraria.`);
      return;
    }
    try {
      const newClass = await addClasse.mutateAsync({
        nome: className || `${teacher?.livello_preferito || ''} ${selectedSlot.giorno}`,
        livello: teacher?.livello_preferito || null,
        giorno_settimana: selectedSlot.giorno,
        orario_inizio: selectedSlot.oraInizio,
        orario_fine: selectedSlot.oraFine,
        aula: selectedAula || null,
        insegnante_id: selectedTeacher,
      });
      for (const sid of selectedStudents) {
        await addIscrizione.mutateAsync({ studente_id: sid, classe_id: newClass.id, data_iscrizione: new Date().toISOString().split('T')[0], attiva: true });
        await updateStudente.mutateAsync({ id: sid, stato_scuola: 'Assegnato' });
      }
      toast.success(`Classe "${newClass.nome}" creata con ${selectedStudents.length} studenti`);
      setStep(0); setSelectedTeacher(null); setSelectedSlot(null); setSelectedStudents([]); setSelectedAula(''); setClassName('');
    } catch { toast.error('Errore durante la creazione della classe'); }
  };

  const steps = ['Insegnante', 'Smart Filter', 'Conferma'];

  if (loadingS || loadingI) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
          {insegnanti.map(v => (
            <Card key={v.id} className={`cursor-pointer transition-all ${selectedTeacher === v.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => { setSelectedTeacher(v.id); setSelectedSlot(null); }}>
              <CardHeader>
                <CardTitle>{v.nome} {v.cognome}</CardTitle>
                <CardDescription>
                  Livello preferito: <Badge variant="secondary">{v.livello_preferito || 'Nessuno'}</Badge>
                  <span className="text-xs ml-1">(preferenza, non vincolo)</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {v.note_metodologiche && <p className="text-sm text-muted-foreground mb-2">{v.note_metodologiche}</p>}
                <p className="text-xs text-muted-foreground">Scadenza socio: {v.data_scadenza_socio || '—'}</p>
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
              {teacherSlots.map((slot, i) => {
                const conflict = classi.find(c =>
                  c.insegnante_id === selectedTeacher &&
                  c.giorno_settimana === slot.giorno &&
                  c.orario_inizio === slot.oraInizio
                );
                return (
                  <Button key={i}
                    variant={selectedSlot?.giorno === slot.giorno && selectedSlot?.oraInizio === slot.oraInizio ? 'default' : 'outline'}
                    onClick={() => {
                      if (conflict) {
                        toast.error(`⚠ ${teacher?.nome} è già impegnato/a in "${conflict.nome}" — ${slot.giorno} ${slot.oraInizio}–${slot.oraFine}`);
                        return;
                      }
                      setSelectedSlot(slot);
                    }}
                    size="sm"
                    className={conflict ? 'opacity-50 line-through' : ''}
                  >
                    {slot.giorno} {slot.oraInizio}–{slot.oraFine}
                    {conflict && <AlertTriangle className="h-3 w-3 ml-1 text-destructive" />}
                  </Button>
                );
              })}
            </div>
            {teacherConflict && (
              <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Questa fascia oraria è già occupata dalla classe "{teacherConflict.nome}"
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
              </CardDescription>
            </div>
            <Button onClick={handleAiSuggest} disabled={aiLoading} className="gap-2 bg-[hsl(33,76%,51%)] hover:bg-[hsl(33,76%,45%)] text-primary-foreground">
              <Sparkles className="h-4 w-4" />{aiLoading ? 'Analisi...' : 'Suggerisci con IA'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome Classe</Label><Input value={className} onChange={e => setClassName(e.target.value)} placeholder={`es. ${teacher?.livello_preferito || ''} ${selectedSlot?.giorno || ''}`} /></div>
                <div><Label>Aula / Tavolo</Label><Input value={selectedAula} onChange={e => setSelectedAula(e.target.value)} placeholder="es. Aula 1 - Tavolo A" /></div>
              </div>
            </div>
            {compatibleStudents.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">Nessuno studente compatibile trovato</p>
            ) : (
              <div className="space-y-2">
                {compatibleStudents.map(s => {
                  const isPreferred = teacher?.livello_preferito && s.livello === teacher.livello_preferito;
                  return (
                    <div key={s.id} className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 ${isPreferred ? 'bg-accent/30' : ''}`}>
                      <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={v => setSelectedStudents(prev => v ? [...prev, s.id] : prev.filter(id => id !== s.id))} />
                      <div className="flex-1">
                        <span className="font-medium">{s.nome} {s.cognome}</span>
                        <span className="text-sm text-muted-foreground ml-2">— {s.nazionalita} — Livello: {s.livello || '—'}</span>
                        {isPreferred && <Badge variant="outline" className="ml-2 text-xs">Livello preferito</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Riepilogo Classe</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p><strong>Insegnante:</strong> {teacher?.nome} {teacher?.cognome}</p>
            <p><strong>Orario:</strong> {selectedSlot?.giorno} {selectedSlot?.oraInizio}–{selectedSlot?.oraFine}</p>
            <p><strong>Livello:</strong> {teacher?.livello_preferito || '—'}</p>
            {selectedAula && <p><strong>Aula:</strong> {selectedAula}</p>}
            <p><strong>Studenti ({selectedStudents.length}):</strong></p>
            <ul className="list-disc list-inside text-sm">
              {selectedStudents.map(id => { const s = studenti.find(st => st.id === id); return <li key={id}>{s?.nome} {s?.cognome}</li>; })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Indietro
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={
            (step === 0 && (!selectedTeacher || !selectedSlot || !!teacherConflict)) ||
            (step === 1 && selectedStudents.length === 0)
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
