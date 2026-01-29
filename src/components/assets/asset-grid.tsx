'use client'

import { useState } from 'react'
import { AssetCard } from './asset-card'
import { AssetPreview } from './asset-preview'
import type { Asset } from '@/types'

interface AssetGridProps {
  assets: Asset[]
  onAssetsChange?: () => void
}

export function AssetGrid({ assets, onAssetsChange }: AssetGridProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)

  const handleDelete = async (asset: Asset) => {
    // For demo mode
    if (asset.public_path.startsWith('/demo/')) {
      onAssetsChange?.()
      return
    }

    // In production, call delete API
    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onAssetsChange?.()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            selected={selectedAsset?.id === asset.id}
            onSelect={setSelectedAsset}
            onPreview={setPreviewAsset}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Preview modal */}
      <AssetPreview
        asset={previewAsset}
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
      />
    </>
  )
}
