import { useState } from 'react';
import { saveProduct, deleteProduct, generateId, type Product } from '@/lib/store';
import { useData } from '@/lib/data';
import { Plus, Pencil, Trash2, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { flowError, flowLog } from '@/lib/debug';

export default function Products() {
  const { products, loadingProducts, productsError } = useData();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = async (product: Product) => {
    try {
      flowLog('ui:handleSaveProduct:start', { id: product.id, name: product.name });
      await saveProduct(product);
      setShowForm(false);
      setEditing(null);
      toast.success(editing ? 'Product updated!' : 'Product added!');
    } catch (error) {
      flowError('ui:handleSaveProduct:error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loadingProducts ? (
          <div className="text-sm text-muted-foreground">Loading products...</div>
        ) : productsError ? (
          <div className="text-sm text-destructive">Failed to load products: {productsError}</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-card rounded-xl shadow-card overflow-hidden group">
            <div className="aspect-square bg-accent flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">🥥</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ₹{product.pricePerKg}/{product.unit}
                {product.pricePerUnit && ` · ₹${product.pricePerUnit}/pc`}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditing(product);
                    setShowForm(true);
                  }}
                  className="flex-1 py-2 rounded-lg bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1 hover:bg-accent"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="py-2 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {showForm && (
        <ProductFormModal
          product={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product,
  onSave,
  onClose,
}: {
  product: Product | null;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [pricePerKg, setPricePerKg] = useState(product?.pricePerKg?.toString() || '');
  const [pricePerUnit, setPricePerUnit] = useState(product?.pricePerUnit?.toString() || '');
  const [unit, setUnit] = useState<'kg' | 'litre'>(product?.unit || 'litre');
  const [image, setImage] = useState(product?.image || '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await compressImage(file, 512, 0.8);
    setImage(compressed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pricePerKg) return;
    flowLog('ui:productForm:submit', { name, pricePerKg, hasImage: Boolean(image) });
    onSave({
      id: product?.id || generateId(),
      name,
      pricePerKg: parseFloat(pricePerKg),
      pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
      unit,
      image,
      createdAt: product?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-elevated w-full max-w-md">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-foreground">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          <div className="flex justify-center">
            <label className="w-28 h-28 rounded-xl bg-accent flex flex-col items-center justify-center cursor-pointer hover:bg-accent/80 overflow-hidden">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add Image</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pure Coconut Oil"
              className="w-full px-4 py-2.5 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit Type</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'kg' | 'litre')}
                className="w-full px-4 py-2.5 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="litre">Litre (L)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Price per {unit}</label>
              <input
                type="number"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                placeholder="₹210"
                className="w-full px-4 py-2.5 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Price per bottle</label>
              <input
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-2.5 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90"
          >
            {product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  const { width, height } = fitWithin(img.width, img.height, maxSize);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitWithin(width: number, height: number, maxSize: number) {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  if (width > height) {
    const ratio = maxSize / width;
    return { width: maxSize, height: Math.round(height * ratio) };
  }
  const ratio = maxSize / height;
  return { width: Math.round(width * ratio), height: maxSize };
}
