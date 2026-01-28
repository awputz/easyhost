import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FolderPlus, Link2 } from 'lucide-react'

export default function DashboardPage() {
  // Assets will be fetched once Supabase is connected
  // For now, show empty state
  const hasAssets = false

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground">
            Upload and manage your files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New folder
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {hasAssets ? (
        /* Asset grid - will be populated when Supabase is connected */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Assets will be mapped here */}
        </div>
      ) : (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Get started by uploading your first file. Drag and drop files here, or click the button below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload files
              </Button>
              <Button variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                Import from URL
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Supports images, videos, documents, and more. Max 10MB per file on free plan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
