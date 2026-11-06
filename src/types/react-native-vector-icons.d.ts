// react-native-vector-icons v10 ships Flow types, not TypeScript ones, and
// @types/react-native-vector-icons isn't installed. Only the props used here.
declare module 'react-native-vector-icons/Ionicons' {
  import type { ComponentType } from 'react';
  import type { ColorValue, TextProps } from 'react-native';

  const Icon: ComponentType<TextProps & { name: string; size?: number; color?: ColorValue }>;
  export default Icon;
}
