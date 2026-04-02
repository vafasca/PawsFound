'use client';

import { useAppStore } from '@/store/app-store';

type FilterKey = 'type' | 'species' | 'status';

interface FilterOption {
  value: string;
  label: string;
}

const filterGroups: { key: FilterKey; label: string; options: FilterOption[] }[] = [
  {
    key: 'type',
    label: 'Tipo',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'lost', label: 'Perdidos' },
      { value: 'sighted', label: 'Avistados' },
    ],
  },
  {
    key: 'species',
    label: 'Especie',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'dog', label: 'Perros' },
      { value: 'cat', label: 'Gatos' },
    ],
  },
  {
    key: 'status',
    label: 'Estado',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'active', label: 'Activos' },
      { value: 'found', label: 'Encontrados' },
    ],
  },
];

export default function FilterBar() {
  const filters = useAppStore((s) => s.filters);
  const setFilter = useAppStore((s) => s.setFilter);

  return (
    <div className="space-y-2">
      {filterGroups.map((group) => (
        <div key={group.key} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {group.options.map((option) => {
            const isSelected = filters[group.key as keyof typeof filters] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setFilter(group.key, option.value)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-br from-paw-primary to-paw-primary-container text-white shadow-ambient'
                    : 'bg-paw-surface-high text-paw-on-surface-variant hover:bg-paw-surface-highest'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
