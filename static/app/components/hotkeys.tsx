import styled from '@emotion/styled';

import space from 'sentry/styles/space';
import {getKeyCode} from 'sentry/utils/getKeyCode';

const macModifiers = {
  18: '⌥',
  17: '⌃',
  91: '⌘',
};

const normalModifiers = {
  18: 'ALT',
  17: 'CTRL',
  91: 'CMD',
};

const genericGlyphs = {
  16: '⇧',
  8: '⌫',
  37: '←',
  38: '↑',
  39: '→',
  40: '↓',
  107: '+',
};

const keyToDisplay = (
  key: string,
  isMac: boolean
): {label: React.ReactNode; specificToOs: 'macos' | 'generic'} => {
  // Handle escaped + case
  key = key === '\\+' ? '+' : key;

  const keyCode = getKeyCode(key);

  // Not a special key
  if (!keyCode) {
    return {label: <Key>{key.toUpperCase()}</Key>, specificToOs: 'generic'};
  }

  const modifierMap = isMac ? macModifiers : normalModifiers;
  const keyStr = modifierMap[keyCode] ?? genericGlyphs[keyCode] ?? key.toUpperCase();

  const specificToOs = keyStr === 'CMD' ? 'macos' : 'generic';

  return {label: <Key>{keyStr}</Key>, specificToOs};
};

type Props = {
  /**
   * Pass key combinations in with + as the separator.
   * For example: command+option+x
   *
   * Use comma for fallback key combos when the first one contains a key that does not exist on that os (non-mac):
   * command+option+x,ctrl+shift+x
   * (does not have to be the same combo)
   *
   * Escape the + key with a slash \+
   */
  value: string[] | string;
  forcePlatform?: 'macos' | 'generic';
};

const Hotkeys = ({value, forcePlatform}: Props) => {
  // Split by commas and then split by +, but allow escaped /+
  const hotkeySets = (Array.isArray(value) ? value : [value]).map(o =>
    o.trim().split(/(?<!\\)\+/g)
  );

  const isMac = forcePlatform
    ? forcePlatform === 'macos'
    : window?.navigator?.platform?.toLowerCase().startsWith('mac') ?? false;

  // If we're not using mac find the first key set that is generic.
  // Otherwise show whatever the first hotkey is.
  const finalKeySet = hotkeySets
    .map(keySet => keySet.map(key => keyToDisplay(key, isMac)))
    .find(keySet =>
      !isMac ? keySet.every(key => key.specificToOs === 'generic') : true
    );

  // No key available for the OS. Don't show a hotkey
  if (finalKeySet === undefined) {
    return null;
  }

  return <HotkeysContainer>{finalKeySet.map(key => key.label)}</HotkeysContainer>;
};

export default Hotkeys;

const Key = styled('span')`
  font-size: ${p => p.theme.fontSizeMedium};
`;

const HotkeysContainer = styled('div')`
  font-family: ${p => p.theme.text.family};
  display: flex;
  flex-direction: row;
  align-items: center;

  > * {
    margin-right: ${space(1)};
  }
`;
