import Svg, { Circle, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

export function Momo({ mood, size = 88 }: { mood: 'neutral' | 'sleepy' | 'excited' | 'proud' | 'curious' | 'cozy'; size?: number }) {
  const blush = mood === 'excited' || mood === 'proud' || mood === 'cozy';
  const blinking = mood === 'sleepy';
  const eyeR = blinking ? 1.1 : 5;

  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <LinearGradient id="momo-dough" x1="0" x2="0.3" y1="0" y2="1">
        <Stop offset="0%" stopColor="#FFF6E4" />
        <Stop offset="100%" stopColor="#E9C89A" />
      </LinearGradient>
      <Ellipse cx="50" cy="93" fill="#3A2A22" opacity={0.13} rx="26" ry="4.5" />
      <Path d="M22 76 Q14 84 22 88" fill="none" stroke="#E4BE8C" strokeLinecap="round" strokeWidth="7" />
      <Path d="M78 76 Q86 84 78 88" fill="none" stroke="#E4BE8C" strokeLinecap="round" strokeWidth="7" />
      <Ellipse cx="50" cy="60" fill="url(#momo-dough)" rx="35" ry="30" />
      <Ellipse cx="42" cy="45" fill="#FFFFFF" opacity={0.55} rx="17" ry="8" />
      <Path
        d="M16 48q8.5-14 17 0 8.5-14 17 0 8.5-14 17 0 8.5-14 17 0"
        fill="none"
        stroke="#E4BE8C"
        strokeLinecap="round"
        strokeWidth="4.6"
      />
      <Circle cx="39" cy="59" fill="#3A2A22" r={eyeR} />
      <Circle cx="61" cy="59" fill="#3A2A22" r={eyeR} />
      {!blinking ? <Circle cx="40.8" cy="57.2" fill="#FFFFFF" r="1.7" /> : null}
      {!blinking ? <Circle cx="62.8" cy="57.2" fill="#FFFFFF" r="1.7" /> : null}
      {blush ? <Ellipse cx="30" cy="68" fill="#FF9070" opacity={0.42} rx="5" ry="3.4" /> : null}
      {blush ? <Ellipse cx="70" cy="68" fill="#FF9070" opacity={0.42} rx="5" ry="3.4" /> : null}
      <Path
        d={mood === 'sleepy' ? 'M44 70h12' : 'M44 70a6.5 6.5 0 0 0 12 0'}
        fill="none"
        stroke="#3A2A22"
        strokeLinecap="round"
        strokeWidth="3.3"
      />
    </Svg>
  );
}
