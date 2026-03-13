import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Download, Maximize2, Loader2, Upload, Trash2, Move, Copy } from 'lucide-react';

export interface ImageDisplayRef {
  getCombinedImage: () => Promise<string | null>;
}

interface ImageDisplayProps {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  outputFormat?: 'PNG' | 'JPEG';
  transparentBackground?: boolean;
  aspectRatio?: string;
  generationTime?: number | null;
}

interface OverlayItem {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

const ImageDisplay = forwardRef<ImageDisplayRef, ImageDisplayProps>(({ 
  imageUrl, 
  loading, 
  error, 
  outputFormat = 'PNG',
  transparentBackground = false,
  aspectRatio = '1:1',
  generationTime
}, ref) => {
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startPosX: 50, startPosY: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateCombinedImage = async (): Promise<string | null> => {
    if (!imageUrl) return null;

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      
      let targetWidth = img.width;
      let targetHeight = img.height;
      
      if (aspectRatio === '1138:1280') {
        targetWidth = 1138;
        targetHeight = 1280;
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not get canvas context");

      // Draw original image (cover)
      if (aspectRatio === '1138:1280') {
        // Calculate scale to cover
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (targetWidth - scaledWidth) / 2;
        const offsetY = (targetHeight - scaledHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // If transparent background is requested and output is PNG, key out white pixels
      if (transparentBackground && outputFormat === 'PNG') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r > 240 && g > 240 && b > 240) {
            const maxVal = Math.max(r, g, b);
            const alpha = Math.max(0, 255 - (maxVal - 240) * 17);
            data[i + 3] = alpha;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Draw overlays if present
      if (overlays.length > 0) {
        for (const item of overlays) {
          const overlayImg = new Image();
          overlayImg.crossOrigin = "anonymous";
          overlayImg.src = item.src;
          await new Promise((resolve) => { overlayImg.onload = resolve; });
          
          // Base overlay width is 25% of the canvas width
          const baseOverlayWidth = canvas.width * 0.25;
          const scaleFactor = baseOverlayWidth / overlayImg.width;
          
          const finalWidth = overlayImg.width * scaleFactor * item.scale;
          const finalHeight = overlayImg.height * scaleFactor * item.scale;
          
          const centerX = (item.x / 100) * canvas.width;
          const centerY = (item.y / 100) * canvas.height;
          
          const drawX = centerX - finalWidth / 2;
          const drawY = centerY - finalHeight / 2;
          
          ctx.globalAlpha = item.opacity ?? 1;
          ctx.drawImage(overlayImg, drawX, drawY, finalWidth, finalHeight);
          ctx.globalAlpha = 1; // Reset alpha
        }
      }

      const mimeType = outputFormat === 'PNG' ? 'image/png' : 'image/jpeg';
      return canvas.toDataURL(mimeType, 1.0);
    } catch (err) {
      console.error("Failed to generate combined image", err);
      return imageUrl; // fallback to original
    }
  };

  useImperativeHandle(ref, () => ({
    getCombinedImage: generateCombinedImage
  }));

  const getAspectRatioClass = () => {
    switch(aspectRatio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      case '4:1': return 'aspect-[4/1]';
      case '8:1': return 'aspect-[8/1]';
      case '1:4': return 'aspect-[1/4]';
      case '1:8': return 'aspect-[1/8]';
      case '1138:1280': return 'aspect-[1138/1280]';
      default: return 'aspect-square';
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveOverlayId(id);
    setIsDragging(true);
    
    const item = overlays.find(o => o.id === id);
    if (item) {
      setDragStart({ 
        x: e.clientX, 
        y: e.clientY, 
        startPosX: item.x, 
        startPosY: item.y 
      });
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !containerRef.current || !activeOverlayId) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const rect = containerRef.current.getBoundingClientRect();
      const percentX = (dx / rect.width) * 100;
      const percentY = (dy / rect.height) * 100;
      
      setOverlays(prev => prev.map(item => {
        if (item.id === activeOverlayId) {
          return {
            ...item,
            x: Math.max(0, Math.min(100, dragStart.startPosX + percentX)),
            y: Math.max(0, Math.min(100, dragStart.startPosY + percentY))
          };
        }
        return item;
      }));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragStart, activeOverlayId]);

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newId = Date.now().toString();
        setOverlays(prev => [
          ...prev, 
          { id: newId, src: event.target?.result as string, x: 50, y: 50, scale: 1, opacity: 1 }
        ]);
        setActiveOverlayId(newId);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDuplicate = () => {
    if (!activeOverlayId) return;
    const itemToDuplicate = overlays.find(o => o.id === activeOverlayId);
    if (itemToDuplicate) {
      const newId = Date.now().toString();
      setOverlays(prev => [
        ...prev,
        { ...itemToDuplicate, id: newId, x: itemToDuplicate.x + 5, y: itemToDuplicate.y + 5 }
      ]);
      setActiveOverlayId(newId);
    }
  };

  const handleRemove = () => {
    if (!activeOverlayId) return;
    setOverlays(prev => prev.filter(o => o.id !== activeOverlayId));
    setActiveOverlayId(null);
  };

  const handleScaleChange = (newScale: number) => {
    if (!activeOverlayId) return;
    setOverlays(prev => prev.map(item => 
      item.id === activeOverlayId ? { ...item, scale: newScale } : item
    ));
  };

  const handleOpacityChange = (newOpacity: number) => {
    if (!activeOverlayId) return;
    setOverlays(prev => prev.map(item => 
      item.id === activeOverlayId ? { ...item, opacity: newOpacity } : item
    ));
  };

  if (loading) {
    return (
      <div className="w-full aspect-square md:aspect-video rounded-2xl glass-panel border border-zinc-700/50 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 to-purple-500/5 animate-pulse" />
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4 relative z-10" />
        <h3 className="text-lg font-medium text-white relative z-10">Gerando a Imagem</h3>
        <p className="text-sm text-zinc-400 mt-2 max-w-xs relative z-10">
          Gerando a Imagem em 4K de alta. Isso pode levar um momento devido à simulação complexa de ray-tracing... ConexTv
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video rounded-2xl glass-panel border border-red-500/20 flex flex-col items-center justify-center p-8 text-center bg-red-500/5">
        <div className="text-red-400 font-medium text-lg mb-2">Falha na Geração</div>
        <p className="text-zinc-400 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl glass-panel border border-dashed border-zinc-700 flex flex-col items-center justify-center p-8 text-center opacity-60">
        <div className="w-16 h-16 rounded-full bg-zinc-800 mb-4 flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-zinc-500" />
        </div>
        <p className="text-zinc-400 text-sm">Área de pré-visualização. Sua imagem gerada aparecerá aqui.</p>
      </div>
    );
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    try {
      const dataUrl = await generateCombinedImage();
      if (!dataUrl) throw new Error("Failed to get image data");

      const extension = outputFormat === 'PNG' ? 'png' : 'jpg';
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `conextv-brand-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to process image for download, falling back to direct download", err);
      const link = document.createElement('a');
      link.href = imageUrl;
      const extension = outputFormat === 'PNG' ? 'png' : 'jpg';
      link.download = `conextv-brand-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="group relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black flex flex-col items-center justify-center">
        {/* Background Blur for nicer framing if aspect ratio differs */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
          style={{ backgroundImage: `url(${imageUrl})` }} 
        />
        
        <div 
          ref={containerRef}
          className={`relative w-full max-h-[70vh] ${getAspectRatioClass()} bg-black overflow-hidden shadow-2xl`}
          style={{ 
            // Ensures the container doesn't exceed screen height but maintains aspect ratio
            maxWidth: '100%',
            objectFit: 'contain'
          }}
        >
          {/* Base Image */}
          <img 
            src={imageUrl} 
            alt="Logotipo Gerado" 
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Overlay Images */}
          {overlays.map((item) => (
            <img 
              key={item.id}
              src={item.src} 
              alt="Overlay"
              onPointerDown={(e) => handlePointerDown(e, item.id)}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) scale(${item.scale})`,
                width: '25%',
                opacity: item.opacity ?? 1,
                cursor: isDragging && activeOverlayId === item.id ? 'grabbing' : 'grab',
                zIndex: activeOverlayId === item.id ? 40 : 30,
                touchAction: 'none',
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))',
                border: activeOverlayId === item.id ? '2px dashed rgba(255, 255, 255, 0.5)' : 'none',
                padding: activeOverlayId === item.id ? '4px' : '0'
              }}
              draggable={false}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center z-50 pointer-events-none">
          {generationTime !== undefined && generationTime !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md text-zinc-300 text-sm font-medium rounded-full border border-white/10 shadow-lg pointer-events-auto">
              <span className="text-yellow-500">⚡</span>
              Sua imagem foi gerada em {Math.floor(generationTime / 60)}m {generationTime % 60}s
            </div>
          )}
          <div className="flex items-center gap-2 pointer-events-auto ml-auto">
            <button 
              onClick={() => {
                const text = encodeURIComponent(`Confira a imagem que eu gerei na ConexTV!`);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors shadow-lg"
              title="Compartilhar no WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Compartilhar
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg"
            >
              <Download className="w-4 h-4" />
              Baixar {outputFormat}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Controls */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleOverlayUpload} 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700"
          >
            <Upload className="w-4 h-4 text-yellow-500" />
            Adicionar Imagem
          </button>
          
          {activeOverlayId && (
            <>
              <button 
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg transition-colors border border-blue-500/20"
                title="Duplicar Imagem Selecionada"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>
              <button 
                onClick={handleRemove}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
                title="Remover Imagem Selecionada"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            </>
          )}
        </div>

        {activeOverlayId && (
          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
            <div className="flex items-center gap-3 min-w-[150px] max-w-[200px] bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tamanho:</span>
              <input 
                type="range" 
                min="0.2" 
                max="3" 
                step="0.1" 
                value={overlays.find(o => o.id === activeOverlayId)?.scale || 1} 
                onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-500"
              />
            </div>
            <div className="flex items-center gap-3 min-w-[150px] max-w-[200px] bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Opacidade:</span>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05" 
                value={overlays.find(o => o.id === activeOverlayId)?.opacity ?? 1} 
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ImageDisplay;