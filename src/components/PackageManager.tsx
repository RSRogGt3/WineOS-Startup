import React, { useState } from 'react';
import { PackageItem } from '../types';
import { Package, Plus, Check, Search, Shield, Cpu, Gamepad2, Wrench } from 'lucide-react';

interface PackageManagerProps {
  packages: PackageItem[];
  setPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>;
}

export const PackageManager: React.FC<PackageManagerProps> = ({ packages, setPackages }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgCategory, setNewPkgCategory] = useState<PackageItem['category']>('utilities');

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

    setPackages(prev => [
      ...prev,
      {
        name,
        category: newPkgCategory,
        description: newPkgDesc.trim() || 'Custom user package',
        enabled: true,
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

  const filteredPackages = packages.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <div className="mt-4 flex items-center space-x-4 text-xs text-slate-400">
            <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
              {packages.filter(p => p.enabled).length} packages enabled
            </span>
            <span>Total available: {packages.length}</span>
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

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Package Grid */}
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
    </div>
  );
};
