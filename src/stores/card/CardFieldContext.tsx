import type { typeCardCreate } from "@/types/fields/card/create";
import type { ObjectAddKey } from "@/types/fields/gemeral";
import { createContext, useCallback, useState, type PropsWithChildren } from "react";

type PropContext = {
  field: ObjectAddKey<typeCardCreate>[],
  getFieldByKey: (key:string|number)=>ObjectAddKey<typeCardCreate>|null,
  getFieldByIndex: (index:number)=>ObjectAddKey<typeCardCreate>|null,
  addField: ()=>void,
  updateFieldByKey: (key:string|number, updatedField:Partial<typeCardCreate>)=>void,
  updateFieldByIndex: (index:number, updatedField:Partial<typeCardCreate>)=>void,
  deleteFieldByKey: (key:string|number)=>void,
  deleteFieldByIndex: (index:number)=>void,
  contextGroupByKey: (key:string|number)=>{
    field: ObjectAddKey<typeCardCreate>,
    index: number,
    updateField: (updatedField:Partial<typeCardCreate>)=>void,
    deleteField: ()=>void,
  }|null,
  contextGroupByIndex: (index:number)=>{
    field: ObjectAddKey<typeCardCreate>,
    key: string|number,
    updateField: (updatedField:Partial<typeCardCreate>)=>void,
    deleteField: ()=>void,
  }|null,
}

export const CardFieldContext = createContext<PropContext>(null!);

export function CardFieldProvider({children}:PropsWithChildren<{}>){

  const [keyCounter, keyCounterSet] = useState(
		0
	);

  const [field, fieldSet] = useState<PropContext["field"]>([]);

  //---> Functionalities
  const getFieldByKey = useCallback((key: string | number)=>{
    const found = field.find((f)=>f.key === key);
    return found || null;
  }, [field]);

  const getFieldByIndex = useCallback((index: number)=>{
    if(index < 0 || index >= field.length) return null;
    return field[index];
  }, [field]);

  const addField = useCallback(()=>{
    fieldSet((old)=>{
      const newField: ObjectAddKey<typeCardCreate> = {
        key: keyCounter+1,
        name: "",
        atk: 0,
        def: 0,
        card_art: null!,
      };
      return [...old, newField];
    });
    keyCounterSet((old)=>old+1);
  }, [keyCounter]);

  const updateFieldByKey = useCallback((key: string | number, updatedField: Partial<typeCardCreate>)=>{
    fieldSet((old)=>{
      return old.map((f)=>{
        if(f.key !== key) return f;
        return {
          ...f,
          ...updatedField,
        };
      }
      );
    });
  }, []);

  const updateFieldByIndex = useCallback((index: number, updatedField: Partial<typeCardCreate>)=>{
    fieldSet((old)=>{
      return old.map((f, i)=>{
        if(i !== index) return f;
        return {
          ...f,
          ...updatedField,
        };
      }
      );
    });
  }, []); 

  const deleteFieldByKey = useCallback((key: string | number)=>{
    fieldSet((old)=>{
      return old.filter((f)=>f.key !== key);
    });
  }, []);

  const deleteFieldByIndex = useCallback((index: number)=>{
    fieldSet((old)=>{
      const newFields = [...old];
      newFields.splice(index, 1);
      return newFields;
    });
  }, []);

  const contextGroupByKey = useCallback((key: string | number)=>{
    const index = field.findIndex((f)=>f.key === key);
    if(index === -1) return null;
    return {
      field: field[index],
      index,
      updateField: (updatedField:Partial<typeCardCreate>)=>{
        updateFieldByKey(key, updatedField);
      },
      deleteField: ()=>{
        deleteFieldByKey(key);
      },
    };
  }, [field, updateFieldByKey, deleteFieldByKey]);

  const contextGroupByIndex = useCallback((index: number)=>{
    if(index < 0 || index >= field.length) return null;
    const key = field[index].key;
    return {
      field: field[index],
      key,
      updateField: (updatedField:Partial<typeCardCreate>)=>{
        updateFieldByIndex(index, updatedField);
      },
      deleteField: ()=>{
        deleteFieldByIndex(index);
      },
    };
  }, [field, updateFieldByIndex, deleteFieldByIndex]);

  return <CardFieldContext.Provider value={{
    field,
    getFieldByKey,
    getFieldByIndex,
    addField,
    updateFieldByKey,
    updateFieldByIndex,
    deleteFieldByKey,
    deleteFieldByIndex,
    contextGroupByKey,
    contextGroupByIndex,
  }}>
    {children}
  </CardFieldContext.Provider>
}