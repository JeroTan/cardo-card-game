import { Sprite, Container } from "pixi.js";
import { useEffect, useRef } from "react";

export function findLabelCardInPixi(container: Container|Sprite): Sprite|Container | null {
	for (const child of container.children) {
		if (child.label === "card") {
			return child;
		}
		const found = findLabelCardInPixi(child);
		if (found) return found;
	}
	return null;
}


export function UtilityContainer({
	children,
	graphicData,
	onClick,
	onMouseEnter,
}:{
	children?: React.ReactNode,
	graphicData?: (graphic: Container|Sprite|null)=>void,
	onClick?: (graphic: Container|Sprite|null)=>void,
	onMouseEnter?: ()=>void,
}){
	const ref = useRef<Container|null>(null);

	useEffect(()=>{
		if(ref.current == null) return;
		const container = ref.current;
		graphicData?.(container.children.length > 0 ? container.children[0] : container);
	}, [ref.current]);
	
	return <pixiContainer
		ref={ref}
		{...(onClick ? {
			eventMode: "dynamic",
			cursor: "pointer",
			onClick: ()=>{ onClick(ref.current); },
		} : {})}

		{...((onMouseEnter) ? {
			onMouseEnter: onMouseEnter,
		} : {})}
	>
		{/* Utility Container */}
		{children}
	</pixiContainer>
}