import React, { useState, useMemo, useRef } from 'react';
import { PackageItem } from '../types';
import {
  Package,
  Plus,
  Check,
  Search,
  Shield,
  Cpu,
  Gamepad2,
  Wrench,
  X,
  SlidersHorizontal,
  PackageSearch,
  Filter,
} from 'lucide-react';

interface PackageManagerProps {
  packages: PackageItem[];
  setPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>;
}

export const PackageManager: React.FC<PackageManagerProps> = ({ packages, setPackages }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgCategory, setNewPkgCategory] = useState<PackageItem['category']>('utilities');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const togglePackage = (name: string) => {
    setPackages(prev =>
      prev.map(p => (p.name === name ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;
    const name = newPkgName.trim().toLowerCase();
    if (packages.some(p => p.name === name)) return;

    const defaultCategorySize: Record<PackageItem['category'], number> = {
      base: 80,
      gaming: 120,
      security: 30,
      xorg: 40,
      utilities: 25,
    };

    setPackages(prev => [
      ...prev,
      {
        name,
        category: newPkgCategory,
        description: newPkgDesc.trim() || 'Custom user package',
        enabled: true,
        sizeMB: defaultCategorySize[newPkgCategory] || 35,
      },
    ]);
    setNewPkgName('');
    setNewPkgDesc('');
  };

  const categories = [
    { id: 'all', label: 'All Packages', icon: Package },
    { id: 'base', label: 'Base System', icon: Cpu },
    { id: 'gaming', label: 'Wine & Gaming', icon: Gamepad2 },
    { id: 'security', label: 'Security & UFW', icon: Shield },
    { id: 'xorg', label: 'X11 / GUI', icon: Cpu },
    { id: 'utilities', label: 'Utilities', icon: Wrench },
  ];

  const quickFilterTags = ['wine', 'dxvk', 'vulkan', 'mesa', 'ufw', 'clamav', 'xorg', 'pipewire'];

  const filteredPackages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return packages.filter(p => {
      const matchesSearch =
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && p.enabled) ||
        (statusFilter === 'disabled' && !p.enabled);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [packages, searchTerm, selectedCategory, statusFilter]);

  const enabledCount = useMemo(() => packages.filter(p => p.enabled).length, [packages]);

  return (
    <div className="space-y-6">
      {/* Header & Add Package Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <span>packages.x86_64 Manifest</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select or add packages to be bundled into the Arch Wine OS ISO rootfs and installed via pacman.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
              {enabledCount} of {packages.length} packages enabled
            </span>
            {searchTerm && (
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                Filtering by: &quot;{searchTerm}&quot; ({filteredPackages.length} matches)
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Add Custom Package</h3>
          <form onSubmit={handleAddPackage} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Package name (e.g. steam, lutris)"
                value={newPkgName}
                onChange={e => setNewPkgName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={newPkgCategory}
                onChange={e => setNewPkgCategory(e.target.value as PackageItem['category'])}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="gaming">Gaming</option>
                <option value="security">Security</option>
                <option value="xorg">X11</option>
                <option value="utilities">Utilities</option>
                <option value="base">Base</option>
              </select>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Real-time Search and Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Arch packages by name, description, or category (e.g. wine, vulkan, ufw)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter Toggle */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 self-start md:self-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({packages.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('enabled')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'enabled'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enabled ({enabledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Disabled ({packages.length - enabledCount})
            </button>
          </div>
        </div>

        {/* Categories Bar & Quick Suggestion Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const catCount = cat.id === 'all'
                ? packages.length
                : packages.filter(p => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Tag Suggestions */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs text-slate-400">
            <span className="text-[11px] text-slate-500 shrink-0 font-medium">Quick filters:</span>
            {quickFilterTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchTerm(tag);
                  searchInputRef.current?.focus();
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  searchTerm.toLowerCase() === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <span className="text-white font-bold font-mono">{filteredPackages.length}</span> of{' '}
          <span className="text-white font-bold font-mono">{packages.length}</span> packages
          {searchTerm && <span> matching &quot;<span className="text-indigo-300 font-semibold">{searchTerm}</span>&quot;</span>}
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Package Grid or Empty State */}
      {filteredPackages.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No packages found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No Arch Linux packages match &quot;<span className="text-slate-200 font-semibold">{searchTerm}</span>&quot; in the selected category or status filter.
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear Search Query
              </button>
            )}
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Category Filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map(pkg => (
            <div
              key={pkg.name}
              onClick={() => togglePackage(pkg.name)}
              className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer flex items-start justify-between ${
                pkg.enabled
                  ? 'border-indigo-500/50 bg-indigo-950/10 shadow-lg shadow-indigo-500/5'
                  : 'border-slate-800 hover:border-slate-700 opacity-75'
              }`}
            >
              <div className="space-y-1 mr-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-white">{pkg.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold bg-slate-800 text-slate-400">
                    {pkg.category}
                  </span>
                  {pkg.sizeMB && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-900/50">
                      ~{pkg.sizeMB} MB
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{pkg.description}</p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                  pkg.enabled
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-slate-700 bg-slate-950 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

