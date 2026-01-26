import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { DiceRollLog } from '../types';

/**
 * Saves a dice roll to the campaign log
 */
export const logDiceRoll = async (
  campaignId: string,
  characterName: string,
  rollName: string,
  rolls: number[],
  total: number,
  breakdown?: string
): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid || '';
    
    const rollLog: Omit<DiceRollLog, 'id'> = {
      campaignId,
      userId,
      characterName,
      rollName,
      rolls,
      total,
      timestamp: Date.now(),
      breakdown
    };

    await addDoc(collection(db, 'diceRolls'), rollLog);
  } catch (error) {
    console.error('Error logging dice roll:', error);
    // Don't throw - logging failures shouldn't break the app
  }
};
