// import { listOfIndexedDb } from "./indexedDBDefinition";
import { listOfStorage } from "./localStorageDefinition";
import { UseDB } from "@jsarmyknife/native--storage";
import { Storage } from "@jsarmyknife/native--storage";

export const currentVersion = 1;

export function isVersionChange(updater: () => void) {
	const versionContainer = new Storage("storageVersion");
	if (versionContainer.isExist() && versionContainer.get() == currentVersion) {
		return;
	} else {
		//Emptied when there is new version;
		updater();
		versionContainer.store(currentVersion);
	}
}

export function updateStorageVersion() {
	isVersionChange(() => {
		// IndexedDb
		// listOfIndexedDb.forEach((x) => {
		// 	new UseDB(x, currentVersion).delete();
		// });

		// Local Storage
		const l = listOfStorage.map((x) => new Storage(x));
		l.forEach((x) => {
			x.remove();
		});
	});
}
