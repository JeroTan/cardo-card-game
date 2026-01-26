import { Sprite, Container } from "pixi.js";

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