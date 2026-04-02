'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PawPrint, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function AddPetModal() {
  const showAddPet = useAppStore((s) => s.showAddPet);
  const setShowAddPet = useAppStore((s) => s.setShowAddPet);
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    color: '',
    uniqueMarks: '',
    photoUrl: '',
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowAddPet(false);
      setForm({ name: '', species: 'dog', breed: '', color: '', uniqueMarks: '', photoUrl: '' });
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!user?.id) {
      toast.error('Inicia sesión primero');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          breed: form.breed || undefined,
          color: form.color || undefined,
          uniqueMarks: form.uniqueMarks || undefined,
          photoUrl: form.photoUrl || undefined,
          ownerId: user.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar mascota');
      }

      toast.success('¡Mascota registrada! 🐾');
      handleClose(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={showAddPet} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogTitle className="sr-only">Registrar mascota</DialogTitle>
        <DialogDescription className="sr-only">Formulario para registrar una nueva mascota</DialogDescription>

        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-paw-primary/10 rounded-xl flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-paw-primary" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-paw-on-surface">
                Registrar Mascota
              </h2>
              <p className="text-xs text-paw-on-surface-variant">Agrega un nuevo miembro</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 mt-2">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-paw-on-surface mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre de tu mascota"
              className="w-full px-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:ring-2 focus:ring-paw-primary/20"
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-xs font-medium text-paw-on-surface mb-1">
              Especie
            </label>
            <select
              value={form.species}
              onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface focus:outline-none focus:ring-2 focus:ring-paw-primary/20 appearance-none"
            >
              <option value="dog">Perro</option>
              <option value="cat">Gato</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-xs font-medium text-paw-on-surface mb-1">
              Raza
            </label>
            <input
              type="text"
              value={form.breed}
              onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
              placeholder="Ej: Golden Retriever"
              className="w-full px-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:ring-2 focus:ring-paw-primary/20"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-paw-on-surface mb-1">
              Color
            </label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="Ej: Marrón con blanco"
              className="w-full px-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:ring-2 focus:ring-paw-primary/20"
            />
          </div>

          {/* Unique marks */}
          <div>
            <label className="block text-xs font-medium text-paw-on-surface mb-1">
              Señas particulares
            </label>
            <textarea
              value={form.uniqueMarks}
              onChange={(e) => setForm((f) => ({ ...f, uniqueMarks: e.target.value }))}
              placeholder="Cicatrices, collares, manchas..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:ring-2 focus:ring-paw-primary/20 resize-none"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-medium text-paw-on-surface mb-1">
              URL de foto (opcional)
            </label>
            <input
              type="text"
              value={form.photoUrl}
              onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:ring-2 focus:ring-paw-primary/20"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
            className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-paw-primary to-paw-primary-container hover:from-paw-on-primary-container hover:to-paw-primary transition-all shadow-md shadow-paw-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Mascota'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
