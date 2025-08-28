import React, { useState } from 'react';
import { SmileyIcon, LeafIcon, FoodIcon, ActivityIcon, TravelIcon, ObjectIcon, SymbolIcon, FlagIcon } from './Icons';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_DATA = {
  'Smileys & People': {
    icon: SmileyIcon,
    emojis: '😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵😡😠🤬😷🤒🤕🤢🤮🤧😇🤠🥳🥴🥺🤥🤫🤭🧐🤓☻😈👿👹👺💀👻👽🤖💩😺😸😹😻😼😽🙀😿😾'.split('')
  },
  'Animals & Nature': {
    icon: LeafIcon,
    emojis: '🙈🙉🙊🐵🐒🦍🦧🐶🐕🦮🐕‍🦺🐩🐺🦊🦝🐱🐈🦁🐯🐅🐆🐴🐎🦄🦓🦌🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦏🦛🐭🐁🐀🐹🐰🐇🐿🦔🦇🐻🐨🐼🦥🦦🦨🦘 badger 🦡 🦃🐔🐓🐣🐤🐥🐦🐧🕊🦅🦆🦢🦉🦩🦚🦜🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🐟🐠🐡🦈🐙🐚🐌🦋🐛🐜🐝🐞🦗🕷🕸🦂🦟🦠'.split(' ')
  },
  'Food & Drink': {
    icon: FoodIcon,
    emojis: '🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🥝🍅🥥🥑🍆🥔🥕🌽🌶🥒🥬🥦🧄🧅🍄🥜🌰🍞🥐🥖🥨🥯🥞🧇🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🥙🧆🌮🌯🥗🥘🥫🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍚🍘🍥🥠🥮🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪'.split('')
  },
  'Activities': {
    icon: ActivityIcon,
    emojis: '⚽️🏀🏈⚾️🥎🎾🏐🏉🥏🎱🏓🏸🏒🏑🥍🏏🥅⛳️🏹🎣🥊🥋🎽🛹🛷⛸🥌🎿⛷🏂🪂🏋️‍♀️🏋️‍♂️🤼‍♀️🤼‍♂️🤸‍♀️🤸‍♂️⛹️‍♀️⛹️‍♂️🤺🤾‍♀️🤾‍♂️🏌️‍♀️🏌️‍♂️🏇🧘‍♀️🧘‍♂️🏄‍♀️🏄‍♂️🏊‍♀️🏊‍♂️🤽‍♀️🤽‍♂️🚣‍♀️🚣‍♂️🧗‍♀️🧗‍♂️🚵‍♀️🚵‍♂️🚴‍♀️🚴‍♂️🏆'.split('')
  },
  'Travel & Places': {
    icon: TravelIcon,
    emojis: '🚗🚕🚙🚌🚐🚑🚒🚓🚔🚜🏎🏍🛵🦽🦼🛴🚲🛹🚏🛣🛤⛽️🚨✈️🛩🛫🛬🪂🛰🚀🛸🚁🛶⛵️🚤🛥🛳⛴🚢⚓️🗼🏰🏯🏟🏠🏡'.split('')
  },
  'Objects': {
    icon: ObjectIcon,
    emojis: '⌚️📱📲💻⌨️🖥🖨🖱🖲🕹🗜💽💾💿📀📼📷📸📹🎥📽🎞📞☎️📟📠📺📻🎙🎚🎛🧭⏱⏲⏰🕰⌛️⏳💡🔦🏮'.split('')
  },
  'Symbols': {
    icon: SymbolIcon,
    emojis: '❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉☸️✡️🔯🕎☯️☦️🛐⛎♈️♉️♊️♋️♌️♍️♎️♏️♐️♑️♒️♓️🆔⚛️🉑☢️☣️📳📴'.split('')
  },
  'Flags': {
    icon: FlagIcon,
    emojis: '🏁🚩🎌🏴🏳️‍🌈🏳️‍⚧️🇦🇫🇦🇽🇦🇱🇩🇿🇦🇸🇦🇩🇦🇴🇦🇮🇦🇶🇦🇬🇦🇷🇦🇲🇦🇼🇦🇺🇦🇹🇦🇿🇧🇸🇧🇭🇧🇩🇧🇧🇧🇾🇧🇪🇧🇿🇧🇯🇧🇲🇧🇹🇧🇴🇧🇦🇧🇼🇧🇷🇮🇴🇻🇬🇧🇳🇧🇬🇧🇫🇧🇮'.split('')
  }
};
type EmojiCategory = keyof typeof EMOJI_DATA;
const CATEGORIES = Object.keys(EMOJI_DATA) as EmojiCategory[];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState<EmojiCategory>(CATEGORIES[0]);
    
    // Close picker if clicked outside
    const pickerRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
  return (
    <div ref={pickerRef} className="absolute bottom-full left-0 mb-2 z-10 animate-pop-in">
        <div className="w-80 h-96 flex flex-col bg-panel border border-primary-t-20 rounded-xl shadow-lg overflow-hidden">
            <div className="flex-1 p-2 overflow-y-auto styled-scrollbar">
                <h3 className="text-sm font-bold text-text-muted px-2 pb-2">{activeCategory}</h3>
                <div className="grid grid-cols-8 gap-1">
                {EMOJI_DATA[activeCategory].emojis.map(emoji => (
                    <button
                    key={emoji}
                    onClick={() => onEmojiSelect(emoji)}
                    className="text-2xl rounded-md hover:bg-primary-t-20 transition-colors p-1 transform hover:scale-125"
                    aria-label={`Select emoji ${emoji}`}
                    style={{ fontFamily: "'Noto Color Emoji', sans-serif" }}
                    >
                    {emoji}
                    </button>
                ))}
                </div>
            </div>
            <div className="flex justify-around items-center p-1 bg-black/20 border-t border-primary-t-20">
                {CATEGORIES.map(category => {
                    const Icon = EMOJI_DATA[category].icon;
                    return (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`p-2 rounded-full transition-colors ${activeCategory === category ? 'bg-primary-t-50 text-primary' : 'text-text-muted hover:bg-primary-t-20'}`}
                            aria-label={`Category ${category}`}
                        >
                            <Icon className="w-6 h-6" />
                        </button>
                    )
                })}
            </div>
      </div>
    </div>
  );
};

export default EmojiPicker;