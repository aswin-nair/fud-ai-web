import { Redirect } from 'expo-router';

export default function LogFabSlot() {
  return <Redirect href={'/log/photo' as never} />;
}
