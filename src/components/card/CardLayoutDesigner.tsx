import {convertBase64ToFile, convertFileToBase64, resizeAndCropImage} from "@jsarmyknife/native--file";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toPng } from 'html-to-image';
import { ImageOff } from "lucide-react";
import { LoaderCircle } from "../animate-ui/icons/loader-circle";
import { useDebounce } from "@uidotdev/usehooks";

export default function CardLayoutDesigner({
  name,
  atk,
  def,
  rawImage,
  updateCardImage
}: {
  name: string,
  atk: number,
  def: number,
  rawImage: File|null,
  updateCardImage?: (newImage:File)=>void
}){

  const [refinedImage, refinedImageSet] = useState<string|null>(null);
  const refinedName = useDebounce(name, 300);
  const [updatingImage, updatingImageStart] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null!);
  const identifier = useId();

  useEffect(()=>{
    if(rawImage == null){
      refinedImageSet(null);
      return;
    }
    updatingImageStart(async ()=>{
      // First Step: downsize the image to 400x600  but maintain the original image  aspect ratio. The overflow should be more than 400 if width or 600 if height whichever the case.
      // Second Step: Crop it to make 2x3 ratio
      // Last Step convert image to base64
      const updatedImage = await resizeAndCropImage({rawImage, downsizingTo:{width:369*2, height:539*2}, targetCrop:`369x539`});
      const base64Image = (await convertFileToBase64(updatedImage)) as string;
      refinedImageSet(base64Image);
    })
  }, [rawImage]);

  useEffect(()=>{
    if(refinedImage == null || svgRef.current == null) return;
    // If updateCardImage is provided, call it to update the parent state with the new image as png format
    if(updateCardImage){
      // using html to image
      toPng(svgRef.current as unknown as HTMLElement).then((dataUrl)=>{
        const img = new Image();
        img.src = dataUrl;
        updateCardImage(convertBase64ToFile(dataUrl, `card_image.png`));
      })
    }
  }, [refinedImage, atk, def, refinedName]);

  return <>
    <svg
      ref={svgRef}
      width={"100%"}
      height={"100%"}
      viewBox="0 0 400 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g clipPath={`url(#clip0_21_2${identifier})`}>
        <path
          d="M0 20C0 8.95432 8.95431 0 20 0H380C391.046 0 400 8.95431 400 20V580C400 591.046 391.046 600 380 600H20C8.95431 600 0 591.046 0 580V20Z"
          fill="#111219"
        />
        <path
          d="M15 55C15 32.9086 32.9086 15 55 15H344C366.091 15 384 32.9086 384 55V514C384 536.091 366.091 554 344 554H55C32.9086 554 15 536.091 15 514V55Z"
          fill="#D9D9D9"
        />
        <mask
          id={`mask0_21_2${identifier}`}
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x={15}
          y={15}
          width={369}
          height={539}
        >
          <path
            d="M15 55C15 32.9086 32.9086 15 55 15H344C366.091 15 384 32.9086 384 55V514C384 536.091 366.091 554 344 554H55C32.9086 554 15 536.091 15 514V55Z"
            fill="#D9D9D9"
          />
        </mask>
        <g mask={`url(#mask0_21_2${identifier})`}>
          {updatingImage && <>
            <rect
              x="-8.15945"
              y="-0.577698"
              width="415.466"
              height="575.005"
              fill="#e5e7eb"
            />
            <foreignObject x="15" y="15" width="369" height="539">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e5e7eb'
                }}>
                  <LoaderCircle animate />
                </div>
              </foreignObject>
          </> }
          {refinedImage ? (
            <rect
              x="-8.15945"
              y="-0.577698"
              width="415.466"
              height="575.005"
              fill={`url(#pattern0_21_2${identifier})`}
            />
          ) : (
            <foreignObject x="15" y="15" width="369" height="539">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e5e7eb'
                }}
              >
                <ImageOff size={80} className="text-zinc-400" />
              </div>
            </foreignObject>
          )}
        </g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M360 0C382.091 5.15408e-06 400 17.9086 400 40V560C400 582.091 382.091 600 360 600H40C17.9086 600 1.1276e-06 582.091 0 560V40C0 17.9086 17.9086 3.2213e-07 40 0H360ZM56 16C33.9086 16 16 33.9086 16 56V544C16 566.091 33.9086 584 56 584H344C366.091 584 384 566.091 384 544V56C384 33.9086 366.091 16 344 16H56Z"
          fill="#111219"
        />
        <path
          d="M15 51C15 31.1178 31.1177 15 51 15H58V94C58 105.046 49.0457 114 38 114H15V51Z"
          fill="#111219"
        />
        <path
          d="M387 51C387 31.1178 370.882 15 351 15H342V94C342 105.046 350.954 114 362 114H387V51Z"
          fill="#111219"
        />
        {/* Defense Number */}
        <text
          x="368"
          y="65"
          fontFamily="Oswald, sans-serif" 
          fontSize="40" 
          fontWeight="600"
          fill="#E4E4E4"
          textAnchor="middle"
        >
          {def}
        </text>
        {/** Attack Number */}
        <text
          x="32"
          y="65"
          fontFamily="Oswald, sans-serif"
          fontSize="40"
          fontWeight="600"
          fill="#E4E4E4"
          textAnchor="middle"
        >
          {atk}
        </text>
        <path
          d="M41.3551 79.5603L31.9411 85.4598L35.4556 90.7316L33.3218 91.1082L28.552 87.5936L24.7864 89.602L23.0291 89.0999L22.527 87.3426L24.5354 83.577L21.0208 78.8072L21.3974 76.6734L26.6692 80.1879L32.5687 70.7739L40.0999 72.0291L41.3551 79.5603Z"
          fill="#E4E4E4"
        />
        <path
          d="M369.077 74.0464L378 76.7541L373.846 90.3525L369.077 94.8548V95L369 94.9274L368.923 95V94.8548L364.154 90.3525L360 76.7541L368.923 74.0464V74L369 74.0232L369.077 74V74.0464Z"
          fill="#E4E4E4"
        />
        {/* Text Area*/}
        <text
          x="30"
          y="580"
          fontFamily="Oswald, sans-serif"
          fontSize="20"
          fontWeight="400"
          fill="white"
          textAnchor="start"
        >
          {refinedName}
        </text>
      </g>
      <defs>
        <pattern
          id={`pattern0_21_2${identifier}`}
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <use xlinkHref={`#image0_21_2${identifier}`} transform="scale(0.004 0.00289017)" />
        </pattern>
        <clipPath id={`clip0_21_2${identifier}`}>
          <rect width={400} height={600} fill="white" />
        </clipPath>

        {refinedImage && (
          <image
            id={`image0_21_2${identifier}`}
            width={250}
            height={346}
            preserveAspectRatio="none"
            xlinkHref={refinedImage}
          />
        )}
        
      </defs>
    </svg>

  </>
}


