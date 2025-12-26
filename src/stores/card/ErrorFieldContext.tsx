import { createContext, use, useCallback, useState } from "react";

type PropsContext = {
  fieldError: Array<{
    key: string | number,
    message: string[],
 }>;
  addFieldError: (message: string[])=>void,
  updateFieldErrorByKey: (key:string|number, message: string[])=>void,
  updateFieldErrorByIndex: (index:number, message: string[])=>void,
  setFieldErrorByKey: (key:string|number, message: string[])=>void,
  deleteFieldErrorByKey: (key:string|number)=>void,
  deleteFieldErrorByIndex: (index:number)=>void,
  checkIfFieldErrorExistsByKey: (key:string|number)=>boolean,
  checkIfFieldErrorExistsByIndex: (index:number)=>boolean,
  checkAllHasNoError: ()=>boolean,
  getFieldErrorByKey: (key:string|number)=>{ key: string | number, message: string[] } | null,
  getFieldErrorByIndex: (index:number)=>{ key: string | number, message: string[] } | null,
  getFieldErrorQuick: (key:string|number)=>string[]|null,
};

export const ErrorFieldContext = createContext<PropsContext>(null!);

export function ErrorFieldProvider({children}:React.PropsWithChildren<{}>){
  const [keyCounter, keyCounterSet] = useState(
    0
  );

  const [fieldError, fieldErrorSet] = useState<PropsContext["fieldError"]>([]);

  const addFieldError = useCallback((message: string[])=>{
    fieldErrorSet((old)=>{
      const newFieldError = {
        key: keyCounter+1,
        message,
      };
      return [...old, newFieldError];
    });
    keyCounterSet((old)=>old+1);
  }, [keyCounter]);

  const updateFieldErrorByKey = useCallback((key: string | number, message: string[])=>{
    fieldErrorSet((old)=>{
      return old.map((f)=>{
        if(f.key !== key) return f;
        return {
          ...f,
          message,
        };
      });
    });
  }, []);

  const updateFieldErrorByIndex = useCallback((index: number, message: string[])=>{
    fieldErrorSet((old)=>{
      return old.map((f, i)=>{
        if(i !== index) return f;
        return {
          ...f,
          message,
        };
      });
    });
  }, []);

  //This is regardless if the key exists or not
  const setFieldErrorByKey = useCallback((key: string | number, message: string[])=>{
    fieldErrorSet((old)=>{
      const exists = old.some((f)=>f.key === key); 
      if(exists){
        return old.map((f)=>{
          if(f.key !== key) return f;
          return {
            ...f,
            message,
          };
        }
        );
      } else {
        const newFieldError = {
          key,
          message,
        };
        return [...old, newFieldError];
      }
    });
  }, []);


  const deleteFieldErrorByKey = useCallback((key: string | number)=>{
    fieldErrorSet((old)=>{
      return old.filter((f)=>{
        return f.key !== key;
      });
    });
  }, [fieldError]);

  const deleteFieldErrorByIndex = useCallback((index: number)=>{
    fieldErrorSet((old)=>{
      return old.filter((_, i)=>{
        return i !== index;
      });
    });
  }, [fieldError]);

  const checkIfFieldErrorExistsByKey = useCallback((key: string | number)=>{
    return fieldError.some((f)=>f.key === key);
  }, [fieldError]);

  const  checkIfFieldErrorExistsByIndex = useCallback((index: number)=>{
    return index >=0 && index < fieldError.length;
  }, [fieldError]);

  const checkAllHasNoError = useCallback(()=>{
    if(fieldError.length === 0) return true;
    if(fieldError.every((f)=>f.message.length <= 0)){
      return true;
    }
    return false;
  }, [fieldError]);

  const getFieldErrorByKey = useCallback((key: string | number)=>{
    return fieldError.find((f)=>f.key === key) || null;
  }, [fieldError]);

  const getFieldErrorByIndex = useCallback((index: number)=>{
    if(index < 0 || index >= fieldError.length) return null;
    return fieldError[index];
  }, [fieldError]);

  const getFieldErrorQuick = useCallback((key: string | number)=>{
    return fieldError.find((f)=>f.key === key)?.message || null;
  }, [fieldError]);

  return <ErrorFieldContext.Provider value={{
    fieldError: [],
    addFieldError,
    updateFieldErrorByKey,
    updateFieldErrorByIndex,
    setFieldErrorByKey,
    deleteFieldErrorByKey,
    deleteFieldErrorByIndex,
    checkIfFieldErrorExistsByKey,
    checkIfFieldErrorExistsByIndex,
    checkAllHasNoError,
    getFieldErrorByKey,
    getFieldErrorByIndex, 
    getFieldErrorQuick,
  }}>
    {children}
  </ErrorFieldContext.Provider>;
}