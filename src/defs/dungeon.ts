
import rat from './monsters/rat';
import slime from './monsters/slime';
import spider from './monsters/spider';
import ogre from './monsters/ogre'

// sample spawn def
const monsters = [
  {
    def: rat,
    weight: 1
  },
  {
    def: slime,
    weight: 1
  },
  {
    def: spider,
    weight: 1
  },
];

export default new Map([
  [
    1,
    {
      monsters,
      boss: ogre,
      difficulty: 1.0,
    }
  ],
  [
    2,
    {
      monsters,
      boss: ogre,
      difficulty: 1.2,
    }
  ],
  [
    3,
    {
      monsters,
      boss: ogre,
      difficulty: 1.5,
    }
  ],
  [
    4,
    {
      monsters,
      boss: ogre,
      difficulty: 2.0,
    }
  ],
  [
    5,
    {
      monsters,
      boss: ogre,
      difficulty: 2.5,
    }
  ],
])