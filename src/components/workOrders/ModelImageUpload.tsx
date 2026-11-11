import { useState, useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Image as ImageIcon, UploadCloud, Trash2, ZoomIn, RefreshCw, X } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { tokens } from '../../theme';
import { MAX_PACKED_IMAGE_LENGTH, packImage } from '../../utils/packImage';
import { getFormText } from '../../utils/workOrderForm';

interface ModelImageUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function ModelImageUpload({ value, onChange, disabled }: ModelImageUploadProps) {
  const { locale } = useI18n();
  const text = getFormText(locale);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError(text.errImageInvalidType);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(text.errImageTooLarge);
      return;
    }

    packImage(file)
      .then((packed) => {
        if (packed.length > MAX_PACKED_IMAGE_LENGTH) setError(text.imageTooBig);
        else onChange(packed);
      })
      .catch(() => setError(text.saveFailed));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 240, gap: 1 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0.5, px: 1.5, fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}

      {value ? (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${tokens.line}`,
            borderRadius: 1.5,
            p: 1.5,
            backgroundColor: '#FAFAFA',
            height: '100%',
            minHeight: 240,
            overflow: 'hidden',
          }}
        >
          {/* Action buttons overlay at top */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              insetInlineEnd: 8,
              display: 'flex',
              gap: 0.5,
              zIndex: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(4px)',
              borderRadius: 1,
              p: 0.25,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Tooltip title={text.viewImage}>
              <IconButton size="small" onClick={() => setZoomOpen(true)} aria-label={text.viewImage}>
                <ZoomIn size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title={text.changeImage}>
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                aria-label={text.changeImage}
              >
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title={text.removeImage}>
              <IconButton
                size="small"
                color="error"
                onClick={() => onChange(undefined)}
                disabled={disabled}
                aria-label={text.removeImage}
              >
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Image Thumbnail */}
          <Box
            component="img"
            src={value}
            alt={text.modelImage}
            onClick={() => setZoomOpen(true)}
            sx={{
              maxWidth: '100%',
              maxHeight: 220,
              objectFit: 'contain',
              cursor: 'zoom-in',
              borderRadius: 1,
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 500 }}
          >
            {text.modelImage}
          </Typography>
        </Box>
      ) : (
        <Box
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={text.addImage}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: `1.5px dashed ${isDragging ? tokens.stitch : tokens.line}`,
            borderRadius: 1.5,
            p: 2.5,
            backgroundColor: isDragging ? 'rgba(217, 150, 43, 0.05)' : '#FAFCFE',
            height: '100%',
            minHeight: 240,
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            '&:hover': !disabled
              ? {
                borderColor: tokens.ink,
                backgroundColor: 'rgba(27, 42, 65, 0.02)',
              }
              : {},
            '&:focus-visible': {
              borderColor: tokens.stitch,
              boxShadow: `0 0 0 2px ${tokens.stitch}33`,
            },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: isDragging ? 'rgba(217, 150, 43, 0.12)' : 'rgba(27, 42, 65, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              color: isDragging ? tokens.stitch : tokens.textSecondary,
              transition: 'all 0.2s ease',
            }}
          >
            {isDragging ? <UploadCloud size={24} /> : <ImageIcon size={24} />}
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.textPrimary, mb: 0.5 }}>
            {text.addImage}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, maxWidth: 180, lineHeight: 1.3 }}>
            {text.uploadImageHint}
          </Typography>

          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6875rem' }}>
            {text.uploadImageTypes}
          </Typography>
        </Box>
      )}

      {/* Full-view Zoom Dialog */}
      {value && (
        <Dialog
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { p: 0, overflow: 'hidden' } }}
        >
          <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1">{text.modelImage}</Typography>
            <IconButton size="small" onClick={() => setZoomOpen(false)} aria-label="close">
              <X size={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, backgroundColor: '#1A1A1A' }}>
            <Box
              component="img"
              src={value}
              alt={text.modelImage}
              sx={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
