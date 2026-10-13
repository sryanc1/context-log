import {useEffect, useState} from 'react';
import { subscribeToItemActivity } from '../services/firebase';
import type { ActivityEntry } from '../types/items';

export function useItemActivity(uid: string, itemId: string, enabled: boolean) {
    
}