import { Storage } from "@jsarmyknife/native--storage";

//-----------------------------------------------------------------------------//
//               Local Storage                                                 //
//-----------------------------------------------------------------------------//
export const listOfStorage = [
	"adminAuthToken",
] as const;
export type LOCAL_STORAGE_KEY = (typeof listOfStorage)[number];

export function resetLocalStorage({includes=[], exceptions = []}: {includes?: LOCAL_STORAGE_KEY[], exceptions?: LOCAL_STORAGE_KEY[]}) {
	listOfStorage.filter((x)=>{
    if(includes.length < 1) return true;
    return includes.includes(x);
  }).forEach((x) => {
		const stored = new Storage(x);
		if (stored.isExist() && !exceptions.includes(x)) {
			stored.remove();
		}
	});
}

export function makeStorage<T>(key: LOCAL_STORAGE_KEY) {
	return new Storage<T>(key);
}
