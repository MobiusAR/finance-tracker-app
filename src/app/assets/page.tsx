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
import { useAssets, useAssetCategories, useAssetSources } from '@/hooks/useAssets';
import { Asset, CreateAsset, UpdateAsset, CreateAssetSource } from '@/lib/supabase/types';
import { Plus, MoreHorizontal, Pencil, Trash2, Building } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AssetsPage() {
  const { assets, loading, createAsset, updateAsset, deleteAsset, refetch } = useAssets();
  const { categories } = useAssetCategories();
  const { sources, createSource, refetch: refetchSources } = useAssetSources();

  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');

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
      case 'investment':
        return 'bg-green-500';
      case 'cash':
        return 'bg-blue-500';
      case 'property':
        return 'bg-orange-500';
      case 'liability':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id);
        toast.success('Asset deleted');
      } catch (error) {
        toast.error('Failed to delete asset');
      }
    }
  };

  const handleCreateSource = async (data: CreateAssetSource) => {
    await createSource(data);
    refetchSources();
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetFormOpen(true);
  };

  // Filter assets by category type
  const filteredAssets = selectedTab === 'all'
    ? assets
    : assets.filter((asset) => asset.category?.type === selectedTab);

  // Group assets by category for display
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    const categoryName = asset.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  // Calculate totals
  const totalValue = filteredAssets.reduce((sum, asset) => {
    const value = asset.category?.type === 'liability'
      ? -Number(asset.current_value)
      : Number(asset.current_value);
    return sum + value;
  }, 0);

  return (
    <div>
      <Header
        title="Assets"
        description="Manage your assets, investments, and liabilities"
      />

      <div className="mb-6 flex items-center justify-between">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="investment">Investments</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="liability">Liabilities</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSourceFormOpen(true)}>
            <Building className="mr-2 h-4 w-4" />
            Add Source
          </Button>
          <Button onClick={() => {
            setEditingAsset(null);
            setAssetFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {selectedTab === 'all' ? 'Total' : selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {loading ? '...' : formatCurrency(Math.abs(totalValue))}
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Assets Table */}
      {loading ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            Loading assets...
          </CardContent>
        </Card>
      ) : Object.keys(groupedAssets).length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">No assets found</p>
            <Button onClick={() => setAssetFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAssets).map(([categoryName, categoryAssets]) => {
            const category = categories.find((c) => c.name === categoryName);
            const categoryTotal = categoryAssets.reduce(
              (sum, asset) => sum + Number(asset.current_value),
              0
            );

            return (
              <Card key={categoryName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${getTypeColor(category?.type || '')}`}
                      />
                      <CardTitle className="text-lg">{categoryName}</CardTitle>
                      <Badge variant="secondary">
                        {categoryAssets.length} asset{categoryAssets.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(categoryTotal)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.source?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(asset.current_value, asset.currency)}
                          </TableCell>
                          <TableCell>{asset.currency}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(asset.updated_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Asset Form Dialog */}
      <AssetForm
        open={assetFormOpen}
        onOpenChange={(open) => {
          setAssetFormOpen(open);
          if (!open) setEditingAsset(null);
        }}
        categories={categories}
        sources={sources}
        onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
        asset={editingAsset}
        onCreateSource={() => {
          setAssetFormOpen(false);
          setSourceFormOpen(true);
        }}
      />

      {/* Source Form Dialog */}
      <SourceForm
        open={sourceFormOpen}
        onOpenChange={setSourceFormOpen}
        categories={categories}
        onSubmit={handleCreateSource}
      />
    </div>
  );
}
