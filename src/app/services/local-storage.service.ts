import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }


  /**
   * Session stroage is used
   * @param key
   * @param value
   */
  saveToStorage(key:string, value:string){
    sessionStorage.setItem(key,value);
  }


  /**
   * Clear the session storage
   */
  clearStorage(){
    sessionStorage.clear()
  }


  /**
   * fetches the item from the localstorage
   * @param key
   */
  getItemFromStorage(key:string):string{
    return sessionStorage.getItem(key)
  }

}
