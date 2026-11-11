import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  MapPin, 
  Layers, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle,
  X,
  Volume2,
  Tv,
  Building,
  Armchair,
  Video
} from 'lucide-react';
import { CampusResource, ResourceCategory, UserProfile } from '../types';
import { createResource } from '../services/api';

interface ResourceManagementViewProps {
  resources: CampusResource[];
  currentUser: UserProfile;
  onResourceCreated: (res: CampusResource) => void;
}

export const ResourceManagementView: React.FC<ResourceManagementViewProps> = ({
  resources,
  currentUser,
  onResourceCreated
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Resource Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('Visual & Display');
  const [newType, setNewType] = useState<'venue' | 'equipment'>('equipment');
  const [newTotalQuantity, setNewTotalQuantity] = useState(4);
  const [newLocation, setNewLocation] = useState('Central Campus Warehouse');
  const [newCapacity, setNewCapacity] = useState(100);
  const [newCondition, setNewCondition] = useState<'Optimal' | 'Good' | 'Maintenance Required'>('Optimal');
  const [newDescription, setNewDescription] = useState('');
  const [newFeatures, setNewFeatures] = useState('High Resolution, Energy Efficient');

  const categories: { label: string; value: string; icon: any }[] = [
    { label: 'All Resources', value: 'all', icon: Layers },
    { label: 'Visual & Display', value: 'Visual & Display', icon: Tv },
    { label: 'Audio & Speech', value: 'Audio & Speech', icon: Volume2 },
    { label: 'Venues & Halls', value: 'Venues & Halls', icon: Building },
    { label: 'Furniture & Seating', value: 'Furniture & Seating', icon: Armchair },
    { label: 'Cameras & Recording', value: 'Cameras & Recording', icon: Video },
  ];

  const filteredResources = resources.filter(res => {
    const matchesCategory = selectedCategory === 'all' || res.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const created = await createResource({
        name: newName,
        category: newCategory,
        type: newType,
        totalQuantity: newTotalQuantity,
        availableQuantity: newTotalQuantity,
        inUseQuantity: 0,
        maintenanceQuantity: 0,
        location: newLocation,
        capacity: newType === 'venue' ? newCapacity : undefined,
        condition: newCondition,
        description: newDescription || `${newName} deployed for university events.`,
        features: newFeatures.split(',').map(s => s.trim()).filter(Boolean)
      });
      onResourceCreated(created);
      setShowAddModal(false);
      // Reset
      setNewName('');
      setNewDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Campus Resource Inventory</h1>
          <p className="text-xs text-slate-500">Live availability status for audiovisual engineering and campus venues</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment or hall..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          {currentUser.role !== 'student' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills (Functional button segment controls) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(res => {
          const isVenue = res.type === 'venue';
          return (
            <div 
              key={res.id}
              className="p-5 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-mono text-[11px] text-slate-400">{res.id}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                    res.condition === 'Optimal' ? 'bg-emerald-50 text-emerald-700' :
                    res.condition === 'Good' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {res.condition}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                  {res.name}
                </h3>
                
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {res.description}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{res.location}</span>
                  {isVenue && res.capacity && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{res.capacity} Seats</span>
                    </>
                  )}
                </div>
              </div>

              {/* Inventory Quantities & Health breakdown */}
              <div className="pt-3 border-t border-slate-200/60">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50/70">
                    <span className="text-[10px] text-slate-400 block">Available</span>
                    <span className="font-semibold text-emerald-600 font-mono tabular-nums">
                      {res.availableQuantity}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50/70">
                    <span className="text-[10px] text-slate-400 block">In-Use</span>
                    <span className="font-semibold text-blue-600 font-mono tabular-nums">
                      {res.inUseQuantity}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50/70">
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <span className="font-semibold text-slate-800 font-mono tabular-nums">
                      {res.totalQuantity}
                    </span>
                  </div>
                </div>

                {/* Features tags */}
                {res.features && res.features.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] text-slate-500">
                    {res.features.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full liquid-glass rounded-2xl p-6 shadow-2xl border border-white/80 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-900">Add Campus Resource</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resource Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Wireless Presentation Clickers"
                  className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200"
                  >
                    <option value="Visual & Display">Visual & Display</option>
                    <option value="Audio & Speech">Audio & Speech</option>
                    <option value="Venues & Halls">Venues & Halls</option>
                    <option value="Furniture & Seating">Furniture & Seating</option>
                    <option value="Cameras & Recording">Cameras & Recording</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Resource Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200"
                  >
                    <option value="equipment">Equipment Item</option>
                    <option value="venue">Campus Venue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {newType === 'venue' ? 'Seating Capacity' : 'Total Inventory Quantity'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newType === 'venue' ? newCapacity : newTotalQuantity}
                    onChange={e => newType === 'venue' ? setNewCapacity(Number(e.target.value)) : setNewTotalQuantity(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Condition</label>
                  <select
                    value={newCondition}
                    onChange={e => setNewCondition(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200"
                  >
                    <option value="Optimal">Optimal</option>
                    <option value="Good">Good</option>
                    <option value="Maintenance Required">Maintenance Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Storage Location / Building</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Key capabilities or notes..."
                  className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-xs cursor-pointer"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
