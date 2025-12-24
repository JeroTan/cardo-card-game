import type { RefineValidationData } from "@/types/api/result";
import type { ValidationError } from "elysia";

export function handleTypeboxError(error: Readonly<ValidationError>): Array<RefineValidationData> {
  const result = new Map<string, string[]>();
  // Recursive function to process errors and their nested errors
  function processError(err: any, parentPath: string = "") {
    // Check if err has the full ValueError structure
    if ('path' in err && ('message' in err || ('schema' in err && err?.schema?.error))) {
      // Construct the full path
      let fullPath = err.path === "" || err.path === "/" ? parentPath : err.path;
      if (parentPath && fullPath && fullPath !== "/") {
        fullPath = parentPath + (fullPath.startsWith("/") ? "" : "/") + fullPath;
      }
      
      // Convert path: empty or "/" becomes "_", otherwise replace "/" with "."
      const field = fullPath === "" || fullPath === "/" ? "_" : fullPath.replace(/^\//, "").replace(/\//g, ".");
      const message = err?.schema?.error || err.message || err.summary || "Invalid value";
      
      if (result.has(field)) {
        result.get(field)!.push(message);
      } else {
        result.set(field, [message]);
      }
      
      // Recursively process nested errors
      if ('errors' in err && Array.isArray(err.errors) && err.errors.length > 0) {
        for (const nestedErr of err.errors) {
          processError(nestedErr, fullPath);
        }
      } else if (err.errors?.length === 0 && err.schema) {
        // If errors array is empty but we have a schema, extract required fields
        extractFieldsFromSchema(err.schema, fullPath || "");
      }
    } else if (err.summary) {
      // Fallback to just summary if path is not available
      const field = parentPath === "" || parentPath === "/" ? "_" : parentPath.replace(/^\//, "").replace(/\//g, ".");
      if (result.has(field)) {
        result.get(field)!.push(err.summary);
      } else {
        result.set(field, [err.summary]);
      }
    }
  }
  
  // Extract fields from schema when validation fails at root level
  function extractFieldsFromSchema(schema: any, basePath: string) {
    if (!schema) return;
    
    // Handle object schema
    if (schema.type === 'object' && schema.properties) {
      const requiredFields = schema.required || [];
      for (const fieldName of requiredFields) {
        const fieldPath = basePath ? `${basePath}/${fieldName}` : fieldName;
        const field = fieldPath.replace(/^\//, "").replace(/\//g, ".");
        const fieldSchema = schema.properties[fieldName];
        
        // Generate appropriate error message based on field type
        let errorMsg = `Required field`;
        if (fieldSchema?.type) {
          errorMsg = `Expected ${fieldSchema.type}`;
        }
        
        if (!result.has(field)) {
          result.set(field, [errorMsg]);
        }
        
        // Recursively extract nested fields
        if (fieldSchema) {
          extractFieldsFromSchema(fieldSchema, fieldPath);
        }
      }
    }
    
    // Handle array schema - extract first item as example (index 0)
    if (schema.type === 'array' && schema.items) {
      const arrayItemPath = basePath ? `${basePath}/0` : "0";
      extractFieldsFromSchema(schema.items, arrayItemPath);
    }
  }
  
  // Process all errors
  for (const err of error.all) {
    processError(err);
  }
  
  // Convert map to array
  return Array.from(result.entries()).map(([field, errors]) => ({
    field,
    error: errors,
  }));
}
