import {
  Application,
  extend,
} from '@pixi/react';

import {
    Container,
    Graphics,
    Sprite,
    TextStyle,
    Text,
} from 'pixi.js';
import { useRef } from 'react';

extend({
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle
});

export default function Interface({
  children,
}:{
  children?: React.ReactNode
}){

  const wrapperRef = useRef(null);
  // const basicFontStyle = useRef(new TextStyle({
  //   fontFamily: `Oswald, sans-serif`,
  //   fill: "0xf0f0f0",
  // }))

  return <>
    <div ref={wrapperRef} className='w-full h-full'>
      <Application
        resizeTo={wrapperRef}
        // defaultTextStyle={basicFontStyle.current}
        background={"0x28282B"}
        antialias={true}
      >
        {children}
      </Application>
    </div>
  </>
}