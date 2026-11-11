import { Box } from '@mui/material';
import { getColorSwatch } from '../../config/colorSwatches';

interface ColorSwatchProps {
  color: string;
  size?: number;
}

export function ColorSwatch({ color, size = 12 }: ColorSwatchProps) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: getColorSwatch(color),
        border: '1px solid rgba(24,33,47,0.25)',
      }}
    />
  );
}
