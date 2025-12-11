import { randomUUID } from "node:crypto";

export async function uploadCardImage({env, id = randomUUID(), file}:{env: Env, id?:string, file: File}) {
  const result = await env.CARD_ART_IMAGES.put(id, file, {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: 'inline',
    }
  });
  if(!result) {
    console.error("Failed to upload card image to R2");
    return null;
  }
  return id;
}

export async function getCardImage({env, id}:{env: Env, id:string}) {
  const result = await env.CARD_ART_IMAGES.get(id);
  
  if (!result) {
    return null;
  }
  
  // Convert R2ObjectBody to File
  const blob = await result.blob();
  const file = new File([blob], id, {
    type: result.httpMetadata?.contentType || 'application/octet-stream',
    lastModified: result.uploaded.getTime()
  });
  return file;
}

export async function deleteCardImage({env, id}:{env: Env, id:string}) {
  await env.CARD_ART_IMAGES.delete(id);
}

