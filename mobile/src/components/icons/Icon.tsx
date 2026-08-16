import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Hand-drawn on a 24x24 grid so every icon obeys the rounded shape language
 * from §2.6 — round caps and joins, no sharp corners. A stock icon set would
 * fight that rule, so the app owns its glyphs.
 */
export type IconName =
  | 'flame'
  | 'check'
  | 'plus'
  | 'trash'
  | 'pencil'
  | 'snowflake'
  | 'chevronLeft'
  | 'chevronRight'
  | 'camera'
  | 'barcode'
  | 'search'
  | 'close'
  | 'home'
  | 'history'
  | 'profile'
  | 'target';

export type IconProps = {
  name: IconName;
  color?: ColorToken;
  size?: number;
  strokeWidth?: number;
};

const VIEW_BOX = 24;

type StrokeStyle = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: 'none';
};

export function Icon({ name, color = 'textPrimary', size = 20, strokeWidth = 2 }: IconProps) {
  const theme = useTheme();
  const tint = theme.colors[color];

  const stroke: StrokeStyle = {
    stroke: tint,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  return (
    <Svg height={size} viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} width={size}>
      {render(name, tint, stroke)}
    </Svg>
  );
}

function render(name: IconName, tint: string, stroke: StrokeStyle) {
  switch (name) {
    case 'flame':
      return (
        <Path
          d="M12 2.6c.5 3.1 2.4 4.4 3.9 6.1 1.4 1.6 2.1 3.1 2.1 5.1a6 6 0 0 1-12 0c0-1.7.6-3.1 1.7-4.3.3 1 .9 1.7 1.7 2.1.1-3 1.2-6.4 2.6-9Z"
          fill={tint}
        />
      );
    case 'check':
      return <Path d="M5 12.8 9.5 17 19 7.5" {...stroke} />;
    case 'plus':
      return <Path d="M12 5.5v13M5.5 12h13" {...stroke} />;
    case 'trash':
      return (
        <>
          <Path d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" {...stroke} />
          <Path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" {...stroke} />
          <Path d="M10.5 10v6.5M13.5 10v6.5" {...stroke} />
        </>
      );
    case 'pencil':
      return (
        <>
          <Path d="M15.2 4.9a2 2 0 0 1 2.9 0l1 1a2 2 0 0 1 0 2.9L9.4 17.5l-4.4 1.5 1.5-4.4Z" {...stroke} />
          <Path d="M14 6.2 17.8 10" {...stroke} />
        </>
      );
    case 'snowflake':
      return (
        <>
          <Path d="M12 3.5v17M4.6 7.8l14.8 8.4M19.4 7.8 4.6 16.2" {...stroke} />
          <Path d="M9.6 5.4 12 3.5l2.4 1.9M14.4 18.6 12 20.5l-2.4-1.9" {...stroke} />
        </>
      );
    case 'chevronLeft':
      return <Path d="M14.5 5.5 8 12l6.5 6.5" {...stroke} />;
    case 'chevronRight':
      return <Path d="M9.5 5.5 16 12l-6.5 6.5" {...stroke} />;
    case 'camera':
      return (
        <>
          <Rect height={13} rx={3.5} ry={3.5} width={19} x={2.5} y={6} {...stroke} />
          <Path d="M8.5 6 9.8 3.8h4.4L15.5 6" {...stroke} />
          <Circle cx={12} cy={12.5} r={3.6} {...stroke} />
        </>
      );
    case 'barcode':
      return (
        <>
          <Path d="M3.5 8V6.5a3 3 0 0 1 3-3H8M16 3.5h1.5a3 3 0 0 1 3 3V8M20.5 16v1.5a3 3 0 0 1-3 3H16M8 20.5H6.5a3 3 0 0 1-3-3V16" {...stroke} />
          <Path d="M7.5 8.5v7M12 8.5v7M16.5 8.5v7" {...stroke} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx={11} cy={11} r={6.5} {...stroke} />
          <Path d="m16 16 4 4" {...stroke} />
        </>
      );
    case 'close':
      return <Path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" {...stroke} />;
    case 'home':
      return (
        <>
          <Path d="M4 10.2 12 4l8 6.2v8.3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" {...stroke} />
          <Path d="M9.6 20.5v-5a2 2 0 0 1 2-2h.8a2 2 0 0 1 2 2v5" {...stroke} />
        </>
      );
    case 'history':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Path d="M12 7.2V12l3.2 2.2" {...stroke} />
        </>
      );
    case 'profile':
      return (
        <>
          <Circle cx={12} cy={8.5} r={4} {...stroke} />
          <Path d="M4.8 20.4a7.4 7.4 0 0 1 14.4 0" {...stroke} />
        </>
      );
    case 'target':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Circle cx={12} cy={12} r={4.5} {...stroke} />
          <Circle cx={12} cy={12} fill={tint} r={1.6} stroke="none" />
        </>
      );
  }
}
