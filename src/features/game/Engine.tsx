import {
  Application,
  extend,
} from '@pixi/react';

import {
    Container,
    Graphics,
    Sprite,
} from 'pixi.js';

extend({
    Container,
    Graphics,
    Sprite,
});

export default function Engine(){
  return <>
    <Application>

    </Application>
  </>
}