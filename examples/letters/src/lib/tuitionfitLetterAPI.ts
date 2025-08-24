import axios from 'axios'; 
import { TuitionFitLetterRequest, TuitionFitLetterResponse } from '../types';

const TUITIONFIT_LETTER_URL='<redacted>'
const TUITIONFIT_API_KEY='<redacted>'

export const submitLetter = async (request: TuitionFitLetterRequest, turnstileToken: string | null): Promise<string> => {
  if (!turnstileToken) {
    throw new Error("Turnstile token must be supplied");
  }

  const response = await axios.post(TUITIONFIT_LETTER_URL, request, {
    headers: {
      'X-API-Key': TUITIONFIT_API_KEY,
      'X-Turnstile-Token': turnstileToken,
    }
  });
  return response.data.id;
};

export const getLetterStatus = async (uuid: string, turnstileToken: string | null): Promise<TuitionFitLetterResponse> => {
  if (!turnstileToken) {
    throw new Error("Turnstile token must be supplied");
  }
  
  const response = await axios.get(`${TUITIONFIT_LETTER_URL}/${uuid}`, {
    headers: {
      'X-API-Key': TUITIONFIT_API_KEY,
      'X-Turnstile-Token': turnstileToken,
    }
  });
  return response.data as TuitionFitLetterResponse;
};