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
    <div className='flex justify-center'>
      <div ref={wrapperRef} className='h-[calc(100vh-5rem)] aspect-video'>
        <Application
          resizeTo={wrapperRef}
          // defaultTextStyle={basicFontStyle.current}
          background={"0x28282B"}
          antialias={true}
        >
          {children}
        </Application>
      </div>
    </div>
  </>
}