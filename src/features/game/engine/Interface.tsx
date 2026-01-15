import {
  Application,
  extend,
} from '@pixi/react';

import {
    Container,
    Graphics,
    Sprite,
    TextStyle,
} from 'pixi.js';
import { useRef } from 'react';

extend({
    Container,
    Graphics,
    Sprite,
});

export default function Interface({
  children,
}:{
  children?: React.ReactNode
}){

  const wrapperRef = useRef(null);
  const basicFontStyle = useRef(new TextStyle({
    fontFamily: `Oswald, sans-serif`,
    fill: "0xff1010",
  }))

  return <>
    <div className='flex justify-center'>
      <div ref={wrapperRef} className='h-[calc(100vh-5rem)] aspect-video'>
        <Application
          resizeTo={wrapperRef}
          defaultTextStyle={basicFontStyle.current}
          background={"0x28282B"}
        >
          {children}
        </Application>
      </div>
    </div>
  </>
}