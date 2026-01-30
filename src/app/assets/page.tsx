'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetForm } from '@/components/forms/AssetForm';
import { SourceForm } from '@/components/forms/SourceForm';
import { AssetCategoryForm } from '@/components/forms/AssetCategoryForm';
import { useAssets, useAssetCategories, useAssetSources } from '@/hooks/useAssets';
import { Asset, AssetCategory, CreateAsset, CreateAssetCategory, CreateAssetSource, UpdateAsset } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, Building, FolderTree, Settings, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AssetsPage() {
  const { assets, loading, createAsset, updateAsset, deleteAsset, refetch } = useAssets();
  const { categories, createCategory, updateCategory, deleteCategory, refetch: refetchCategories } = useAssetCategories();
  const { sources, createSource, deleteSource, refetch: refetchSources } = useAssetSources();

  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [mainTab, setMainTab] = useState('assets');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const formatCurrency = (value: number, currency: string = 'SGD') => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'investment': return 'bg-green-500';
      case 'cash': return 'bg-blue-500';
      case 'property': return 'bg-orange-500';
      case 'liability': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'investment': return 'default';
      case 'cash': return 'secondary';
      case 'property': return 'outline';
      case 'liability': return 'destructive';
      default: return 'outline';
    }
  };

  const handleCreateAsset = async (data: CreateAsset | UpdateAsset) => {
    await createAsset(data as CreateAsset);
    refetch();
  };

  const handleUpdateAsset = async (data: CreateAsset | UpdateAsset) => {
    if (editingAsset) {
      await updateAsset(editingAsset.id, data);
      setEditingAsset(null);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Delete this asset?')) {
      try {
        await deleteAsset(id);
        toast.success('Asset deleted');
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const handleCreateSource = async (data: CreateAssetSource) => {
    await createSource(data);
    refetchSources();
  };

  const handleDeleteSource = async (id: string) => {
    if (confirm('Delete this source? Assets using it will also be deleted.')) {
      try {
        await deleteSource(id);
        toast.success('Source deleted');
        refetch();
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const handleCreateCategory = async (data: CreateAssetCategory) => {
    await createCategory(data);
    refetchCategories();
  };

  const handleUpdateCategory = async (data: CreateAssetCategory) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category? All related sources and assets will be deleted.')) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted');
        refetchSources();
        refetch();
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  // Filter assets
  const filteredAssets = selectedTab === 'all'
    ? assets
    : assets.filter((asset) => asset.category?.type === selectedTab);

  // Group by category
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    const categoryName = asset.category?.name || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const totalValue = filteredAssets.reduce((sum, asset) => {
    const value = asset.category?.type === 'liability' ? -Number(asset.current_value) : Number(asset.current_value);
    return sum + value;
  }, 0);

  return (
    <div>
      <Header title="Assets" description="Manage your assets and liabilities" />

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">My Assets</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Manage</span>
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-4">
          {/* Filter Tabs */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="overflow-x-auto">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="h-auto">
                  <TabsTrigger value="all" className="text-xs px-2 py-1.5">All</TabsTrigger>
                  <TabsTrigger value="investment" className="text-xs px-2 py-1.5">Invest</TabsTrigger>
                  <TabsTrigger value="cash" className="text-xs px-2 py-1.5">Cash</TabsTrigger>
                  <TabsTrigger value="property" className="text-xs px-2 py-1.5">Property</TabsTrigger>
                  <TabsTrigger value="liability" className="text-xs px-2 py-1.5">Liability</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button size="sm" onClick={() => { setEditingAsset(null); setAssetFormOpen(true); }}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Summary */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(Math.abs(totalValue))}</p>
                </div>
                <p className="text-sm text-muted-foreground">{filteredAssets.length} assets</p>
              </div>
            </CardContent>
          </Card>

          {/* Assets List */}
          {loading ? (
            <Card><CardContent className="flex h-40 items-center justify-center">Loading...</CardContent></Card>
          ) : Object.keys(groupedAssets).length === 0 ? (
            <Card>
              <CardContent className="flex h-40 flex-col items-center justify-center gap-3">
                <p className="text-muted-foreground">No assets found</p>
                <Button size="sm" onClick={() => setAssetFormOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />Add Asset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedAssets).map(([categoryName, categoryAssets]) => {
                const category = categories.find((c) => c.name === categoryName);
                const categoryTotal = categoryAssets.reduce((sum, a) => sum + Number(a.current_value), 0);
                const isExpanded = expandedCategory === categoryName;

                return (
                  <Card key={categoryName}>
                    <CardHeader 
                      className="p-3 cursor-pointer md:p-4"
                      onClick={() => setExpandedCategory(isExpanded ? null : categoryName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${getTypeColor(category?.type || '')}`} />
                          <CardTitle className="text-sm md:text-base">{categoryName}</CardTitle>
                          <Badge variant="secondary" className="text-xs">{categoryAssets.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold md:text-base">{formatCurrency(categoryTotal)}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
                        {/* Mobile: Card list */}
                        <div className="space-y-2 md:hidden">
                          {categoryAssets.map((asset) => (
                            <div key={asset.id} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">{asset.source?.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{formatCurrency(asset.current_value, asset.currency)}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setEditingAsset(asset); setAssetFormOpen(true); }}>
                                      <Pencil className="mr-2 h-4 w-4" />Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteAsset(asset.id)} className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop: Table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryAssets.map((asset) => (
                                <TableRow key={asset.id}>
                                  <TableCell className="font-medium">{asset.name}</TableCell>
                                  <TableCell>{asset.source?.name || '-'}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(asset.current_value, asset.currency)}</TableCell>
                                  <TableCell className="text-muted-foreground">{format(new Date(asset.updated_at), 'MMM d')}</TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setEditingAsset(asset); setAssetFormOpen(true); }}>
                                          <Pencil className="mr-2 h-4 w-4" />Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteAsset(asset.id)} className="text-red-600">
                                          <Trash2 className="mr-2 h-4 w-4" />Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="space-y-4">
            {/* Categories */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FolderTree className="h-4 w-4" />Categories
                    </CardTitle>
                    <CardDescription className="text-xs">Asset types</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setEditingCategory(null); setCategoryFormOpen(true); }}>
                    <Plus className="mr-1 h-3 w-3" />Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${getTypeColor(cat.type)}`} />
                        <span className="text-sm font-medium">{cat.name}</span>
                        <Badge variant={getTypeBadgeVariant(cat.type) as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                          {cat.type}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingCategory(cat); setCategoryFormOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCategory(cat.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="h-4 w-4" />Sources
                    </CardTitle>
                    <CardDescription className="text-xs">Platforms & institutions</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSourceFormOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" />Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {sources.map((src) => (
                    <div key={src.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div>
                        <span className="text-sm font-medium">{src.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {categories.find(c => c.id === src.category_id)?.name}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteSource(src.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {sources.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No sources yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssetForm
        open={assetFormOpen}
        onOpenChange={(open) => { setAssetFormOpen(open); if (!open) setEditingAsset(null); }}
        categories={categories}
        sources={sources}
        onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
        asset={editingAsset}
        onCreateSource={() => { setAssetFormOpen(false); setSourceFormOpen(true); }}
      />
      <SourceForm
        open={sourceFormOpen}
        onOpenChange={setSourceFormOpen}
        categories={categories}
        onSubmit={handleCreateSource}
      />
      <AssetCategoryForm
        open={categoryFormOpen}
        onOpenChange={(open) => { setCategoryFormOpen(open); if (!open) setEditingCategory(null); }}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory}
      />
    </div>
  );
}
