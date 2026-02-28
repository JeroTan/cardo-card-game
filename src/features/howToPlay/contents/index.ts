// Import all markdown content files
import intro from './01-introduction.md?raw';
import cardSystem from './02-card-system.md?raw';
import gameSetup from './03-game-setup.md?raw';
import turnStructure from './04-turn-structure.md?raw';
import challenging from './05-challenging.md?raw';
import zeroCard from './06-zero-card.md?raw';
import elimination from './07-elimination.md?raw';
import strategyTips from './08-strategy-tips.md?raw';

export interface GuideContent {
  id: number;
  title: string;
  content: string;
}

export const guideContents: GuideContent[] = [
  {
    id: 1,
    title: 'Introduction',
    content: intro,
  },
  {
    id: 2,
    title: 'Card System',
    content: cardSystem,
  },
  {
    id: 3,
    title: 'Game Setup',
    content: gameSetup,
  },
  {
    id: 4,
    title: 'Turn Structure',
    content: turnStructure,
  },
  {
    id: 5,
    title: 'Challenging',
    content: challenging,
  },
  {
    id: 6,
    title: 'Zero Card',
    content: zeroCard,
  },
  {
    id: 7,
    title: 'Elimination',
    content: elimination,
  },
  {
    id: 8,
    title: 'Strategy Tips',
    content: strategyTips,
  },
];
