export function getRandomChar(){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

export function getRandomString(length: number){
  let result = '';
  for(let i = 0; i < length; i++){
    result += getRandomChar();
  }
  return result;
}